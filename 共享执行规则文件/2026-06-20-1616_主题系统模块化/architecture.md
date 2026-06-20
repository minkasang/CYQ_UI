# 架构设计 — 主题系统模块化

> 任务：2026-06-20-1616_主题系统模块化
> 参考：healthy-architecture skill、macOS-design skill

---

## 一、质量目标映射

| 质量属性 | 实现方式 |
|----------|---------|
| **可扩展性** | 主题=快照，新增引擎只需注册，不影响已有主题 |
| **可维护性** | 主题数据与UI分离，ThemeStore 纯数据，ThemePage 纯展示 |
| **兼容性** | 现有 ThemeManager/ThemeStore 接口不动，上层扩展 |
| **可测试性** | 主题CRUD为纯数据操作，可独立单元测试 |
| **性能效率** | 主题切换只改 CSS 变量 + 引擎参数，无重渲染 |

---

## 二、数据模型

### 2.1 主题快照（核心）

```ts
interface ThemePreset {
  id: string              // 唯一ID (uuid)
  name: string            // 显示名称
  engine: 'liquid-glass' | 'flat' | string  // 引擎类型
  params: Record<string, number | string | boolean>  // 全部参数(平铺)
  font: {
    family: string        // 字体栈
    baseSize: number      // 基础字号(px)
  }
  wallpaper: WallpaperConfig  // 壁纸配置(复用现有类型)
  isBuiltin: boolean      // 内置不可删
  createdAt: number       // 时间戳
}
```

### 2.2 积木关系

```
ThemePreset (主题快照)
├── engine: string          → 决定 ThemePage 配置面板显示哪些参数滑块
├── params: Record          → 引擎专属参数(折射率/模糊度/边框/...)
├── font                    → 字体积木
│   ├── family: string
│   └── baseSize: number
└── wallpaper               → 壁纸积木
    └── WallpaperConfig (复用现有类型)
```

### 2.3 内置主题

```ts
const BUILTIN_THEMES: ThemePreset[] = [
  {
    id: 'builtin-glass',
    name: '默认玻璃',
    engine: 'liquid-glass',
    params: { refraction: 0.69, blurAmount: 0, cornerRadius: 24, ... },
    font: { family: 'var(--font-sans)', baseSize: 13 },
    wallpaper: { type: 'gradient', value: 'linear-gradient(...)' },
    isBuiltin: true,
  },
  {
    id: 'builtin-flat',
    name: '暗黑扁平',
    engine: 'flat',
    params: { borderWidth: 1, cornerRadius: 8, ... },
    font: { family: 'var(--font-sans)', baseSize: 13 },
    wallpaper: { type: 'color', value: '#0a0a0a' },
    isBuiltin: true,
  },
]
```

---

## 三、文件结构

```
src/
├── store/
│   └── useThemePresetStore.ts    # [新增] 主题预设 Store
├── themes/
│   ├── ThemeManager.ts           # [不动]
│   ├── ThemeLoader.ts            # [不动]
│   ├── engines/
│   │   ├── LiquidGlassEngine.ts  # [不动]
│   │   └── FlatThemeEngine.ts    # [不动]
│   └── presetRegistry.ts         # [新增] 引擎元信息注册表
├── modules/
│   └── theme/                    # [新增] 主题模块
│       ├── index.ts              # 模块注册
│       └── pages/
│           └── ThemePage.tsx     # 三栏主题管理页面
├── components/
│   └── theme/                    # [新增] 主题UI组件
│       ├── ThemeList.tsx         # 左侧主题列表
│       ├── ThemePreview.tsx      # 中间预览(实时应用)
│       ├── ThemeConfig.tsx       # 右侧配置面板
│       ├── ParamSlider.tsx       # 通用参数滑块
│       └── FontConfig.tsx        # 字体配置
├── pages/
│   └── ThemePage.tsx             # [不动] 旧主题演示页(可移除)
└── data/
    └── theme_presets.json        # [新增] 主题预设数据文件
```

---

## 四、数据流

```
                    ┌──────────────┐
                    │ ThemePage    │
                    │ (三栏布局)    │
                    └──┬───┬───┬──┘
           ┌──────────┘   │   └──────────┐
           ▼              ▼              ▼
    ┌──────────┐  ┌───────────┐  ┌───────────┐
    │ThemeList │  │Preview    │  │Config     │
    │(左侧)    │  │(实时应用)  │  │(参数面板) │
    └────┬─────┘  └─────┬─────┘  └─────┬─────┘
         │              │              │
         └──────┬───────┴──────┬───────┘
                ▼              ▼
         ┌──────────────────────────┐
         │  useThemePresetStore     │
         │  - presets: ThemePreset[]│
         │  - activeId: string      │
         │  - addPreset()           │
         │  - removePreset()        │
         │  - applyPreset()  ←──────┤──→ 调用 ThemeManager.switchTheme()
         │  - saveToFile()          │     调用 useThemeStore 更新
         └────────────┬─────────────┘     调用 useWallpaperStore 更新
                      │                   调用字体设置
                      ▼
               data/theme_presets.json
```

### applyPreset 流程

```
applyPreset(preset):
  1. 加载引擎 → ThemeManager.switchTheme(preset.engine, preset.params)
  2. 应用字体 → document.documentElement.style.fontFamily = preset.font.family
                document.documentElement.style.fontSize = preset.font.baseSize + 'px'
  3. 应用壁纸 → useWallpaperStore.setCurrent(preset.wallpaper)
```

---

## 五、组件接口

### ThemeList（左侧）

```tsx
<ThemeList
  presets={presets}
  activeId={activeId}
  onSelect={(id) => void}
  onDelete={(id) => void}      // 仅自定义主题可删
  onImport={() => void}         // 导入 JSON
  onExport={(id) => void}       // 导出 JSON
/>
```

### ThemeConfig（右侧）

```tsx
<ThemeConfig
  preset={activePreset}
  engineMeta={engineMeta}       // 引擎参数元信息(哪些滑块、范围)
  onChange={(patch) => void}    // 修改参数
  onSave={() => void}           // 保存为新主题
/>
```

### 引擎参数元信息注册

```ts
// presetRegistry.ts
interface EngineMeta {
  id: string
  name: string
  params: ParamDef[]            // 引擎专属参数定义
}

interface ParamDef {
  key: string                   // 参数名
  label: string                 // 显示名
  type: 'slider' | 'toggle' | 'color' | 'number'
  min?: number
  max?: number
  step?: number
  defaultValue: number | string | boolean
}

// 注册
registerEngineMeta('liquid-glass', {
  name: '液态玻璃',
  params: [
    { key: 'refraction', label: '折射率', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.69 },
    { key: 'blurAmount', label: '模糊度', type: 'slider', min: 0, max: 2, step: 0.1, defaultValue: 0 },
    ...
  ]
})
```

**关键**：ThemeConfig 面板根据 `activePreset.engine` 查找对应的 `EngineMeta`，动态渲染参数滑块。

---

## 六、错误处理

| 场景 | 策略 |
|------|------|
| 引擎不存在 | 显示「引擎不可用」，禁用该主题 |
| 参数越界 | 滑块自动 clamp 到 min/max |
| JSON 导入格式错误 | Toast 提示「无效的主题文件」 |
| 删除内置主题 | 按钮 disabled，tooltip「内置主题不可删除」 |
| 保存失败(文件写入) | Toast 提示，保留内存状态 |

---

## 七、架构健康自查

| 检查项 | 状态 |
|--------|:--:|
| 模块职责清晰 | ✅ Store管数据，Page管UI，Engine管渲染 |
| 接口稳定 | ✅ ThemeManager/ThemeStore 接口不动 |
| 接口深度 | ✅ applyPreset 一个方法隐藏引擎+字体+壁纸三步 |
| 依赖方向正确 | ✅ Store → Engine，UI → Store |
| 错误有处理 | ✅ 见上表 |
| 可测试 | ✅ CRUD 纯数据，applyPreset 可 mock |
| 无过度设计 | ✅ 参数不分类，平铺存储 |
| 副作用隔离 | ✅ applyPreset 集中处理副作用 |

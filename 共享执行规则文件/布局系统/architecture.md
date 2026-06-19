# 架构设计 - 页面布局系统 v3

> 设计参考：healthy-architecture（6大维度）+ macos-design（原生App布局）+ apple-design（色彩/间距/字体）

---

## 1. 设计目标

将"页面骨架"从"页面内容"中分离。切换布局 = 换壳，内容（待办/日记/AI/设置）不变。

```
┌────────────── Shell ──────────────┐
│  TopBar (可选)                     │
│  ┌────────┬──────────────────────┐ │
│  │Sidebar │  {children}          │ │
│  │(可选)  │   页面内容            │ │
│  └────────┴──────────────────────┘ │
└────────────────────────────────────┘
```

---

## 2. 六大设计维度

### 2.1 设计原则

#### 单一职责

| 模块 | 职责 | 唯一变更原因 |
|------|------|-------------|
| `LayoutShell` 组件（每个布局一个） | 定义页面骨架的 DOM 结构 + 样式 | 该布局的视觉调整 |
| `LayoutRegistry` store | 管理可用布局列表 + 当前选中 | 新增/删除布局 |
| `App.tsx` | 根据 registry 选择当前 shell 渲染 children | 路由变化 |
| 页面内容组件 | 纯业务逻辑，不知道布局存在 | 业务需求 |

#### 开闭原则

- **扩展**：新增布局 = 新建一个 `LayoutShell` 组件 + 注册到 registry
- **不修改**：已有布局、页面内容、路由都不动

#### 接口隔离

```typescript
// 每个 LayoutShell 的接口 —— 极简
interface LayoutShellProps {
  children: React.ReactNode  // 页面内容，shell 不关心是什么
}

// Registry 的接口
interface LayoutRegistryState {
  layouts: LayoutInfo[]       // 可用布局列表
  activeId: string            // 当前激活的布局 ID
  setActive: (id: string) => void
  register: (info: LayoutInfo) => void  // 注册新布局
}
```

#### 组合优于继承

- Shell 之间不继承，每个是独立组件
- 共享的 UI 片段（如 TopBar 变体）用组合复用，不用 class 继承

#### 最少知识

- 页面内容只知道 `React.children`，不知道有 Sidebar/TopBar/布局
- Shell 只知道"渲染 children 在某个位置"，不知道 children 是什么页面

### 2.2 项目结构

```
src/
├── layouts/                    # 布局壳组件（每个布局一个文件）
│   ├── DefaultLayout.tsx       # 初始布局（保存现在的样子）
│   ├── MacOSLayout.tsx         # macOS 风格
│   ├── FullWidthLayout.tsx     # 无侧栏全宽（占位）
│   └── TopNavLayout.tsx        # 顶栏导航（占位）
├── store/
│   └── useLayoutRegistry.ts    # 布局注册表（Zustand persist）
└── App.tsx                     # 用 registry 选 shell 包裹 routes
```

### 2.3 接口与契约

#### LayoutShell 契约

```typescript
// 所有布局壳必须遵循此接口
type LayoutShell = React.FC<{ children: React.ReactNode }>

// 布局元信息
interface LayoutInfo {
  id: string
  name: string
  description: string
  icon: string
  shell: LayoutShell       // 布局壳组件引用
  isBuiltin: boolean
}
```

#### 向后兼容

- 新增布局字段（如 `animationPreset`）提供默认值
- 导入的旧 JSON 缺失字段 → 填充默认值
- 删除布局时，自动回退到 `default`

### 2.4 错误处理

| 场景 | 策略 | 处理 |
|------|------|------|
| 布局组件渲染崩溃 | 容错降级 | ErrorBoundary 兜底，回退到 DefaultLayout |
| 导入 JSON 格式错误 | 容错降级 | 返回 `{ success: false, error }`，Toast |
| 删除当前激活的布局 | 容错降级 | 自动切换到 default |
| 注册了无效的 shell | fail-fast | TypeScript 类型检查阻止 |

### 2.5 数据流与状态管理

```
                    ┌──────────────────────┐
                    │  LayoutRegistry      │  ← 单源真值
                    │  layouts: Info[]     │
                    │  activeId: string    │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │      App.tsx         │
                    │  const Shell =       │
                    │    getShell(activeId) │
                    │  <Shell>             │
                    │    <Routes />        │
                    │  </Shell>            │
                    └──────────────────────┘
```

**单向数据流**：
- Registry 存元信息
- App 读取 `activeId` → 找到对应 Shell 组件 → 渲染
- 用户切换布局 → `setActive(id)` → App 重渲染
- 导出：序列化 `LayoutInfo`（不含 shell 引用，只存元数据 + 样式参数）
- 导入：反序列化 + 注册到 registry

**不可变数据**：
- `layouts` 数组操作创建新数组，不修改原数组

### 2.6 可测试性

| 测试 | 方法 |
|------|------|
| Registry 的 setActive/register/import/export | 纯逻辑，直接调函数验证 |
| Shell 组件渲染 | 传入 children 验证 DOM 结构 |
| 切换布局 | 渲染 App，模拟 setActive，检查 Shell 是否变化 |

---

## 3. 四个布局

### 3.1 初始布局 `default`

当前页面的样子，一字不改。
```
┌─────────────────────────────────────────┐
│              TopBar                      │
├────────┬────────────────────────────────┤
│Sidebar │  {children}  (max-w-6xl mx-auto)│
│        │                                │
└────────┴────────────────────────────────┘
```

### 3.2 macOS 风格 `macos`

严格遵循 macos-design skill：
- 顶栏高度 ~50px，可拖拽区域
- 侧边栏 240px，可选折叠
- 内容区 8px 网格间距
- 内容最大宽度 1200px，居中
- 字体：-apple-system, 13px body
- 侧边栏用 vibrancy blur 效果
```
┌─────────────────────────────────────────┐
│              TopBar (~50px)              │
├────────┬────────────────────────────────┤
│Sidebar │  {children}                    │
│240px   │  max-w-[1200px] mx-auto        │
│vibrancy│  space-y-4                      │
│blur    │                                │
└────────┴────────────────────────────────┘
```

### 3.3 无侧栏全宽 `fullwidth`

- 顶栏精简（只保留核心操作）
- 无侧边栏
- 内容全宽，padding 24px
```
┌─────────────────────────────────────────┐
│        TopBar (compact)                  │
├─────────────────────────────────────────┤
│                                         │
│          {children}  (w-full p-6)        │
│                                         │
└─────────────────────────────────────────┘
```

### 3.4 顶栏导航 `topnav`

- 顶栏包含水平导航菜单
- 无侧边栏
- 内容区最大宽度 1200px
```
┌─────────────────────────────────────────┐
│  Logo  首页 待办 日记 AI  设置          │
├─────────────────────────────────────────┤
│                                         │
│          {children}  max-w-[1200px]      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 4. 导出/导入格式

```json
{
  "version": "1",
  "layout": {
    "id": "my-custom-layout",
    "name": "我的布局",
    "description": "自定义 macOS 变体",
    "shell": "macos",           // 基于哪个内置 shell
    "overrides": {              // 自定义覆盖
      "sidebarWidth": 200,
      "contentMaxWidth": 1400,
      "topBarStyle": "compact"
    }
  }
}
```

**注意**：导出的不是代码，是配置参数。导入后基于内置 shell + 参数覆盖重建布局。

---

## 5. 实现步骤

| 步骤 | 内容 | 文件 |
|------|------|------|
| 1 | 创建 `layouts/DefaultLayout.tsx`（搬现有代码） | 1 新文件 |
| 2 | 创建 `layouts/MacOSLayout.tsx` | 1 新文件 |
| 3 | 创建 `layouts/FullWidthLayout.tsx`（占位） | 1 新文件 |
| 4 | 创建 `layouts/TopNavLayout.tsx`（占位） | 1 新文件 |
| 5 | 创建 `store/useLayoutRegistry.ts` | 1 新文件 |
| 6 | 修改 `App.tsx`：用 Shell 包裹 Routes | 修改 |
| 7 | 在设置页嵌入 LayoutManager（切换/导入/导出） | 修改 |

---

## 6. 质量属性检查

| 属性 | 保证 |
|------|------|
| ✅ 可扩展 | 新增布局 = 新建文件 + 注册一行 |
| ✅ 可维护 | 布局独立，改 A 不影响 B |
| ✅ 可测试 | Shell 纯组件，Registry 纯逻辑 |
| ✅ 可靠性 | persist 持久化，导入失败回退 |
| ✅ 可移植 | 导出 JSON 跨设备迁移 |
| ✅ 无过度设计 | 只用必要抽象：Shell 组件 + Registry 对象 |

## 7. 禁止行为检查

- ❌ 壳组件之间没有继承关系
- ❌ 页面内容不知道布局存在（无隐式依赖）
- ❌ 不为尚未存在的需求预留字段（v3/v4 是占位，实际是空壳）
- ❌ 导出的是配置 JSON，不是代码字符串

# 架构说明 (AI 专用)

> **本文件专为 AI 助手编写**，解释项目架构、约定、扩展点

## 1. 整体架构

### 1.1 数据流

```
用户操作
  ↓
React 组件
  ↓
Zustand Store (内存状态)
  ↓  ↘
localStorage   派生选择器
(持久化)        (统计数据)
```

### 1.2 路由结构

| 路径 | 页面 | 主要组件 |
|------|------|----------|
| `/` | HomePage | 仪表盘：统计 + 今日待办 + 最近日记 + 快捷入口 |
| `/todo` | TodoPage | 待办管理：TodoList + TodoInput + TodoItem |
| `/diary` | DiaryPage | 日记：DiaryList + DiaryEditor (左编辑右预览) |
| `/ai` | AIPage | AI 总结：AISummary + APIConfig |
| `/wallpaper` | WallpaperPage | 壁纸管理：WallpaperManager |
| `/settings` | SettingsPage | 设置：APIConfig + GlassControlPanel + 数据管理 |

所有页面通过 `Layout` 组件包裹，共享 `Sidebar` + `TopBar` + `GlobalBackground`。

## 2. Store 架构

### 2.1 Store 列表

| Store | 文件 | 数据 | 持久化 key |
|-------|------|------|-----------|
| `useTodoStore` | `store/useTodoStore.ts` | todos 数组 | `pw_todos` |
| `useDiaryStore` | `store/useDiaryStore.ts` | diaries 数组 | `pw_diaries` |
| `useAIConfigStore` | `store/useAIConfigStore.ts` | AIConfig 对象 | `pw_ai_config` |
| `useWallpaperStore` | `store/useWallpaperStore.ts` | current + history | `pw_wallpaper_current` + `pw_wallpaper_history` |
| `useSettingsStore` | `store/useSettingsStore.ts` | AppSettings (含 GlassConfig) | `pw_settings` |

### 2.2 Store 模式

每个 Store 都遵循统一模式：

```typescript
// 1. 状态定义
interface XxxState {
  data: T[]
  // ... 其他状态
  addXxx: (data: ...) => void
  updateXxx: (id: string, patch: Partial<T>) => void
  deleteXxx: (id: string) => void
}

// 2. 创建 store（自动持久化）
export const useXxxStore = create<XxxState>((set, get) => ({
  data: loadFromStorage<T[]>(STORAGE_KEYS.XXX, []),
  addXxx: (data) => {
    const newData = [data, ...get().data]
    set({ data: newData })
    saveToStorage(STORAGE_KEYS.XXX, newData)
  },
  // ...
}))

// 3. 派生选择器
export const selectXxx = (state: XxxState) => {
  // 业务逻辑
  return ...
}
```

## 3. 类型系统

所有类型定义在 `src/types/index.ts`，按功能模块分组：

- **Todo**: 待办数据类型
- **Diary**: 日记数据类型
- **AIConfig**: AI 配置
- **AIMessage**: AI 消息
- **Wallpaper**: 壁纸类型
- **GlassConfig**: 玻璃效果配置
- **AppSettings**: 全局设置
- **ExportData**: 导出数据格式

**约定**：新增数据类型必须在此文件定义，并加入 `ExportData` 接口。

## 4. 工具函数

### 4.1 `utils/storage.ts`

封装 localStorage 操作，统一管理 key 命名（`pw_` 前缀）。

```typescript
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'

// 读取
const todos = loadFromStorage<Todo[]>(STORAGE_KEYS.TODOS, [])

// 保存
saveToStorage(STORAGE_KEYS.TODOS, newTodos)
```

### 4.2 `utils/date.ts`

日期格式化、解析、相对时间。

```typescript
import { formatDate, relativeTime, getToday } from '../utils/date'
```

### 4.3 `utils/export.ts`

数据导入导出（JSON 格式）。

```typescript
import { downloadExport, importData } from '../utils/export'
```

## 5. 玻璃效果

### 5.1 两种玻璃组件

| 组件 | 路径 | 实现 | 适用场景 |
|------|------|------|----------|
| `FluidGlass` | `components/glass/FluidGlass.tsx` | 包装 liquid-glass-react | 高级效果（边缘变形、弹性） |
| `GlassPanel` | `components/glass/GlassPanel.tsx` | 纯 CSS backdrop-filter | 降级方案、Firefox/Safari |

### 5.2 玻璃参数

定义在 `useSettingsStore` 的 `settings.glass` 中，可在 `GlassControlPanel` 中调节。

```typescript
interface GlassConfig {
  mode: 'standard' | 'polar' | 'prominent' | 'shader'
  displacementScale: number  // 0-200
  blurAmount: number         // 0-2
  saturation: number         // 0-300
  aberrationIntensity: number // 0-10
  elasticity: number         // 0-1
  cornerRadius: number       // 0-50
}
```

### 5.3 未来扩展

如果需要从**光学玻璃**（WebGL）切换为**流体玻璃**（SVG）：
- 在 `components/glass/` 添加 `OpticalGlass.tsx`
- 在 `useSettingsStore` 添加 `glassType: 'fluid' | 'optical'` 字段
- 创建一个 `GlassSwitcher` 组件让用户切换

## 6. AI 服务架构

### 6.1 适配器模式

```
AISummary (UI 组件)
  ↓
chat(config, options) (统一入口)
  ↓
callOpenAICompatible() | callAnthropic()
  ↓
fetch (HTTP)
```

### 6.2 添加新的 AI 服务

1. 在 `useAIConfigStore.ts` 的 `AI_PRESETS` 中添加预设
2. 在 `types/index.ts` 的 `AIProvider` 联合类型中添加
3. 如果是 OpenAI 兼容协议，无需修改 `aiService.ts`
4. 如果是其他协议（如 Google Gemini），在 `aiService.ts` 添加适配函数

## 7. 数据导入/导出

### 7.1 导出格式

```json
{
  "version": "0.1.0",
  "exportedAt": 1718428800000,
  "todos": [...],
  "diaries": [...],
  "wallpapers": [...],
  "settings": {...}
}
```

### 7.2 导入策略

- 导入会**覆盖**当前 localStorage 中的数据
- 导入后会自动刷新页面
- 失败时显示错误信息

## 8. 编码约定

### 8.1 命名
- 组件文件：PascalCase（如 `TodoList.tsx`）
- 工具文件：camelCase（如 `storage.ts`）
- 类型/接口：PascalCase
- 函数/变量：camelCase

### 8.2 注释
- **必须中文注释**（来自项目知识库 A 级约束）
- 关键函数必须有 JSDoc 风格注释
- 组件 props 必须有 TypeScript 类型

### 8.3 文件组织
- 每个功能模块独立目录
- 组件、store、类型、工具分离
- 一个文件不超过 300 行（建议）

## 9. 性能优化点

1. **玻璃组件重渲染**：壁纸变化时，liquid-glass-react 可能需要重新挂载。可以在 `FluidGlass` 组件外加 `key={wallpaperId}` 强制重渲染。
2. **Markdown 渲染**：长日记渲染可能慢。可以在 `DiaryEditor` 中加 debounce（800ms 已实现）。
3. **AI 流式响应**：避免频繁 setState 引起闪烁。在 `aiService.ts` 中已经做了优化（流式 chunk 累积）。
4. **图片懒加载**：壁纸图片可能很大。建议在 v0.3 添加 `<img loading="lazy">`。

## 10. 扩展建议

### v0.2 添加警醒墙

1. 在 `types/index.ts` 添加 `Reminder` 接口
2. 创建 `store/useReminderStore.ts`
3. 创建 `components/reminder/` 目录
4. 在 `pages/` 添加 `ReminderPage.tsx`
5. 在 `App.tsx` 添加路由

### v0.2 添加灵感记录

类似日记，但更轻量（只有标题+内容，无日期）

### v0.3 添加云同步

1. 选择云服务（推荐 Supabase，免费额度足够个人用）
2. 在 `utils/` 添加 `cloudSync.ts`
3. 在 `useSettingsStore` 添加同步状态
4. 在 `SettingsPage` 添加同步开关

## 11. 已知问题

- liquid-glass-react 在某些浏览器下性能较差（5+ 个同时显示会卡）
- IndexedDB 暂未使用（v0.1 全用 localStorage，可能有容量限制）
- AI 服务的流式响应在某些网络下不稳定（已做降级处理）
- 移动端未适配（v0.1 桌面端专用）

## 12. 调试技巧

### 12.1 查看 localStorage
打开 DevTools → Application → Local Storage

### 12.2 清空所有数据
```javascript
// 在 Console 中执行
Object.keys(localStorage).filter(k => k.startsWith('pw_')).forEach(k => localStorage.removeItem(k))
location.reload()
```

### 12.3 调节玻璃效果不生效
检查：
1. 浏览器是否支持 backdrop-filter
2. 父元素是否设置了 position
3. z-index 是否被遮挡

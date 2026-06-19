# 架构设计 - 待办功能增强（修订版）

## 设计概述

经过代码分析，原有 4 阶段计划中 90%+ 功能已实现。剩余 2 个功能：任务搜索 + 导出增强。

---

## 步骤 1：任务搜索

### 模块职责
- **搜索逻辑**：驻留在 `TodoList.tsx`，不创建新组件
- **职责**：纯 UI 过滤，不修改 store

### 数据流
```
用户输入 → useState(searchQuery)
  → useMemo 过滤 todos（标题/内容/标签模糊匹配）
  → DndContext 接收过滤后列表
  → 拖拽仍操作原始 store（不受搜索影响）
```

### 接口设计
```typescript
// TodoList.tsx 内部
const [searchQuery, setSearchQuery] = useState('')

// 过滤逻辑（useMemo，依赖 searchQuery + todos）
const filteredTodos = useMemo(() => {
  if (!searchQuery.trim()) return allFilteredTodos
  const q = searchQuery.toLowerCase()
  return allFilteredTodos.filter(todo =>
    todo.title.toLowerCase().includes(q) ||
    (todo.content?.toLowerCase().includes(q)) ||
    todo.tags.some(tagId => {
      const tag = allTags.find(t => t.id === tagId)
      return tag?.name.toLowerCase().includes(q)
    })
  )
}, [allFilteredTodos, searchQuery, allTags])
```

### UI 位置
- 搜索框放在过滤器选项卡上方
- 样式：与现有设计一致（暗色玻璃输入框）
- 支持 Esc 清空搜索

### 验证方式
- tsc 类型检查
- 手动：输入关键词 → 列表实时过滤 → Esc 清空

---

## 步骤 2：配置文件导出增强

### 问题诊断
当前 `export.ts` 使用 `loadFromStorage`（localStorage），但实际数据存储在 JSON 文件中（通过 `fileStorage` API）。**导出读的是错误数据源**。

### 修复方案

#### 数据源修正
将 `exportAllData` 从同步改为异步，改用 `loadFromFile` 读取正确的 JSON 文件：

```typescript
// exportAllData 改为 async
export async function exportAllData(): Promise<ExportData> {
  const [todos, diaries, settings, wallpaper, apiKeys, projects, tags, achievements] =
    await Promise.all([
      loadFromFile<Todo[]>(FILE_KEYS.TODOS, []),
      loadFromFile<Diary[]>(FILE_KEYS.DIARIES, []),
      loadFromFile<AppSettings>(FILE_KEYS.SETTINGS, {} as AppSettings),
      loadFromFile<WallpaperData>(FILE_KEYS.WALLPAPER, {}),
      loadFromFile<APIKeyConfig>(FILE_KEYS.API_KEYS, {}),
      loadFromFile<Project[]>(FILE_KEYS.PROJECTS, []),
      loadFromFile<Tag[]>(FILE_KEYS.TAGS, []),
      loadFromFile<Achievement[]>(FILE_KEYS.ACHIEVEMENTS, []),
    ])

  return {
    version: APP_VERSION,
    exportedAt: Date.now(),
    todos, diaries, settings,
    wallpaper,
    apiKeys,
    projects, tags,
    achievements,
  }
}
```

#### 导出数据扩展
新增字段 vs 原有：

| 字段 | 原有 | 修订 |
|------|------|------|
| `version` | ✅ | ✅ |
| `exportedAt` | ✅ | ✅ |
| `todos` | ✅ | ✅ (改数据源) |
| `diaries` | ✅ | ✅ (改数据源) |
| `settings` | ✅ | ✅ (改数据源) |
| `wallpapers` | ✅ | ✅ (改数据源) |
| `apiKeys` | ❌ | ✅ 新增 |
| `projects` | ❌ | ✅ 新增 |
| `tags` | ❌ | ✅ 新增 |
| `achievements` | ❌ | ✅ 新增 |

#### 导入修正
`importData` 同步改为异步，使用 `saveToFile` 而非 `localStorage.setItem`。

### 涉及文件
| 文件 | 变更 |
|------|------|
| `src/utils/export.ts` | 重写：async + fileStorage 数据源 + 扩展字段 |
| `src/types/index.ts` | 扩展 `ExportData` 接口 |
| `src/modules/settings/pages/SettingsPage.tsx` | `handleExport`/`handleImport` 改为 async |

### 质量属性检查

| 属性 | 设计保证 |
|------|----------|
| 可靠性 | `loadFromFile` 有 fallback 容错，导出失败不阻塞 |
| 可维护性 | 导出/导入对称设计，字段一一对应 |
| 可扩展性 | `ExportData` 接口可随时加字段 |
| 可测试性 | `exportAllData`/`importData` 为纯函数，可独立测试 |
| 安全性 | API keys 导出时脱敏提示 |

---

## 禁止行为检查

- ❌ 不创建新组件（搜索复用 TodoList，导出复用 SettingsPage）
- ❌ 不修改 store 结构
- ❌ 不改变现有数据流
- ❌ 不引入新依赖

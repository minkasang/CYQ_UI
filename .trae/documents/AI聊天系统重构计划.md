# AI 聊天系统重构计划

> 创建时间：2026-06-17  
> 更新：新增架构防 Bug 设计 + 每提供商多 Key + 每步骤测试方案

---

## 1. 概要

在保留首页嵌入的前提下，重构 AI 聊天系统。核心目标不是"加功能"，而是**建立健康架构，从设计层面消除 Bug 温床**。

---

## 2. 架构 Bug 根源分析

### 2.1 当前架构的 6 个 Bug 温床

| # | Bug 温床 | 现有代码的表现 | 会出什么 Bug |
|---|---------|--------------|-------------|
| 1 | **双源真值** | 全局 `useAIConfigStore` + per-chat `provider/model`，两边互相 sync | 切换对话时模型串号：对话A配了DeepSeek，切到对话B又切回来，模型变成了OpenAI |
| 2 | **竞态条件** | `useEffect` 监听 `activeChatId` 做 async sync | 快速切 3 个对话 → 3 个 useEffect 排队执行 → 最后一个跑的覆盖了所有 |
| 3 | **巨型函数** | `handleSend` 170 行，图片/视频/文本/流式全在一个 if-else | 改图片逻辑可能破坏文本逻辑，任何改动都要通读 170 行 |
| 4 | **隐式依赖** | ChatPanel 导入 `useAIConfigStore` 拿 provider/model，但真正来源是 per-chat store | 新人看代码以为 provider 来自全局 store，改全局 → 聊天炸了 |
| 5 | **无请求 ID** | 异步请求不绑定 chatId，完成时直接 `addMessage(activeChatId)` | 请求发出后切了对话 → 回复写进了错误对话 |
| 6 | **混合关注点** | API 调用 + 状态管理 + UI 渲染全在组件里 | 没法单独测试发送逻辑，只能手动点 UI 测 |

### 2.2 防 Bug 设计原则

| 原则 | 具体规则 | 防止的 Bug |
|------|---------|-----------|
| **单源真值** | 每个数据只有一个所有者。对话的 provider/model 属于 `useChatStore`，`useAIConfigStore` 只存全局默认值，ChatPanel 永不读全局 store | 双源真值 |
| **请求 ID 绑定** | 每次 `handleSend` 生成 `requestId`，异步完成后校验 `activeChatId` 是否匹配 | 竞态条件 |
| **纯逻辑提取** | 发送逻辑 → 独立函数 `sendTextMessage(config, options)`，不依赖 React | 巨型函数、不可测试 |
| **显式数据流** | ChatPanel 只通过 props 传数据给子组件，子组件不直读 store | 隐式依赖 |
| **防御性清理** | 每次发送前 abort 旧请求，组件卸载时 abort 所有 | 内存泄漏、消息写错 |

---

## 3. 健康架构设计

### 3.1 数据流（单源真值）

```
useAPIKeysStore (全局)
  └─ keys: Record<Provider, KeyEntry[]>   ← API Key 不分对话，共享
  └─ activeKeyId: Record<Provider, id>    ← 每提供商当前激活的 Key
  
useChatStore (对话级)
  └─ chats[i].provider                    ← 对话 A 的模型提供商
  └─ chats[i].model                       ← 对话 A 的模型名称
  └─ chats[i].messages                    ← 对话 A 的消息列表
  └─ activeChatId                         ← 当前选中的对话

useAIConfigStore (全局，仅非聊天场景)
  └─ AIPage、SettingsPage 使用           ← ChatPanel 永远不读这个 store
```

**关键规则：ChatPanel 读 provider/model 的唯一来源 = `activeChat.provider` / `activeChat.model`**

### 3.2 组件树（显式数据流）

```
ChatPanel (容器，唯一读 store 的组件)
  │  state: reasoningEnabled, streamReasoning, apiModalOpen
  │  logic: handleSend, handleNewChat, handleDeleteChat
  │
  ├── ChatSidebar (纯展示 + 事件回调)
  │     props: chats, activeChatId, onSelect, onNew, onDelete, onOpenAPIModal
  │     0 个 store 导入
  │
  ├── ChatMessages (纯展示)
  │     props: messages, streamContent, streamReasoning, loading, ...
  │     0 个 store 导入
  │
  ├── ChatInput (纯展示 + 事件回调)
  │     props: provider, model, availableKeys, onProviderChange, onSend, ...
  │     0 个 store 导入
  │
  └── APIKeyModal (弹窗，直接读 useAPIKeysStore)
        props: open, onClose
        1 个 store 导入（useAPIKeysStore，因为是独立的配置界面）
```

### 3.3 发送消息流程（请求 ID 绑定）

```ts
// ChatPanel 内
const handleSend = (text: string) => {
  const requestChatId = activeChatId  // ← 快照当前对话 ID
  const requestId = genId()           // ← 本次请求唯一 ID
  
  // 1. 先 abort 上一个请求（如果有）
  abortRef.current?.abort()
  abortRef.current = new AbortController()
  
  // 2. 原子操作：添加用户消息
  addMessage(requestChatId, 'user', text)
  
  // 3. 异步调用（纯函数，不依赖组件状态）
  sendTextMessage(config, options, abortRef.current.signal)
    .then(result => {
      // 4. 竞态守卫：只有对话没变才写入
      if (useChatStore.getState().activeChatId === requestChatId) {
        addMessage(requestChatId, 'assistant', result.content)
      }
      // 否则静默丢弃
    })
    .catch(err => {
      if (useChatStore.getState().activeChatId === requestChatId) {
        addMessage(requestChatId, 'assistant', `错误: ${err.message}`)
      }
    })
}
```

### 3.4 Store 操作原子性

每个修改对话的操作必须是一次 `set` + 一次 `saveToFile`，不存在中间状态：

```ts
// ✅ 正确：一次 set 完成所有修改
set({ chats: newChats, activeChatId: newActiveId })
saveToFile(...)

// ❌ 禁止：分两次 set
set({ chats: newChats })
// ... 中间可能出异常 ...
set({ activeChatId: newActiveId })
```

---

## 4. 实施步骤

### S1 — Store 层：多 Key 数据模型 + 类型扩展

**涉及文件：** `types/index.ts`、`useAPIKeysStore.ts`、`useAIConfigStore.ts`

**改动：**

1. `types/index.ts` — 新增类型：
```ts
export interface APIKeyEntry {
  id: string        // 唯一标识
  label: string     // 用户标签："主Key"、"备用"
  key: string       // Key 值
  createdAt: number
}

export interface ModelCapabilities {
  reasoning?: boolean
  vision?: boolean
  imageGen?: boolean
  videoGen?: boolean
}
```

2. `useAPIKeysStore.ts` — 从 `Record<Provider, string>` 改为 `Record<Provider, APIKeyEntry[]>` + `activeKeyId`：
```ts
interface APIKeysState {
  keys: Record<AIProvider, APIKeyEntry[]>
  activeKeyId: Record<AIProvider, string | null>
  loaded: boolean
  
  addKey: (provider: AIProvider, key: string, label?: string) => string
  removeKey: (provider: AIProvider, keyId: string) => void
  setActiveKey: (provider: AIProvider, keyId: string) => void
  getActiveKey: (provider: AIProvider) => string | undefined
  getActiveKeyEntry: (provider: AIProvider) => APIKeyEntry | undefined
  getKeys: (provider: AIProvider) => APIKeyEntry[]
  hasKey: (provider: AIProvider) => boolean
  hasAnyKey: () => boolean
}
```

3. `useAIConfigStore.ts` — `PROVIDER_MODELS` 每条增加 `capabilities`：
   - `deepseek-reasoner` → `{ reasoning: true }`
   - `gpt-4o` → `{ reasoning: true, vision: true }`
   - `claude-3-opus-20240229` → `{ reasoning: true, vision: true }`
   - `agnes-image-*` → `{ imageGen: true }`
   - `agnes-video-*` → `{ videoGen: true }`
   - 其余文本模型省略 capabilities
   - 新增 `isReasoningModel(provider, modelId)` 导出函数

**测试方案：**
- 浏览器控制台：`addKey('deepseek', 'sk-test1', '主')` → `addKey('deepseek', 'sk-test2', '备用')` → `getActiveKey('deepseek')` 返回 `sk-test1`
- `setActiveKey('deepseek', id2)` → `getActiveKey('deepseek')` 返回 `sk-test2`
- `removeKey('deepseek', id1)` → 剩余 1 个，`getActiveKey` 自动切到剩余的
- `isReasoningModel('deepseek', 'deepseek-reasoner')` → `true`
- 刷新页面 → 数据不丢失
- **通过条件：** 增删切换全部正常，持久化 OK，模型能力标记正确

---

### S2 — Service 层：深度思考 + 请求 ID 安全

**涉及文件：** `aiService.ts`

**改动：**

1. `ChatOptions` 增加 `onReasoning` 和 `reasoningEffort`：
```ts
interface ChatOptions {
  messages: AIMessage[]
  stream?: boolean
  onChunk?: (text: string) => void
  onReasoning?: (text: string) => void       // 新增
  signal?: AbortSignal
  reasoningEffort?: 'low' | 'medium' | 'high' // 新增
}
```

2. `handleStream()` — 解析 `delta.reasoning_content`：
```ts
const delta = json.choices[0]?.delta
if (delta?.content && options.onChunk) {
  options.onChunk(delta.content)
}
if (delta?.reasoning_content && options.onReasoning) {
  options.onReasoning(delta.reasoning_content)
}
```

3. `chat()` — reasoning 模型时自动传递 `reasoning_effort`

**安全约束（不在此步骤实现，但设计要预留）：**
- `aiService` 不感知 chatId，不管理请求生命周期
- AbortController 由调用方（ChatPanel）传入和管理
- 所有错误通过 throw 传递，不静默吞掉

**测试方案：**
- 选 `deepseek-reasoner` → 发送 "1+1等于几"
- Network 面板确认请求 body 含 `reasoning_effort`
- 控制台确认 `onReasoning` 被调用
- 正常模型（deepseek-chat）不传 `reasoning_effort`，不触发 `onReasoning`
- **通过条件：** reasoning 参数正确传递，非 reasoning 模型不受影响

---

### S3 — 组件层：拆分子组件（先建文件，不改 ChatPanel）

**涉及文件（新建）：**
- `个人工作台/src/components/chat/ChatSidebar.tsx`
- `个人工作台/src/components/chat/ChatMessages.tsx`
- `个人工作台/src/components/chat/ChatInput.tsx`

**设计原则（防 Bug）：**
- 三个子组件都是**纯展示组件**，0 个 store 导入
- 所有数据通过 props 进入，所有事件通过 callback 传出
- 不持有任何异步状态，不发起任何网络请求

**ChatSidebar.tsx** — 对话列表
```tsx
interface ChatSidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onOpenAPIModal: () => void
}
```

**ChatMessages.tsx** — 消息列表 + Markdown 渲染
```tsx
interface ChatMessagesProps {
  messages: Message[]
  streamContent: string
  streamReasoning?: string
  loading: boolean
  progress: number
  progressStatus: string
  containerRef: React.RefObject<HTMLDivElement>
}
```
- `react-markdown` + `remark-gfm` 渲染 Markdown
- 可折叠"思考过程"区域
- 消息 hover 显示复制按钮
- 图片/视频保留现有渲染逻辑

**ChatInput.tsx** — 输入区 + 模型选择器
```tsx
interface ChatInputProps {
  provider: AIProvider
  model: string
  loading: boolean
  hasKey: boolean
  availableKeys: APIKeyEntry[]
  activeKeyId: string | null
  modelSupportsReasoning: boolean
  reasoningEnabled: boolean
  onProviderChange: (p: AIProvider) => void
  onModelChange: (m: string) => void
  onSend: (text: string) => void
  onCancel: () => void
  onToggleReasoning: (enabled: boolean) => void
  onOpenAPIModal: () => void
  onSwitchKey: (keyId: string) => void
}
```
- 模型下拉菜单用 `useRef` + `getBoundingClientRect()` 动态定位
- 模型按能力分组：文本 / 推理 / 图片 / 视频
- 推理模型时显示"深度思考"开关

**测试方案：**
- TypeScript 编译通过（子组件尚未被引用，只验证语法）
- 每个子组件的 prop 类型导出正确
- **通过条件：** 3 个新文件无编译错误

---

### S4 — 整合：ChatPanel 重构为容器

**涉及文件：** `ChatPanel.tsx`（重写）

**核心改动（防 Bug 措施）：**

1. **单源真值** — 移除 `useEffect` 同步，移除 `useAIConfigStore` 导入：
```tsx
// ✅ 所有配置从 activeChat 读取
const provider = activeChat?.provider || 'deepseek'
const model = activeChat?.model || 'deepseek-chat'

// ✅ 切换模型：只写 per-chat store
const handleProviderChange = (p: AIProvider) => {
  updateChatModel(activeChatId!, p, PROVIDER_MODELS[p][0].id)
}

// ✅ API Key：读 useAPIKeysStore（Key 是全局限的）
const activeKeyEntry = useAPIKeysStore(s => 
  s.keys[provider]?.find(k => k.id === s.activeKeyId[provider])
)
```

2. **请求 ID 绑定** — 每次发送携带 chatId，完成时校验：
```tsx
const handleSend = (text: string) => {
  const requestChatId = activeChatId
  abortRef.current?.abort()
  abortRef.current = new AbortController()
  
  addMessage(requestChatId, 'user', text)
  
  sendTextMessage(...).then(result => {
    if (useChatStore.getState().activeChatId === requestChatId) {
      addMessage(requestChatId, 'assistant', result.content)
    }
  }).catch(err => {
    if (useChatStore.getState().activeChatId === requestChatId) {
      addMessage(requestChatId, 'assistant', `错误: ${err.message}`)
    }
  })
}
```

3. **纯逻辑提取** — 发送逻辑从组件中抽离
4. **高度** `h-[500px]` → `h-[600px]`

**测试方案：**
- 对话A选DeepSeek → 对话B选OpenAI → 切回A → 确认仍显示DeepSeek
- 快速切 3 次对话 → 消息写入正确对话
- 发送中切对话 → 旧请求被 abort，消息不污染其他对话
- 发送中卸载组件 → 无内存泄漏（控制台无 warning）
- 流式输出、图片/视频生成、取消请求功能不变
- **通过条件：** 对话隔离 + 竞态安全 + 所有现有功能正常

---

### S5 — APIKeyModal 新建

**涉及文件（新建）：** `APIKeyModal.tsx`

弹窗布局：
```
┌─ API Key 管理 ──────────────────────────────┐
│  [DeepSeek]                                  │
│    ● sk-xxxx....xxxx  [主Key]  [测试] [删除]  │
│    ○ sk-yyyy....yyyy  [备用]   [测试] [删除]  │
│    [+ 添加 Key]                               │
│  [OpenAI]     未配置             [配置]        │
│  ...                                          │
│                          [导入] [导出 JSON]    │
└───────────────────────────────────────────────┘
```

- ● = 当前激活，○ = 非激活
- "测试"：`fetch(baseUrl/models, { Authorization })` 验证
- 导入/导出 JSON
- Key 掩码显示（`sk-xx...xx`）
- 此组件自己读 `useAPIKeysStore`（它是独立配置界面，不是 ChatPanel 的子组件）

**测试方案：**
- 打开弹窗 → 添加 2 个 DeepSeek Key → 切换激活 → 删除一个 → 关闭弹窗 → 重新打开 → 数据保留
- 测试连接 → 正确 Key 显示成功，错误 Key 显示失败
- 导出 JSON → 删除全部 → 导入 → 恢复原样
- **通过条件：** 增删改查切换测试导入导出全部正常

---

### S6 — 接入 + SettingsPage

**涉及文件：** `ChatPanel.tsx`、`SettingsPage.tsx`

- `ChatSidebar` 底部 + `ChatInput` 无 Key 时 → 点击打开 APIKeyModal
- `SettingsPage` 替换旧 Key 管理为 Modal 入口
- `APIKeyManager.tsx` 不再被引用

**测试方案：**
- 首页聊天区 → "API 管理"按钮可用 → 弹窗正常
- SettingsPage → "管理 API Key"可用 → 弹窗正常
- **通过条件：** 两入口均可打开弹窗

---

### S7 — 首页尺寸 + 全局测试

**涉及文件：** `HomePage.tsx`

- ChatPanel 内部高度 `h-[600px]`
- Section padding `py-10`

**全局测试（11 项）：**

| # | 测试项 | 操作 | Bug 类型覆盖 |
|---|--------|------|------------|
| T1 | 对话隔离 | A选DeepSeek→B选OpenAI→切回A | 单源真值 |
| T2 | 快速切换 | 快速切3次对话后发消息 | 竞态条件 |
| T3 | 中间切对话 | 发送中切对话→消息写入正确对话 | 请求ID绑定 |
| T4 | 深度思考 | 选reasoner→发消息→折叠/展开思考过程 | 新功能 |
| T5 | 流式输出 | 发消息→文字逐字出现 | 回归 |
| T6 | 多Key切换 | 加2个Key→切换→确认用当前激活Key | 新功能 |
| T7 | API弹窗 | 增删Key→关闭→聊天立即生效 | 状态同步 |
| T8 | Markdown | 发代码块/表格→渲染正确 | 新功能 |
| T9 | 图片/视频生成 | 选图片/视频模型→生成 | 回归 |
| T10 | 取消请求 | 发送后点取消 | 回归 |
| T11 | 刷新持久化 | 操作后刷新→对话/Key不丢失 | 持久化 |

---

## 6. 检查发现的遗漏与修正

### 6.1 旧 api_keys.json 格式迁移（S1 补充）

当前文件存储为 `{ "deepseek": "sk-xxx", "openai": "sk-yyy" }`（`Record<Provider, string>`），新格式为 `{ "deepseek": [{ id, label, key }], ... }`。

`loadFromFile` 需要兼容旧格式：

```ts
loadFromFile: async () => {
  const raw = await loadFromFile<any>(FILE_KEYS.API_KEYS, {})
  
  // 旧格式迁移：string → APIKeyEntry[]
  const migrated: Record<AIProvider, APIKeyEntry[]> = {}
  const migratedActiveKeyId: Record<AIProvider, string | null> = {}
  
  for (const [provider, value] of Object.entries(raw)) {
    if (typeof value === 'string') {
      // 旧格式：单个字符串
      const id = genId()
      migrated[provider] = [{ id, label: '默认', key: value, createdAt: Date.now() }]
      migratedActiveKeyId[provider] = id
    } else if (Array.isArray(value) && value.length > 0) {
      // 新格式：数组，保留
      migrated[provider] = value
      const savedActiveId = raw._activeKeyId?.[provider]
      migratedActiveKeyId[provider] = savedActiveId && value.find(k => k.id === savedActiveId)
        ? savedActiveId
        : value[0].id
    }
  }
  
  set({ keys: migrated, activeKeyId: migratedActiveKeyId, loaded: true })
}
```

### 6.2 `addKey` / `removeKey` 边界处理（S1 补充）

- `addKey` 第一个 Key 时自动设为激活
- `removeKey` 删除激活的 Key 时，自动切换到该提供商剩余的第一个 Key；如果删光了，`activeKeyId[provider]` 置为 null

### 6.3 `isImageModel` / `isVideoModel` 改用 capabilities（S2 补充）

`aiService.ts` 中这两个函数当前做字符串匹配：

```ts
// 改造后：改为从 PROVIDER_MODELS 读取 capabilities
export function isImageModel(model: string): boolean {
  // 兼容：capabilities 优先，字符串匹配兜底
  return PROVIDER_MODELS_LOOKUP[model]?.capabilities?.imageGen 
    || /image|vision/i.test(model)
}
```

同样更新 `isVideoModel`。需要从 `useAIConfigStore.ts` 导出一个 `MODEL_CAPABILITIES` 查找表。

### 6.4 `AISummary.tsx` 也需要适配新 Store（S1/S6 补充）

`AISummary.tsx` 当前读取 `keys` 和 `hasKey`，格式变化后需要同步修改：

```tsx
// 修改前
const keys = useAPIKeysStore(s => s.keys)
const hasKey = useAPIKeysStore(s => s.hasKey)
const apiKey = useAPIKeysStore.getState().getKey(latestConfig.provider) || ''

// 修改后
const hasKey = useAPIKeysStore(s => s.hasKey)
// hasKey 逻辑不变（检查 keys[provider].length > 0）
const apiKey = useAPIKeysStore.getState().getActiveKey(latestConfig.provider) || ''
```

### 6.5 SettingsPage `useState` 副作用 Bug（S6 附带修复）

当前 SettingsPage 用 `useState(() => { loadKeys() })` 做初始化副作用，这不规范。S6 改为：

```tsx
useEffect(() => { loadKeys() }, [loadKeys])
```

### 6.6 ChatPanel 现有 `keys` 使用方式需要适配（S4）

当前 ChatPanel 中 `const keys = useAPIKeysStore(s => s.keys)` + `Object.keys(keys).some(p => hasKey(p))` 用于判断"是否有任何 Key"。S4 重写时改用 `hasAnyKey()`。

`getKey(provider)` 调用改为 `getActiveKey(provider)`。

---

## 7. 修订后的实施总览

| 步骤 | 内容 | 修改文件 | 改动要点 |
|------|------|------|---------|
| S1 | 多 Key 数据模型 + 模型能力 + 格式迁移 | `types/index.ts`, `useAPIKeysStore.ts`, `useAIConfigStore.ts`, `AISummary.tsx` | 旧格式兼容迁移、addKey/removeKey 边界、`hasKey`/`getActiveKey` |
| S2 | 深度思考 + isImageModel/isVideoModel 改 capabilities | `aiService.ts`, `useAIConfigStore.ts` | onReasoning、reasoningEffort、capabilities 查找表 |
| S3 | 子组件新建 | `ChatSidebar.tsx`, `ChatMessages.tsx`, `ChatInput.tsx` | 0 store 导入，纯 props |
| S4 | ChatPanel 重构 | `ChatPanel.tsx` | 单源真值、请求 ID 绑定、纯逻辑提取 |
| S5 | APIKeyModal 新建 | `APIKeyModal.tsx` | 独立读 store |
| S6 | 接入 + SettingsPage 修复 | `ChatPanel.tsx`, `SettingsPage.tsx` | Modal 入口 + 修复 useState 副作用 |
| S7 | 首页尺寸 + 全局 11 项测试 | `HomePage.tsx` | 高度 600px |

**每步骤必须测试通过才能进下一步。**

---

## 8. 假设

- `react-markdown` + `remark-gfm` 项目已有（v9.0），不新增依赖
- 深度思考 API：`reasoning_content` 字段（OpenAI 兼容规范）
- `APIKeyManager.tsx` 保留文件但不再引用
- 不新增 npm 依赖
- 净增 4 文件，修改 8 文件

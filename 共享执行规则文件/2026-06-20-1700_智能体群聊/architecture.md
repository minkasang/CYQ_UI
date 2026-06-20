# 架构设计 — 智能体群聊

> 设计参考：healthy-architecture（6大维度） + macOS 设计规范（玻璃风格）

---

## 一、质量目标

| 质量属性 | 如何保证 |
|----------|----------|
| **可靠性** | 本地文件存储，读取失败容错降级为空数组；写失败 toast 提示 |
| **可维护性** | Agent Store 与 Room Store 独立，各自单文件，接口清晰 |
| **可扩展性** | Agent 新增字段只需扩展类型 + 表单，不改 Room 逻辑；Room 新增属性同理 |
| **性能效率** | Zustand selector 精准订阅，不全局重渲染；列表无虚拟滚动（MVP 规模小） |
| **可测试性** | Store 纯逻辑可单测；组件接收 props 可集成测 |
| **安全性** | 纯本地存储，无外部请求；Agent 人设内容用户自控 |
| **兼容性** | JSON 格式持久化，加字段用可选属性，旧数据自动兼容 |
| **可移植性** | 纯前端模块，无后端依赖 |

---

## 二、设计原则

### 2.1 单一职责

| 模块 | 唯一职责 |
|------|----------|
| `useAgentStore` | Agent 的 CRUD + 查询 |
| `useRoomStore` | Room 的 CRUD + 成员管理 + 开关 |
| `AgentCard` | 渲染单个 Agent 卡片 |
| `AgentForm` | 创建/编辑 Agent 的表单逻辑 |
| `RoomCard` | 渲染单个 Room 卡片 |
| `RoomForm` | 创建 Room + 成员选择 |

### 2.2 开闭原则

- Agent 新增字段（如"头像 emoji"）：扩展类型 → 扩展表单 → 完成，不改 Store 方法签名
- Room 新增属性（如"自动关闭时间"）：同上

### 2.3 接口隔离

- 组件不依赖完整 Store，只用需要的 selector
- `AgentCard` 不关心 Room，`RoomCard` 只读 Agent 的 id+name，不读完整配置

### 2.4 组合优于继承

- 不创建基类，所有组件独立
- 共享 UI 模式用独立小组件组合

### 2.5 最少知识

- `useAgentStore` 不知道 Room 存在
- `useRoomStore` 只知道 Agent ID，不知道 Agent 内部结构
- 删除 Agent 时，`RoomStore` 通过回调清理引用

### 2.6 深度模块

| 模块 | 接口 | 隐藏的实现 |
|------|------|-----------|
| `useAgentStore` | `agents`, `add()`, `update()`, `remove()` | 文件读写、ID 生成、重名校验 |
| `useRoomStore` | `rooms`, `create()`, `delete()`, `toggleActive()`, `addMember()`, `removeMember()` | 成员关系维护、Agent 删除时级联清理 |

---

## 三、项目结构

```
个人工作台/src/
├── types/
│   └── agent.ts                      # AgentConfig + RoomConfig 类型
├── store/
│   ├── useAgentStore.ts              # Agent CRUD + 持久化
│   ├── useRoomStore.ts               # Room CRUD + 成员管理 + 持久化
│   └── __tests__/
│       ├── useAgentStore.test.ts
│       └── useRoomStore.test.ts
├── modules/agents/
│   ├── index.ts                      # 模块注册（待定，先走首页 Section）
│   └── pages/
│       ├── AgentSection.tsx           # 首页 Section 入口
│       ├── AgentManagePanel.tsx       # Agent 列表 + 新建/编辑
│       └── RoomManagePanel.tsx        # Room 列表 + 新建/管理
├── components/
│   └── agents/                        # 可复用子组件
│       ├── AgentCard.tsx
│       ├── AgentForm.tsx
│       ├── RoomCard.tsx
│       └── RoomForm.tsx
├── pages/
│   └── HomePage.tsx                   # 修改：新增 agents Section
└── data/
    ├── agents.json                    # Agent 持久化文件
    └── chatrooms.json                 # Room 持久化文件
```

### 改动现有文件

| 文件 | 改动 |
|------|------|
| `pages/HomePage.tsx` | 新增 agents Section（类似 inspiration） |
| `hooks/useModuleRoutes.tsx` | 如果需要模块路由，加 agents |
| `components/layout/Dock.tsx` | 如需底部图标，加 agents 入口 |
| `components/layout/Sidebar.tsx` | 如需侧边栏入口，加 agents |

---

## 四、接口与契约

### 4.1 类型定义

```typescript
// types/agent.ts

import type { AIProvider } from './index'  // 复用现有类型

export interface AgentConfig {
  id: string               // crypto.randomUUID()
  name: string             // 显示名
  provider: AIProvider     // deepseek / openai / claude ...
  model: string            // 具体模型 ID
  systemPrompt: string     // 人设
  replyProbability: number // 0.0 ~ 1.0
  cooldownMin: number      // 毫秒，最小冷却
  cooldownMax: number      // 毫秒，最大冷却
  createdAt: number
  updatedAt: number
}

export interface RoomConfig {
  id: string
  name: string
  agentIds: string[]       // 成员 Agent ID 列表
  isActive: boolean        // 总开关
  createdAt: number
}
```

### 4.2 Store 接口

```typescript
// useAgentStore 对外接口
interface AgentStore {
  agents: AgentConfig[]
  loaded: boolean

  load: () => Promise<void>
  add: (data: Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>) => AgentConfig
  update: (id: string, patch: Partial<AgentConfig>) => void
  remove: (id: string) => void
  getById: (id: string) => AgentConfig | undefined
}

// useRoomStore 对外接口
interface RoomStore {
  rooms: RoomConfig[]
  loaded: boolean

  load: () => Promise<void>
  create: (name: string, agentIds: string[]) => RoomConfig
  delete: (id: string) => void
  toggleActive: (id: string) => void
  addMember: (roomId: string, agentId: string) => void
  removeMember: (roomId: string, agentId: string) => void
  removeAgentFromAllRooms: (agentId: string) => void  // 级联清理
}
```

### 4.3 组件 Props 契约

```typescript
// AgentCard
interface AgentCardProps {
  agent: AgentConfig
  onEdit: () => void
  onDelete: () => void
}

// AgentForm（新建 / 编辑复用）
interface AgentFormProps {
  initial?: AgentConfig       // 编辑模式传入
  onSave: (data: AgentFormData) => void
  onCancel: () => void
}

// RoomCard
interface RoomCardProps {
  room: RoomConfig
  agents: AgentConfig[]       // 用于展示成员名
  onToggleActive: () => void
  onManage: () => void
  onDelete: () => void
}

// RoomForm
interface RoomFormProps {
  allAgents: AgentConfig[]    // 可选 Agent 列表
  initial?: RoomConfig        // 编辑模式
  onSave: (name: string, agentIds: string[]) => void
  onCancel: () => void
}
```

---

## 五、错误处理

| 场景 | 策略 |
|------|------|
| 文件读取失败 | 容错降级：初始化为空数组，不阻塞渲染 |
| 文件写入失败 | toast 错误提示，数据保留在内存中 |
| 名称重复 | 表单校验拦截，提示"名称已存在" |
| Agent 名为空 | 不允许提交，按钮 disabled |
| 人设（systemPrompt）为空 | 允许（默认人设由后续聊天逻辑补充） |
| 删除被 Room 引用的 Agent | 弹出确认："将从 N 个房间中移除"，确认后级联删除 |
| Room 名为空 | 不允许提交 |
| Room 未选 Agent | 允许创建空房间 |

---

## 六、数据流与状态管理

### 6.1 单向数据流

```
用户操作 → Store 方法 → 文件写入 → State 更新 → React 重渲染
```

```
Agent 删除流程：
  removeAgent(id)
    → useAgentStore.remove(id)          // 删除 Agent
    → useRoomStore.removeAgentFromAllRooms(id)  // 级联清理 Room 引用
    → 两个 Store 各自 saveToFile        // 持久化
    → UI 自动更新
```

### 6.2 状态归属

| 状态 | 归属 | 原因 |
|------|------|------|
| Agent 列表 | `useAgentStore` | 唯一数据源 |
| Room 列表 + 成员 | `useRoomStore` | 唯一数据源 |
| Agent 编辑状态 | `AgentForm` 本地 state | 纯 UI 状态，不共享 |
| Room 管理弹窗状态 | `AgentManagePanel` / `RoomManagePanel` | 同上 |
| 首页 Section 统计数据 | 派生数据，不存 | `agents.length` 实时计算 |

### 6.3 持久化

- `useAgentStore` → `data/agents.json`
- `useRoomStore` → `data/chatrooms.json`
- 复用现有 `fileStorage` 工具的 `loadFromFile` / `saveToFile`

---

## 七、可测试性设计

| 测试类型 | 测试内容 | 如何测 |
|----------|----------|--------|
| **单元测试** | Store CRUD 方法 | Mock `fileStorage`，测纯逻辑 |
| **单元测试** | 名称重复校验 | 构造已有 agents 列表，调 add 验证 |
| **单元测试** | 删除 Agent 级联清理 Room | 创建 agent + room，删 agent，验 room.agentIds |
| **单元测试** | 派生数据计算 | agents.length、rooms.filter 等 |
| **集成测试** | 表单提交流程 | render AgentForm，填表，点击保存，验回调参数 |
| **集成测试** | Room 成员选择 | render RoomForm，勾选 Agent，保存，验回调 |

### 副作用隔离

```
纯逻辑（测试覆盖）
  ├── Store 方法内的数据操作
  ├── 名称重复判断
  └── 级联清理逻辑

IO 操作（集成测试覆盖）
  ├── loadFromFile / saveToFile
  └── localStorage 读写
```

---

## 八、质量属性检查清单

| 检查项 | 状态 |
|--------|------|
| 模块职责清晰 | ✅ Agent / Room 分离，各自独立 Store |
| 接口稳定 | ✅ 类型定义简单，后续加字段只需扩展 |
| 接口深度 | ✅ Store 小接口（几个方法），隐藏文件读写 |
| 依赖方向正确 | ✅ Room → Agent（单向引用），Agent 不知道 Room |
| 错误有处理 | ✅ 文件失败容错、表单校验、级联确认 |
| 可测试 | ✅ Store 纯逻辑，mock fileStorage 即可 |
| 无过度设计 | ✅ 无抽象层，直接 Store → Component |
| 副作用隔离 | ✅ Store 方法先改内存再写文件 |

---

## 九、禁止行为检查

- ❌ 没有接口设计就直接写实现 → ✅ 本文档先于代码
- ❌ 深层继承链 → ✅ 无继承，纯组合
- ❌ 第一次重复就抽象 → ✅ 表单逻辑在各自组件内，不提前抽象
- ❌ 吞异常 → ✅ 文件错误 toast 提示
- ❌ 状态放在共享层但只被一个模块用 → ✅ Agent/Room 各自 Store，不混放

---

## 十、更新记录

| 时间 | 更新内容 |
|------|----------|
| 2026-06-20 | 创建架构设计 v1.0 |

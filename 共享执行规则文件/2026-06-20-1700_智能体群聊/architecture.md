# 架构设计 — 智能体群聊 v2.0

> 合并到现有 AI 聊天模块，遵守 healthy-architecture 六大设计维度
> 
> 不做：不引入假想缝、不过度抽象、不重复逻辑

---

## 质量目标 → 设计维度映射

| 质量属性 | 实现手段 | 涉及维度 |
|----------|----------|----------|
| **可扩展性** | ChatStrategy + AgentModule 双接口 | 设计原则、接口与契约 |
| **可维护性** | 单一职责、深度模块、局部性 | 设计原则、项目结构 |
| **可测试性** | 副作用隔离、依赖注入 | 可测试性设计 |
| **可靠性** | 容错降级、向后兼容 | 错误处理、接口与契约 |
| **性能效率** | 并行 Promise.allSettled、冷却机制 | 数据流 |
| **兼容性** | 旧 Chat 无 agents 字段 → 单 Agent 模式 | 接口与契约 |

---

## 一、设计原则

### 1.1 单一职责

| 模块 | 唯一职责 | 变更原因 |
|------|----------|----------|
| `useAgentStore` | Agent 实体的 CRUD + 持久化 | Agent 属性变更 |
| `useChatStore`（扩展） | Chat 的 CRUD + 消息管理（单/多 Agent 统一） | Chat 数据结构变更 |
| `EventDrivenStrategy` | 事件驱动的多 Agent 回复决策 | 互动策略变更 |
| `contextBuilder` | 组装 LLM 调用上下文 | prompt 格式变更 |
| `ChatPanel`（扩展） | 聊天 UI 容器 | 布局变更 |
| `AgentCard / AgentForm` | Agent 管理 UI | 表单字段变更 |

### 1.2 开闭原则

```
扩展点（开放）：
  ChatStrategy 接口   → 新增策略 = 新增文件，不改 ChatPanel/chatLoop
  AgentModule 接口    → 新增模块 = 新增文件，不改 ChatStrategy/contextBuilder

修改点（封闭）：
  ChatPanel 内部布局   → 只改 ChatPanel
  chatLoop 调度逻辑    → 只改 chatLoop
```

### 1.3 依赖反转

```
ChatPanel（高层）
  → 依赖 ChatStrategy 接口（抽象），不依赖 EventDrivenStrategy（实现）
  → 依赖 callLLM 回调（注入），不依赖 aiService（实现）

chatLoop（中层，纯逻辑）
  → 依赖 ChatStrategy 接口
  → 输出 Message[]，不接触 IO
```

### 1.4 深度模块

| 模块 | 接口 | 隐藏的实现 |
|------|------|-----------|
| `EventDrivenStrategy` | `onMessage()` 一个方法 | 多轮收敛、冷却管理、@提及解析、并行调度 |
| `contextBuilder` | `buildContext()` 一个函数 | 模块遍历、消息格式化、prompt 拼接、容错 |
| `useChatStore` | CRUD + messages + send | 文件读写、ID 生成、自动标题、未读标记 |
| `useAgentStore` | CRUD | 文件读写、重名校验 |

删除测试：
- 删除 `useAgentStore` → Agent 管理功能消失，复杂度分散到各 Agent 表单 → 它在赚位置 ✅
- 删除 `EventDrivenStrategy` → 多 Agent 互动消失但消息仍能收发（走 passive）→ 接口有意义 ✅

### 1.5 最少知识原则

- `ChatPanel` 不知道 `agentStore` 存在（通过 props 传入 agents）
- `EventDrivenStrategy` 不知道 LLM 怎么调（通过 `callLLM` 注入）
- `contextBuilder` 不知道聊天策略细节（只收 agent + messages）

### 组合优于继承

- 不创建 BaseStrategy 基类，每个策略独立实现 `ChatStrategy` 接口
- Agent 不继承任何基类，通过 `modules: AgentModule[]` 组合能力

---

## 二、项目结构

```
modules/ai/                          ← 现有模块，扩展
  ├── index.ts                        ← 不改
  ├── pages/
  │   ├── AIPage.tsx                  ← 不改
  │   ├── AgentSection.tsx            ← 新增：Agent 管理入口
  │   └── AgentManagePanel.tsx        ← 新增：Agent CRUD UI
  ├── chat/                           ← 聊天核心
  │   ├── ChatPanel.tsx               ← 扩展：支持 agents prop
  │   ├── ChatMessages.tsx            ← 不改
  │   ├── ChatInput.tsx               ← 扩展：多 Agent 状态提示
  │   ├── ChatSidebar.tsx             ← 扩展：显示 Agent 数量
  │   └── APIKeyModal.tsx             ← 不改
  ├── strategies/                     ← 新增：可拔插策略模块
  │   ├── types.ts                    ← ChatStrategy 接口
  │   ├── EventDrivenStrategy.ts      ← 事件驱动实现
  │   └── PassiveStrategy.ts          ← 被动模式实现
  ├── lib/                            ← 新增：纯逻辑模块
  │   └── contextBuilder.ts           ← 上下文构建
  └── modules/                        ← 新增：Agent 能力模块（预留）
      └── README.md

store/
  ├── useChatStore.ts                 ← 扩展：Chat 加 agents/strategy 字段
  ├── useAgentStore.ts                ← 已有，不改接口
  └── __tests__/
      ├── useAgentStore.test.ts       ← 已有
      └── useChatStore.test.ts        ← 扩展：多 Agent 消息测试

types/
  ├── agent.ts                        ← AgentConfig + ChatAgent + ChatStrategy 接口
  └── index.ts                        ← 不改

components/
  └── agents/                         ← 保留（AgentCard / AgentForm 复用）
      ├── AgentCard.tsx
      └── AgentForm.tsx
```

改动激进程度：

| 级别 | 文件 | 说明 |
|------|------|------|
| **不改** | AIPage, ChatMessages, APIKeyModal, aiService, index.ts | 完全不受影响 |
| **扩展字段** | useChatStore, ChatPanel, ChatInput, ChatSidebar | 加可选 prop/字段，旧逻辑完整保留 |
| **新增** | strategies/, lib/contextBuilder, AgentSection, AgentManagePanel | 全新代码，零影响现有功能 |

---

## 三、接口与契约

### 3.1 ChatStrategy 接口（小接口原则）

```typescript
// strategies/types.ts

export interface StrategyContext {
  agents: ChatAgent[]               // 本轮参与 Agent
  history: Message[]                 // 完整聊天记录（冻结快照）
  newMessage: Message                // 触发本轮的消息
  callLLM: (agent: ChatAgent, systemPrompt: string, history: Message[], instruction: string) => Promise<string | null>
}

export interface ChatStrategy {
  type: string
  /** 返回新产生的消息（Agent 回复），策略内部决定如何调度 */
  execute(ctx: StrategyContext): Promise<Message[]>
}
```

### 3.2 第一个适配器：EventDrivenStrategy

```
execute() →
  1. 解析 @提及
  2. 筛选参与者（排除冷却中 + 已回复者 + 发送者自己；
     @提及强制参与）
  3. Promise.allSettled 并行调用各 Agent
  4. 收集回复 → 加入 history → 检查是否需继续（新消息 + 有未发言者）
  5. 最多 3 轮，已回复者被排除
  6. 返回所有新消息
```

### 3.3 Chat 类型兼容（向后兼容）

```typescript
// 旧数据无 agents 字段 → 视为单 Agent 模式
function isMultiAgent(chat: Chat): boolean {
  return Array.isArray(chat.agents) && chat.agents.length > 0
}

// 旧数据无 strategy 字段 → 默认 event-driven
function getStrategy(chat: Chat): ChatStrategy {
  if (!chat.strategy || chat.strategy === 'event-driven') return eventDrivenStrategy
  if (chat.strategy === 'passive') return passiveStrategy
  return eventDrivenStrategy
}
```

### 3.4 输入校验归属

| 校验 | 位置 | 方式 |
|------|------|------|
| Agent 名不为空 | AgentForm | 按钮 disabled |
| Agent 名不重复 | useAgentStore.add | 返回 null |
| 消息不为空 | ChatInput | 按钮 disabled |
| API Key 存在 | callLLM 内部 | 返回 null，不抛异常 |
| 策略类型合法 | getStrategy | 默认 fallback |

---

## 四、错误处理

| 场景 | 策略 | 分类 |
|------|------|------|
| LLM 调用失败 | 返回 null，跳过该 Agent，继续处理其他 | 容错降级 |
| LLM 调用超时 | AbortController 15s 超时，返回 null | 容错降级 |
| 模块 getContext 失败 | console.warn，跳过该模块，不影响其他模块和 LLM 调用 | 容错降级 |
| Chat 文件读取失败 | 初始化为空数组 | 容错降级 |
| Agent 文件读取失败 | 初始化为空数组 + modules 默认 [] | 容错降级 |
| 策略执行异常 | catch 后返回空消息列表，UI 提示 | 容错降级 |

业务异常（用户可见）vs 技术异常（日志记录）：
- "Agent 未配置 API Key" → 技术异常，console.warn，UI 静默跳过
- "温度设为 3.0" → 业务异常，表单校验拦截

---

## 五、数据流与状态管理

### 5.1 单向数据流

```
用户输入 → ChatInput.onSend(text)
  → ChatPanel.handleSend(text)
    → addMessage(user, text)                 // Store 更新
    → strategy.execute({ agents, history, newMessage, callLLM })
      → for each agent: callLLM(...) → reply
    → for each reply: addMessage(agent, reply)  // Store 更新
  → UI 自动刷新（Zustand selector）
```

### 5.2 状态归属

| 状态 | 归属 | 原因 |
|------|------|------|
| Chat 消息列表 | useChatStore | 唯一数据源，持久化 |
| Agent 列表 | useAgentStore | 唯一数据源，持久化 |
| 当前对话 agentIds | Chat.agents（快照） | 创建 Chat 时复制，后续 Agent 改名不影响 |
| 冷却时间 | EventDrivenStrategy 内部 Map | 策略私有状态，不持久化 |
| 流式内容 | ChatPanel 本地 chatStates | UI 状态 |

### 5.3 快照策略

创建多 Agent Chat 时，将 Agent 的关键属性快照到 `ChatAgent`：
- Agent 改名 → 已有 Chat 中显示旧名（设计选择：保持历史一致性）
- Agent 删人设 → 已有 Chat 中人设不变
- Agent 删模型 → Chat 仍可用（API Key 是全局的）

---

## 六、可测试性设计

### 6.1 测试边界

```
单元测试（纯逻辑）：
  contextBuilder.buildContext()   ← mock modules
  EventDrivenStrategy.execute()   ← mock callLLM
  useAgentStore CRUD              ← mock fileStorage

集成测试（模块间）：
  ChatPanel + strategy + store    ← mock LLM

端到端测试：
  创建Agent → 创建多Agent Chat → 发消息 → 验证回复
```

### 6.2 依赖注入

```
ChatPanel 使用 strategy：
  <ChatPanel strategy={eventDrivenStrategy} agents={chat.agents} />

EventDrivenStrategy 使用 callLLM：
  strategy.execute({ ...callLLM })  -- callLLM 由 ChatPanel 注入

测试时：
  const mockLLM = vi.fn().mockResolvedValue('mock reply')
  const strategy = new EventDrivenStrategy()
  const replies = await strategy.execute({ ...ctx, callLLM: mockLLM })
```

---

## 七、架构健康检查清单

| 检查项 | 状态 |
|--------|------|
| 模块职责清晰 | ✅ AgentStore / ChatStore / Strategy 各司其职 |
| 接口稳定 | ✅ ChatStrategy 接口 1 个方法，AgentModule 接口 1 个方法 |
| 接口深度 | ✅ EventDrivenStrategy 复杂逻辑隐藏在 execute() 后面 |
| 依赖方向正确 | ✅ ChatPanel → Strategy 接口 ← EventDrivenStrategy |
| 错误有处理 | ✅ 每层有容错，单个 Agent 失败不阻塞全体 |
| 可测试 | ✅ 核心逻辑通过依赖注入，mock LLM 即可测试 |
| 无过度设计 | ✅ 1 个策略 + 1 个模块接口，无抽象工厂/注册中心 |
| 副作用隔离 | ✅ 纯逻辑（策略、contextBuilder）与 IO（LLM 调用、文件读写）分离 |
| 向后兼容 | ✅ 旧 Chat 无 agents → 走单 Agent 模式，零影响 |
| 删除测试 | ✅ 删 AgentStore → CRUD 功能消失；删 Strategy → 策略可换 passive |

---

## 八、禁止行为检查

- ❌ 无接口设计直接写实现 → ✅ types.ts 先行
- ❌ 深层继承链 → ✅ 接口 + 独立实现
- ❌ 链式调用穿过 3 对象 → ✅ ChatPanel → strategy.execute()
- ❌ 第一次重复就抽象 → ✅ EventDriven 和 Passive 是两个独立实现，证明接口有意义（两个适配器 = 真正的缝）
- ❌ 吞异常 → ✅ 每层 console.warn + 返回 null/空数组
- ❌ 状态放共享层但只被一个模块用 → ✅ cooling 在 Strategy 内部，不上升

---

## 九、更新记录

| 时间 | 更新内容 |
|------|----------|
| 2026-06-20 | v1.0 创建 |
| 2026-06-20 | v2.0 合并 AI 模块 + ChatStrategy + AgentModule 双可拔插接口 |

// Agent 与 Room 类型定义 + 可插拔模块架构 + 聊天策略接口
// 智能体群聊模块 v2.0
//
// 架构说明：
//   AgentConfig.modules —— Agent 能力扩展点（记忆/关系/工具）
//   ChatStrategy —— 聊天互动策略扩展点（事件驱动/被动/轮转）
//   新增能力 = 实现接口 + 注册，不修改现有代码。

import type { AIProvider } from './index'
import type { Message } from '../store/useChatStore'

// ============================================================
// AgentModule — 可插拔模块接口
// ============================================================

export interface AgentModuleContext {
  agent: AgentConfig
  messages: Message[]
  currentMessage?: Message
}

export interface AgentModuleResult {
  contextText: string
}

export interface AgentModule {
  type: string
  name: string
  enabled: boolean
  getContext: (ctx: AgentModuleContext) => Promise<AgentModuleResult>
}

// ============================================================
// ChatStrategy — 可插拔聊天策略接口
// ============================================================

/** Chat 中的 Agent 快照（创建时复制，后续 Agent 变更不影响） */
export interface ChatAgent {
  agentId: string
  name: string
  provider: AIProvider
  model: string
  systemPrompt: string
  cooldownMin: number
  cooldownMax: number
  modules: AgentModule[]
}

/** 策略上下文 */
export interface StrategyContext {
  agents: ChatAgent[]
  history: Message[]
  newMessage: Message
  /** 调用 LLM：返回 null = 跳过/失败，返回 string = Agent 的回复 */
  callLLM: (
    agent: ChatAgent,
    systemPrompt: string,
    history: Message[],
    instruction: string
  ) => Promise<string | null>
}

/** 聊天互动策略 */
export interface ChatStrategy {
  type: string
  /** 执行策略，返回本轮新产生的消息 */
  execute(ctx: StrategyContext): Promise<Message[]>
}

// ============================================================
// 核心类型
// ============================================================

export interface AgentConfig {
  id: string
  name: string
  provider: AIProvider
  model: string
  systemPrompt: string
  cooldownMin: number
  cooldownMax: number
  modules: AgentModule[]
  createdAt: number
  updatedAt: number
}

export interface RoomConfig {
  id: string
  name: string
  agentIds: string[]
  isActive: boolean
  createdAt: number
}

export type AgentFormData = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt' | 'modules'>


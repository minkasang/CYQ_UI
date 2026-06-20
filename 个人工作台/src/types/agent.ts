// Agent 与 Room 类型定义 + 可插拔模块架构
// 智能体群聊模块
//
// 架构说明：
//   AgentConfig.modules 是核心扩展点。每个 AgentModule 实现一个 AgentModule 接口，
//   聊天循环会自动调用所有已启用模块的 getContext() 方法，将其输出注入 LLM 上下文。
//   新增能力（记忆/关系/工具）只需实现 AgentModule 接口并注册，不修改现有代码。

import type { AIProvider } from './index'

// ============================================================
// AgentModule — 可插拔模块接口
// 遵守开闭原则：新增能力 = 新模块，不修改聊天循环
// ============================================================

/** 模块上下文：聊天循环调用模块时传入 */
export interface AgentModuleContext {
  agent: AgentConfig
  messages: ChatMessage[]
  currentMessage?: ChatMessage
}

/** 模块返回：要注入 LLM prompt 的上下文 */
export interface AgentModuleResult {
  contextText: string
}

/** Agent 可插拔模块 */
export interface AgentModule {
  type: string
  name: string
  enabled: boolean
  /** 检索模块相关的信息，注入到 Agent 的 system prompt 后方 */
  getContext: (ctx: AgentModuleContext) => Promise<AgentModuleResult>
}

// ============================================================
// 核心类型
// ============================================================

/** Agent 配置 */
export interface AgentConfig {
  id: string
  name: string
  provider: AIProvider
  model: string
  systemPrompt: string
  cooldownMin: number
  cooldownMax: number
  modules: AgentModule[]     // 启用的模块（后续扩展：memory, relationship, tool...）
  createdAt: number
  updatedAt: number
}

/** Room 配置 */
export interface RoomConfig {
  id: string
  name: string
  agentIds: string[]
  isActive: boolean
  createdAt: number
}

/** 聊天消息 */
export interface ChatMessage {
  id: string
  roomId: string
  sender: string
  senderType: 'human' | 'agent'
  content: string
  timestamp: number
}

/** Agent 表单提交数据 */
export type AgentFormData = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt' | 'modules'>

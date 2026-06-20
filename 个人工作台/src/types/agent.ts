// Agent 与 Room 类型定义
// 智能体群聊模块 — MVP

import type { AIProvider } from './index'

/** Agent 配置 */
export interface AgentConfig {
  id: string               // crypto.randomUUID()
  name: string             // 显示名
  provider: AIProvider     // 模型提供商
  model: string            // 具体模型 ID
  systemPrompt: string     // 人设 / system prompt
  replyProbability: number // 回复概率 0.0 ~ 1.0
  cooldownMin: number      // 最小冷却时间 (ms)
  cooldownMax: number      // 最大冷却时间 (ms)
  createdAt: number
  updatedAt: number
}

/** Room 配置 */
export interface RoomConfig {
  id: string
  name: string
  agentIds: string[]       // 成员 Agent ID 列表
  isActive: boolean        // 总开关
  createdAt: number
}

/** Agent 表单提交数据（不含自动生成字段） */
export type AgentFormData = Omit<AgentConfig, 'id' | 'createdAt' | 'updatedAt'>

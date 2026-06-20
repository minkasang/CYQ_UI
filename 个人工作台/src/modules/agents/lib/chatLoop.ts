// chatLoop — 多 Agent 聊天循环
// 深度模块：小接口（sendMessage + reset），深实现（上下文构建、Agent遍历、冷却管理）
// 依赖注入：callLLM 和 onMessage 由调用方注入，不直接依赖 API 或 UI

import { useState, useCallback, useRef } from 'react'
import type { AgentConfig, ChatMessage } from '../../../types/agent'
import { buildContext, parseReply } from './contextBuilder'

// ============================================================
// 接口定义
// ============================================================

export interface ChatLoopOptions {
  agents: AgentConfig[]
  /** 调用 LLM 生成回复。返回 null 表示跳过 */
  callLLM: (agent: AgentConfig, systemPrompt: string, history: ChatMessage[], instruction: string) => Promise<string | null>
  /** 收到新消息时回调 */
  onMessage: (msg: ChatMessage) => void
}

export interface ChatLoopAPI {
  messages: ChatMessage[]
  /** 发送消息（人类或 Agent）并触发回复循环 */
  sendMessage: (sender: string, senderType: 'human' | 'agent', content: string) => Promise<void>
  /** 清空消息 */
  reset: () => void
  /** 是否正在处理中 */
  processing: boolean
}

// ============================================================
// 实现
// ============================================================

export function useChatLoop(options: ChatLoopOptions): ChatLoopAPI {
  const { agents, callLLM, onMessage } = options

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [processing, setProcessing] = useState(false)
  const cooldowns = useRef<Map<string, number>>(new Map())  // agentId → 上次发言时间

  function genId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  /** 添加消息并通知 */
  const addMessage = useCallback((sender: string, senderType: 'human' | 'agent', content: string): ChatMessage => {
    const msg: ChatMessage = {
      id: genId(),
      roomId: '',  // 由外层设置
      sender,
      senderType,
      content,
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, msg])
    onMessage(msg)
    return msg
  }, [onMessage])

  /** 检查 Agent 是否在冷却中 */
  const isCooling = useCallback((agent: AgentConfig): boolean => {
    const last = cooldowns.current.get(agent.id)
    if (!last) return false
    const elapsed = Date.now() - last
    // 在 cooldownMin ~ cooldownMax 之间随机冷却
    const cooldown = agent.cooldownMin + Math.random() * (agent.cooldownMax - agent.cooldownMin)
    return elapsed < cooldown
  }, [])

  /** 处理单个 Agent 的回复判断 */
  const processAgent = useCallback(async (agent: AgentConfig, currentMessages: ChatMessage[]): Promise<void> => {
    // 冷却检查
    if (isCooling(agent)) return

    // 构建上下文
    const ctx = await buildContext({
      agent,
      messages: currentMessages,
    })

    // 调 LLM 判断
    try {
      const raw = await callLLM(agent, ctx.systemPrompt, ctx.history, ctx.instruction)
      if (raw === null) return  // LLM 调用失败，跳过

      const reply = parseReply(raw)
      if (reply === null) return  // Agent 选择不回复

      // 记录冷却时间
      cooldowns.current.set(agent.id, Date.now())

      // 添加回复消息
      addMessage(agent.name, 'agent', reply)
    } catch (err) {
      console.warn(`[chatLoop] Agent ${agent.name} 出错:`, err)
      // 容错：单个 Agent 失败不影响其他
    }
  }, [callLLM, isCooling, addMessage])

  /** 发送消息并触发回复循环 */
  const sendMessage = useCallback(async (sender: string, senderType: 'human' | 'agent', content: string) => {
    if (!content.trim() || processing) return

    setProcessing(true)

    // 1. 添加触发消息
    addMessage(sender, senderType, content)

    // 2. 获取更新后的消息列表（异步更新，需要从 state 中取）
    // 由于 setState 是异步的，我们用局部变量追踪
    const afterUserMsg = [...messages, {
      id: genId(),
      roomId: '',
      sender,
      senderType,
      content,
      timestamp: Date.now(),
    }]

    // 3. 逐个处理 Agent
    for (const agent of agents) {
      // 如果 sender 是这个 Agent 本身，跳过（防止自己回复自己）
      if (sender === agent.name) continue

      await processAgent(agent, afterUserMsg)
    }

    setProcessing(false)
  }, [messages, agents, processing, addMessage, processAgent])

  const reset = useCallback(() => {
    setMessages([])
    cooldowns.current.clear()
  }, [])

  return {
    messages,
    sendMessage,
    reset,
    processing,
  }
}

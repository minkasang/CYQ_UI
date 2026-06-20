// PassiveStrategy — 被动模式：Agent 只回复人类，Agent 之间不互动
// ChatStrategy 接口的第一个适配器（与 EventDrivenStrategy 共同证明接口有意义）

import type { ChatStrategy, StrategyContext } from './types'
import { buildContext, parseReply } from '../lib/contextBuilder'
import type { Message } from '../../../store/useChatStore'

export const PassiveStrategy: ChatStrategy = {
  type: 'passive',

  async execute(ctx: StrategyContext): Promise<Message[]> {
    const { agents, history, newMessage, callLLM } = ctx

    // 只有人类发消息才触发 Agent 回复
    if (newMessage.role !== 'user') return []

    const replies: Message[] = []

    // 并行问所有 Agent
    const results = await Promise.allSettled(
      agents.map(async (agent) => {
        const context = await buildContext({ agent, history, maxHistory: 20 })
        const raw = await callLLM(agent, context.systemPrompt, context.history, context.instruction)
        if (raw === null) return null
        return parseReply(raw)
      })
    )

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        replies.push({
          id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          role: 'assistant' as const,
          content: `[${result.value}]`,  // 临时标记 Agent 名——后续 ChatPanel 会正确设置
          createdAt: Date.now(),
        })
      }
    }

    return replies
  },
}

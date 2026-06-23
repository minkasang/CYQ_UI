// SerialStrategy — 串行模式
// ChatStrategy 接口的第三个适配器
// 与 EventDrivenStrategy（并行）和 PassiveStrategy（只回人类）共同证明接口有意义

import type { ChatStrategy, StrategyContext } from './types'
import { buildContext, parseReply } from '../lib/contextBuilder'
import type { Message } from '../../../store/useChatStore'

export const SerialStrategy: ChatStrategy = {
  type: 'serial',

  async execute(ctx: StrategyContext): Promise<Message[]> {
    const { agents, history, newMessage, callLLM } = ctx

    const replies: Message[] = []
    const cooling = new Map<string, number>()
    const MAX_ROUNDS = 3

    // 当前上下文：初始 = 触发消息前 + 触发消息
    let currentHistory = [...history, newMessage]

    for (let round = 0; round < MAX_ROUNDS; round++) {
      let roundHadReply = false

      // 逐个处理 Agent
      for (const agent of agents) {
        // 冷却检查（群聊才启用）
        if (agents.length > 1) {
          const last = cooling.get(agent.agentId)
          if (last) {
            const elapsed = Date.now() - last
            const cd = agent.cooldownMin + Math.random() * (agent.cooldownMax - agent.cooldownMin)
            if (elapsed < cd && agent.agentId !== (newMessage as any).agentId) {
              console.log(`[SerialStrategy] ${agent.name} 冷却中 (${Math.round(elapsed/1000)}s < ${Math.round(cd/1000)}s)`)
              continue
            }
          }
        }

        // 构建上下文（每次都用最新的 currentHistory）
        const context = await buildContext({
          agent,
          history: currentHistory,
          maxHistory: 30,  // 串行需要更多上下文
        })

        try {
          const raw = await callLLM(agent, context.systemPrompt, context.history, context.instruction)
          console.log(`[SerialStrategy] ${agent.name} response:`, raw?.slice(0, 50) || 'null')
          if (raw === null) { console.warn(`[SerialStrategy] ${agent.name} LLM 返回 null`); continue }

          const reply = parseReply(raw)
          if (reply === null) continue

          // Agent 回复了 → 立即加入上下文
          const msg: any = {
            id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'assistant',
            content: reply,
            senderName: agent.name,
            createdAt: Date.now(),
          }

          replies.push(msg)
          currentHistory = [...currentHistory, msg]  // 后续 Agent 能看到
          cooling.set(agent.agentId, Date.now())
          roundHadReply = true
        } catch (err) {
          console.warn(`[SerialStrategy] Agent ${agent.name} 出错:`, err)
        }
      }

      if (!roundHadReply) break
    }

    return replies
  },
}

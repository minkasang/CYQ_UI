// EventDrivenStrategy — 事件驱动互动策略
// ChatStrategy 接口的第二个适配器（与 PassiveStrategy 共同证明接口有意义）
//
// 核心逻辑：
//   1. @提及解析 → 强制被 @ 的 Agent 参与
//   2. 多轮收敛 → Agent 回复后，未发言者看到新消息可重判（最多 3 轮）
//   3. 并行判断 → 同轮所有 Agent 同时看同一份上下文
//   4. 冷却管理 → 已发言 Agent 不参与后续轮次

import type { ChatStrategy, StrategyContext, ChatAgent } from './types'
import { buildContext, parseReply } from '../lib/contextBuilder'
import type { Message } from '../../../store/useChatStore'

// ============================================================
// @提及解析
// ============================================================

/** 从消息中提取 @提及的 Agent 名列表 */
function extractMentions(content: string, agents: ChatAgent[]): ChatAgent[] {
  const mentioned = new Set<string>()
  const agentNames = new Map(agents.map(a => [a.name, a]))

  // 匹配 @Agent名 格式
  const regex = /@(\S+)/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(content)) !== null) {
    const name = match[1]
    const agent = agentNames.get(name)
    if (agent) mentioned.add(agent.agentId)
  }

  return agents.filter(a => mentioned.has(a.agentId))
}

// ============================================================
// 策略实现
// ============================================================

export const EventDrivenStrategy: ChatStrategy = {
  type: 'event-driven',

  async execute(ctx: StrategyContext): Promise<Message[]> {
    const { agents, history, newMessage, callLLM } = ctx

    const allReplies: Message[] = []
    const replied = new Set<string>()   // 已发言的 Agent
    const cooling = new Map<string, number>()  // agentId → 上次发言时间

    const MAX_ROUNDS = 3
    // 当前消息列表（每轮追加新的 Agent 回复）
    let currentHistory = [...history, newMessage]

    // @提及检测
    const mentioned = newMessage.role === 'user'
      ? extractMentions(newMessage.content, agents)
      : []

    for (let round = 0; round < MAX_ROUNDS; round++) {
      // 筛选本轮参与者
      const participants = agents.filter(a => {
        if (replied.has(a.agentId)) return false
        if (mentioned.some(m => m.agentId === a.agentId)) return true
        // 1v1 对话不冷却
        if (agents.length === 1) return true
        const last = cooling.get(a.agentId)
        if (last) {
          const elapsed = Date.now() - last
          const cd = a.cooldownMin + Math.random() * (a.cooldownMax - a.cooldownMin)
          if (elapsed < cd) return false
        }
        return true
      })

      if (participants.length === 0) break

      // 并行处理：所有人看同一份当前历史
      const results = await Promise.allSettled(
        participants.map(agent => processOne(agent, currentHistory, callLLM))
      )

      // 收集本轮回复
      const roundReplies: Message[] = []
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) {
          const { agent, content } = r.value
          const msg: any = {
            id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: 'assistant',
            content,
            senderName: agent.name,
            createdAt: Date.now(),
          }
          roundReplies.push(msg)
          replied.add(agent.agentId)
          cooling.set(agent.agentId, Date.now())
        }
      }

      if (roundReplies.length === 0) break  // 没人说话 → 结束

      allReplies.push(...roundReplies)
      currentHistory = [...currentHistory, ...roundReplies]
    }

    return allReplies
  },
}

// ============================================================
// 单个 Agent 处理
// ============================================================

async function processOne(
  agent: ChatAgent,
  history: Message[],
  callLLM: StrategyContext['callLLM']
): Promise<{ agent: ChatAgent; content: string } | null> {
  const ctx = await buildContext({ agent, history, maxHistory: 20 })

  try {
    const raw = await callLLM(agent, ctx.systemPrompt, ctx.history, ctx.instruction)
    if (raw === null) return null

    const reply = parseReply(raw)
    if (reply === null) return null

    return { agent, content: reply }
  } catch (err) {
    console.warn(`[EventDriven] Agent ${agent.name} 出错:`, err)
    return null
  }
}

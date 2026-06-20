// contextBuilder — 组装 Agent 的 LLM 调用上下文
// 纯逻辑模块：零副作用，可独立单测
// 深度模块：buildContext() 一个函数隐藏模块遍历、prompt 拼接、容错

import type { ChatAgent, AgentModuleContext } from '../../../types/agent'
import type { Message } from '../../../store/useChatStore'

export interface BuildContextInput {
  agent: ChatAgent
  history: Message[]
  maxHistory?: number
}

export interface BuildContextOutput {
  systemPrompt: string
  history: Message[]
  instruction: string
}

/**
 * 构建 Agent 的 LLM 调用上下文
 *
 * 1. 以 agent.systemPrompt 为基础
 * 2. 遍历 agent.modules，调用 getContext() 追加模块信息
 * 3. 拼接回复判断指令
 * 4. 取最近 maxHistory 条消息
 */
export async function buildContext(input: BuildContextInput): Promise<BuildContextOutput> {
  const { agent, history, maxHistory = 20 } = input

  // 1. 基础 system prompt
  const systemParts: string[] = [agent.systemPrompt]

  // 2. 调用所有已启用模块
  const ctx: AgentModuleContext = {
    agent: {
      id: agent.agentId,
      name: agent.name,
      provider: agent.provider,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      cooldownMin: agent.cooldownMin,
      cooldownMax: agent.cooldownMax,
      modules: agent.modules,
      createdAt: 0,
      updatedAt: 0,
    },
    messages: history,
    currentMessage: history[history.length - 1],
  }

  for (const mod of agent.modules) {
    if (!mod.enabled) continue
    try {
      const result = await mod.getContext(ctx)
      if (result.contextText) {
        systemParts.push(result.contextText)
      }
    } catch (err) {
      console.warn(`[contextBuilder] 模块 ${mod.name} 出错:`, err)
    }
  }

  // 3. 完整 system prompt
  const systemPrompt = systemParts.join('\n\n')

  // 4. 最近 N 条历史
  const recentHistory = history.slice(-maxHistory)

  // 5. 回复判断指令
  const instruction = buildInstruction(agent, history)

  return { systemPrompt, history: recentHistory, instruction }
}

function buildInstruction(agent: ChatAgent, history: Message[]): string {
  const lastMsg = history[history.length - 1]
  const recentSenders = new Set(history.slice(-5).map(m => m.role === 'user' ? '人类' : 'Agent'))

  let instruction = `你正在一个聊天室里，你的名字是「${agent.name}」。\n\n`
  instruction += `最近参与的人有：${[...recentSenders].join('、')}。\n\n`

  if (lastMsg) {
    instruction += `现在有人说：「${lastMsg.content}」\n\n`
  }

  instruction += `请根据你的人设和聊天上下文，判断你是否想回复。\n\n`
  instruction += `- 如果你想回复，直接输出你要说的话。\n`
  instruction += `- 如果你不想回复、不感兴趣、或者觉得不该插嘴，只输出 [SKIP]。\n`
  instruction += `- 回复要简短自然，像真人聊天。\n`
  instruction += `- 不要说"作为AI"之类的话，你就是${agent.name}。`

  return instruction
}

/**
 * 解析 LLM 回复：返回 null = 跳过，否则返回内容
 */
export function parseReply(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '[SKIP]' || trimmed.toUpperCase() === '[SKIP]') {
    return null
  }
  return trimmed
}

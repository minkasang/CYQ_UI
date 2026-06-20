// contextBuilder — 组装 Agent 的 LLM 上下文
// 纯逻辑，无副作用，可独立单测
// 深度模块：一个函数隐藏了模块调用、消息格式化、prompt 拼接

import type { AgentConfig, ChatMessage, AgentModuleContext } from '../../../types/agent'

/** 上下文构建输入 */
export interface BuildContextInput {
  agent: AgentConfig
  messages: ChatMessage[]
  maxHistory?: number        // 默认 20
}

/** 上下文构建输出 */
export interface BuildContextOutput {
  systemPrompt: string       // 完整的 system prompt（含模块上下文）
  history: ChatMessage[]     // 最近 N 条消息
  instruction: string        // 本轮指令
}

/**
 * 构建 Agent 的 LLM 调用上下文
 *
 * 流程：
 *   1. 以 agent.systemPrompt 为基础
 *   2. 遍历 agent.modules，调用 getContext() 追加模块信息
 *   3. 拼接指令
 *   4. 取最近 maxHistory 条消息
 */
export async function buildContext(input: BuildContextInput): Promise<BuildContextOutput> {
  const { agent, messages, maxHistory = 20 } = input

  // 1. 基础 system prompt
  let systemParts: string[] = [agent.systemPrompt]

  // 2. 调用所有已启用模块
  const ctx: AgentModuleContext = {
    agent,
    messages,
    currentMessage: messages[messages.length - 1],
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
      // 容错：单个模块失败不阻塞整体
    }
  }

  // 3. 组装完整 system prompt
  const systemPrompt = systemParts.join('\n\n')

  // 4. 取最近 N 条历史
  const history = messages.slice(-maxHistory)

  // 5. 指令
  const instruction = buildInstruction(agent, messages)

  return { systemPrompt, history, instruction }
}

/**
 * 构建回复判断指令
 * 核心：让 LLM 根据人设和上下文自主判断是否回复
 */
function buildInstruction(agent: AgentConfig, messages: ChatMessage[]): string {
  const lastMsg = messages[messages.length - 1]
  const recentSenders = new Set(messages.slice(-5).map(m => m.sender))

  let instruction = `你正在一个聊天室里，你的名字是「${agent.name}」。\n\n`
  instruction += `聊天室里有：${[...recentSenders].filter(s => s !== agent.name).join('、')}。\n\n`
  instruction += `现在${lastMsg ? `「${lastMsg.sender}」说：「${lastMsg.content}」` : '有人在说话'}。\n\n`
  instruction += `请根据你的人设和聊天上下文，判断你是否想回复。\n\n`
  instruction += `- 如果你想回复，直接输出你要说的话。\n`
  instruction += `- 如果你不想回复、不感兴趣、或者觉得不该插嘴，只输出 [SKIP]。\n`
  instruction += `- 回复要简短自然，像真人聊天，不要写长篇大论。\n`
  instruction += `- 不要说"作为AI"之类的话，你就是${agent.name}。`

  return instruction
}

/**
 * 解析 LLM 回复：返回 null 表示跳过，否则返回回复内容
 */
export function parseReply(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed || trimmed === '[SKIP]' || trimmed.toUpperCase() === '[SKIP]') {
    return null
  }
  return trimmed
}

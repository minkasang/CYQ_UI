// ChatRoom — 聊天窗口
// 连接 chatLoop 与现有的 LLM 服务（aiService）
// 纯 UI 组装，业务逻辑在 chatLoop 和 contextBuilder 中

import { useState, useEffect, useCallback } from 'react'
import { Send, Loader2, User, Bot } from 'lucide-react'
import { useAgentStore } from '../../../store/useAgentStore'
import { useRoomStore } from '../../../store/useRoomStore'
import { useAPIKeysStore } from '../../../store/useAPIKeysStore'
import { AI_PRESETS } from '../../../store/useAIConfigStore'
import { chat } from '../../../components/ai/aiService'
import { useChatLoop } from '../lib/chatLoop'
import type { AgentConfig, ChatMessage, RoomConfig } from '../../../types/agent'
import type { AIConfig } from '../../../types'

interface ChatRoomProps {
  room: RoomConfig
  onClose: () => void
}

export function ChatRoom({ room, onClose }: ChatRoomProps) {
  const agents = useAgentStore(s => s.agents)
  const toggleActive = useRoomStore(s => s.toggleActive)
  const apiKeys = useAPIKeysStore(s => s.keys)

  const roomAgents = agents.filter(a => room.agentIds.includes(a.id))

  // ========== LLM 调用（注入到 chatLoop） ==========
  const callLLM = useCallback(async (
    agent: AgentConfig,
    systemPrompt: string,
    history: ChatMessage[],
    instruction: string
  ): Promise<string | null> => {
    const activeKey = apiKeys[agent.provider]?.find(k => k.id === useAPIKeysStore.getState().activeKeyId[agent.provider])?.key
    if (!activeKey) {
      console.warn(`[ChatRoom] Agent ${agent.name} 没有可用的 API Key`)
      return null
    }

    const config: AIConfig = {
      provider: agent.provider,
      apiKey: activeKey,
      baseUrl: AI_PRESETS[agent.provider]?.baseUrl || '',
      model: agent.model,
      temperature: 0.7,
      maxTokens: 500,
    }

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      ...history.map(m => ({
        role: m.senderType === 'human' ? 'user' : 'assistant' as const,
        content: `[${m.sender}]: ${m.content}`,
      })),
      { role: 'user', content: instruction },
    ]

    try {
      const result = await chat(config, { messages, stream: false })
      return result.content || null
    } catch (err) {
      console.warn(`[ChatRoom] Agent ${agent.name} LLM 调用失败:`, err)
      return null
    }
  }, [apiKeys])

  // ========== 聊天循环 ==========
  const { messages, sendMessage, reset, processing } = useChatLoop({
    agents: roomAgents,
    callLLM,
    onMessage: () => {},  // 消息已由 chatLoop 内部管理
  })

  // 房间关闭时清空消息
  useEffect(() => {
    return () => reset()
  }, [reset])

  const [input, setInput] = useState('')

  const handleSend = async () => {
    if (!input.trim() || processing) return
    const text = input.trim()
    setInput('')
    await sendMessage('我', 'human', text)
  }

  return (
    <div className="rounded-2xl bg-white/[0.06] backdrop-blur-[10px] border border-white/10 shadow-card overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 300px)' }}>
      {/* 顶部栏 */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${room.isActive ? 'bg-[#30D158]' : 'bg-white/[0.15]'}`} />
          <span className="text-sm font-medium text-white/70 truncate">{room.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 成员标签 */}
          <div className="flex items-center gap-1 text-[9px] text-white/25">
            {roomAgents.slice(0, 3).map(a => (
              <span key={a.id} className="px-1.5 py-0.5 rounded bg-white/[0.04]">{a.name}</span>
            ))}
            {roomAgents.length > 3 && <span>+{roomAgents.length - 3}</span>}
          </div>
          {/* 开关 */}
          <button
            onClick={() => toggleActive(room.id)}
            className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
              room.isActive
                ? 'bg-[#30D158]/15 text-[#30D158]'
                : 'bg-white/[0.04] text-white/30 hover:text-white/50'
            }`}
          >
            {room.isActive ? '开' : '关'}
          </button>
          <button onClick={onClose} className="text-white/25 hover:text-white/60 text-xs">✕</button>
        </div>
      </div>

      {/* 消息区 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-white/30">
              {room.isActive ? '开始聊天吧！Agent 会根据自己的人设决定是否回复。' : '聊天室已关闭，开启开关后 Agent 才能说话。'}
            </p>
          </div>
        )}
        {messages.map(msg => {
          const isHuman = msg.senderType === 'human'
          const isMe = msg.sender === '我'
          return (
            <div key={msg.id} className={`flex gap-2 ${isHuman ? 'justify-end' : 'justify-start'}`}>
              {!isHuman && (
                <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-white/30" />
                </span>
              )}
              <div className={`max-w-[75%]`}>
                {!isHuman && !isMe && (
                  <span className="text-[9px] text-white/25 ml-1">{msg.sender}</span>
                )}
                {!isHuman && isMe && (
                  <span className="text-[9px] text-white/25 ml-1">我</span>
                )}
                <div
                  className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap ${
                    isHuman
                      ? 'bg-[#0A84FF]/20 text-white/90'
                      : 'bg-white/[0.06] text-white/80'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
              {isHuman && (
                <span className="w-6 h-6 rounded-full bg-[#0A84FF]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User size={12} className="text-[#0A84FF]" />
                </span>
              )}
            </div>
          )
        })}
        {processing && (
          <div className="flex justify-start gap-2">
            <span className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-0.5">
              <Loader2 size={12} className="animate-spin text-white/30" />
            </span>
            <div className="px-3 py-2 rounded-xl bg-white/[0.06] text-white/40 text-sm">
              Agent 正在考虑是否回复...
            </div>
          </div>
        )}
      </div>

      {/* 输入区 */}
      <div className="border-t border-white/[0.06] px-4 py-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder={room.isActive ? '输入消息... (Enter 发送)' : '聊天室已关闭'}
            disabled={!room.isActive || processing}
            rows={1}
            className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/15 outline-none focus:border-[#0A84FF] transition-colors resize-none disabled:opacity-30"
          />
          <button
            onClick={handleSend}
            disabled={!room.isActive || processing || !input.trim()}
            className="px-4 py-2 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {processing ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

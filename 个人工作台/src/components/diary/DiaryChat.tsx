// 日记对话组件
// 和 AI 讨论日记内容

import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, Loader2, X, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useAIConfigStore } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { chat, AIServiceError } from '../ai/aiService'
import type { AIConfig, AIMessage } from '../../types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface DiaryChatProps {
  diaryContent: string
  diaryTitle: string
  diaryDate: string
}

export function DiaryChat({ diaryContent, diaryTitle, diaryDate }: DiaryChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const config = useAIConfigStore(s => s.config)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const diarySettings = useSettingsStore(s => s.settings.diary)

  // 检查是否启用日记对话
  const chatEnabled = diarySettings.enableDiaryChat
  const currentProviderHasKey = hasKey(config.provider)

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || loading) return

    if (!currentProviderHasKey) {
      setError('请先配置 API Key')
      return
    }

    const userMessage = input.trim()
    setInput('')
    setError(null)

    // 添加用户消息
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    try {
      const apiKey = useAPIKeysStore.getState().getActiveKey(config.provider) || ''
      const fullConfig: AIConfig = {
        ...config,
        apiKey,
      }

      // 构建消息历史
      const chatMessages: AIMessage[] = [
        {
          role: 'system',
          content: `你是一个温暖贴心的日记伙伴。用户正在和你讨论他/她的日记。

日记标题：${diaryTitle}
日记日期：${diaryDate}
日记内容：
${diaryContent}

请基于这篇日记与用户对话。你可以：
- 表达理解和共情
- 提出有启发性的问题
- 给出温暖的建议
- 分享你的看法

回复要简洁、真诚、有温度。`,
        },
        ...messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        { role: 'user' as const, content: userMessage },
      ]

      const result = await chat(fullConfig, { messages: chatMessages })

      // 添加 AI 回复
      setMessages(prev => [...prev, { role: 'assistant', content: result.content }])
    } catch (err) {
      const msg = err instanceof AIServiceError
        ? err.message
        : err instanceof Error
          ? err.message
          : '发送失败'
      setError(msg)
      // 移除用户消息
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  // 按键发送
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // 功能未启用
  if (!chatEnabled) {
    return null
  }

  // 未打开时显示按钮
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-xs transition"
      >
        <MessageCircle size={12} /> 和 AI 聊聊这篇日记
      </button>
    )
  }

  // 对话面板
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <span className="text-xs text-white/70 flex items-center gap-1.5">
          <MessageCircle size={12} /> 日记对话
        </span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/40 hover:text-white/70 transition"
        >
          <X size={14} />
        </button>
      </div>

      {/* 消息列表 */}
      <div className="h-48 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 text-xs py-8">
            <MessageCircle size={24} className="mx-auto mb-2 opacity-50" />
            <p>开始和 AI 讨论这篇日记吧</p>
            <p className="mt-1 text-white/30">AI 了解日记内容，可以回答问题或给出建议</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
                  <Bot size={12} className="text-purple-200" />
                </div>
              )}
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-xs ${
                  msg.role === 'user'
                    ? 'bg-blue-500/30 text-blue-100'
                    : 'bg-white/10 text-white/90'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert prose-sm max-w-none">
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  msg.content
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
                  <User size={12} className="text-blue-200" />
                </div>
              )}
            </div>
          ))
        )}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center">
              <Bot size={12} className="text-purple-200" />
            </div>
            <div className="px-3 py-2 rounded-lg bg-white/10 text-xs text-white/60">
              <Loader2 size={12} className="animate-spin inline mr-1" /> 思考中...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-2 border-t border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white placeholder-white/30 outline-none focus:border-purple-400/50"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-3 py-1.5 rounded-lg bg-purple-500/30 hover:bg-purple-500/50 text-purple-200 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="text-[10px] text-red-300 mt-1">{error}</div>
        )}

        {!currentProviderHasKey && (
          <div className="text-[10px] text-orange-300/70 mt-1">请先配置 API Key</div>
        )}
      </div>
    </div>
  )
}

// AI 聊天面板组件
// 内嵌在首页，支持多对话管理和模型选择

import { useEffect, useState, useRef } from 'react'
import { useChatStore, getActiveChat } from '../../store/useChatStore'
import { useAIConfigStore, AI_PRESETS } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { chat } from '../ai/aiService'
import type { AIMessage, AIProvider, AIConfig } from '../../types'
import { MessageSquare, Plus, Trash2, Send, Loader2, Sparkles, ChevronDown, Key, Settings } from 'lucide-react'
import { GlassPanel } from '../glass/GlassPanel'
import { APIKeyManager } from './APIKeyManager'

// AI 提供商显示名称
const PROVIDER_NAMES: Record<AIProvider, string> = {
  agnes: 'Agnes AI',
  deepseek: 'DeepSeek',
  openai: 'OpenAI',
  claude: 'Claude',
  kimi: 'Kimi',
  zhipu: '智谱',
  custom: '自定义',
}

export function ChatPanel() {
  // AI 配置
  const config = useAIConfigStore(s => s.config)
  const setProvider = useAIConfigStore(s => s.setProvider)
  
  // API Keys
  const keys = useAPIKeysStore(s => s.keys)
  const loadKeys = useAPIKeysStore(s => s.loadFromFile)
  const hasKey = useAPIKeysStore(s => s.hasKey)
  const getKey = useAPIKeysStore(s => s.getKey)

  // Chat store
  const chats = useChatStore(s => s.chats)
  const activeChatId = useChatStore(s => s.activeChatId)
  const loadChats = useChatStore(s => s.loadChats)
  const createChat = useChatStore(s => s.createChat)
  const deleteChat = useChatStore(s => s.deleteChat)
  const setActiveChat = useChatStore(s => s.setActiveChat)
  const addMessage = useChatStore(s => s.addMessage)
  const loaded = useChatStore(s => s.loaded)

  // Local state
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [showModelSelect, setShowModelSelect] = useState(false)
  const [showAPIManager, setShowAPIManager] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 加载对话数据和 API Keys
  useEffect(() => {
    loadChats()
    loadKeys()
  }, [loadChats, loadKeys])

  // 获取当前对话
  const activeChat = getActiveChat(useChatStore.getState())

  // 当前提供商是否有 API Key
  const currentProviderHasKey = hasKey(config.provider)
  
  // 构建完整的 AI 配置（包含 API Key）
  const getFullConfig = (): AIConfig => {
    const apiKey = getKey(config.provider) || ''
    return {
      ...config,
      apiKey,
    }
  }

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeChat?.messages, streamContent])

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || loading) return
    if (!currentProviderHasKey) {
      setShowAPIManager(true)
      return
    }
    if (!activeChatId) {
      const newId = createChat()
      setActiveChat(newId)
    }

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setStreamContent('')

    // 添加用户消息
    addMessage(activeChatId || useChatStore.getState().activeChatId!, 'user', userMessage)

    try {
      // 构建消息历史
      const currentChat = getActiveChat(useChatStore.getState())
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: '你是一个智能助手，帮助用户解答问题、提供建议。回复要简洁、有用，使用中文。',
        },
        ...(currentChat?.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })) || []),
        { role: 'user', content: userMessage },
      ]

      // 调用 AI（流式）
      const fullConfig = getFullConfig()
      const result = await chat(fullConfig, {
        messages,
        stream: true,
        onChunk: (text) => {
          setStreamContent(prev => prev + text)
        },
      })

      // 添加 AI 回复
      addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', result.content)
      setStreamContent('')
    } catch (err: any) {
      console.error('[Chat] AI 调用失败:', err)
      addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', `错误: ${err.message || 'AI 调用失败'}`)
    } finally {
      setLoading(false)
    }
  }

  // 新建对话
  const handleNewChat = () => {
    const id = createChat()
    setActiveChat(id)
  }

  // 删除对话
  const handleDeleteChat = (id: string) => {
    if (chats.length === 1) {
      deleteChat(id)
      createChat()
    } else {
      deleteChat(id)
    }
  }

  // 检查是否有任何 API Key 配置
  const hasAnyKey = Object.keys(keys).some(p => hasKey(p as AIProvider))

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-white/50" size={24} />
      </div>
    )
  }

  // 显示 API Key 管理器
  if (showAPIManager) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-white">API Key 管理</h3>
          <button
            onClick={() => setShowAPIManager(false)}
            className="text-xs text-white/60 hover:text-white"
          >
            返回聊天
          </button>
        </div>
        <APIKeyManager />
      </div>
    )
  }

  // 如果没有任何 API Key，显示提示
  if (!hasAnyKey) {
    return (
      <GlassPanel cornerRadius={16} padding="32px">
        <div className="text-center text-white/60">
          <Key size={32} className="mx-auto mb-3 text-white/30" />
          <p className="text-sm mb-2">请先配置 API Key</p>
          <button
            onClick={() => setShowAPIManager(true)}
            className="px-4 py-2 rounded-lg text-xs text-white"
            style={{ background: 'rgba(59, 130, 246, 0.5)' }}
          >
            配置 API Key
          </button>
        </div>
      </GlassPanel>
    )
  }

  return (
    <div className="flex gap-4 h-[500px]">
      {/* 左侧对话列表 */}
      <GlassPanel cornerRadius={16} padding="12px" className="w-48 flex flex-col">
        {/* API Key 管理按钮 */}
        <button
          onClick={() => setShowAPIManager(true)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/20 mb-2"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Key size={14} />
          <span>API 管理</span>
        </button>

        {/* 新建对话按钮 */}
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/80 hover:bg-white/20 mb-2"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Plus size={14} />
          <span>新建对话</span>
        </button>

        {/* 对话列表 */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChat(chat.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-left group"
              style={{
                background: activeChatId === chat.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                color: activeChatId === chat.id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
              }}
            >
              <MessageSquare size={12} className="flex-shrink-0" />
              <span className="truncate flex-1">{chat.title}</span>
              <Trash2
                size={12}
                className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteChat(chat.id)
                }}
              />
            </button>
          ))}
        </div>
      </GlassPanel>

      {/* 右侧聊天区域 */}
      <GlassPanel cornerRadius={16} padding="0" className="flex-1 flex flex-col overflow-hidden">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {!activeChat || activeChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
              <MessageSquare size={32} className="mb-3 opacity-30" />
              <p className="text-xs">开始新的对话</p>
              <p className="text-[10px] mt-1">输入你的问题，AI 会帮你解答</p>
            </div>
          ) : (
            <>
              {activeChat.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap"
                    style={{
                      background: msg.role === 'user' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {/* 流式输出 */}
              {streamContent && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-xs whitespace-pre-wrap"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  >
                    {streamContent}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div className="px-4 py-3 border-t border-white/5 relative">
          {/* 模型选择 */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-white/70 hover:bg-white/10"
              style={{
                background: showModelSelect ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>{PROVIDER_NAMES[config.provider]}</span>
              <span className="text-white/40">{AI_PRESETS[config.provider].model}</span>
              {currentProviderHasKey ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-red-400">!</span>
              )}
              <ChevronDown size={12} />
            </button>
            
            {/* 模型下拉菜单 */}
            {showModelSelect && (
              <div
                className="absolute bottom-16 left-4 z-10 rounded-lg p-2"
                style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minWidth: '220px',
                }}
              >
                {(Object.keys(AI_PRESETS) as AIProvider[]).map((provider) => {
                  const providerHasKey = hasKey(provider)
                  return (
                    <button
                      key={provider}
                      onClick={() => {
                        setProvider(provider)
                        setShowModelSelect(false)
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left"
                      style={{
                        background: config.provider === provider ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                        color: config.provider === provider ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span>{PROVIDER_NAMES[provider]}</span>
                        {providerHasKey ? (
                          <span className="text-green-400 text-[10px]">已配置</span>
                        ) : (
                          <span className="text-red-400/60 text-[10px]">未配置</span>
                        )}
                      </div>
                      <span className="text-white/40">{AI_PRESETS[provider].model}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* 当前模型未配置提示 */}
          {!currentProviderHasKey && (
            <div className="text-xs text-red-400/80 mb-2">
              当前模型未配置 API Key，请点击「API 管理」配置
            </div>
          )}
          
          {/* 消息输入 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              disabled={loading || !currentProviderHasKey}
              className="flex-1 px-3 py-2 rounded-lg text-xs text-white placeholder-white/40 outline-none disabled:opacity-50"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !currentProviderHasKey}
              className="px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1.5 disabled:opacity-50"
              style={{
                background: 'rgba(59, 130, 246, 0.5)',
                border: 'none',
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={12} />
              ) : (
                <Send size={12} />
              )}
              发送
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
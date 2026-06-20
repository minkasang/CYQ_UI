// ChatPanel - 聊天面板容器
// 核心改动：单源真值（只读 activeChat）、请求 ID 绑定、子组件整合
// 防 Bug：不再同步 useAIConfigStore，所有配置从 activeChat 读取

import { useEffect, useState, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { useChatStore, getActiveChat } from '../../store/useChatStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { PROVIDER_MODELS, getModelName, isReasoningModel, AI_PRESETS } from '../../store/useAIConfigStore'
import { chat, generateImage, generateVideo, isImageModel, isVideoModel } from '../ai/aiService'
import { GlassPanel } from '../glass/GlassPanel'
import { ChatSidebar } from './ChatSidebar'
import { ChatMessages } from './ChatMessages'
import { ChatInput } from './ChatInput'
import { APIKeyModal } from './APIKeyModal'
import type { AIProvider, AIConfig, APIKeyEntry } from '../../types'

// 厂商显示名（仅 system prompt 用）
const PROVIDER_NAMES_FOR_SYSTEM: Record<AIProvider, string> = {
  agnes: 'Sapiens AI', deepseek: 'DeepSeek', openai: 'OpenAI', claude: 'Anthropic',
  kimi: 'Moonshot', zhipu: '智谱AI', custom: '自定义厂商',
}

export function ChatPanel() {
  // ========== Store ==========
  const chats = useChatStore(s => s.chats)
  const activeChatId = useChatStore(s => s.activeChatId)
  const loaded = useChatStore(s => s.loaded)
  const loadChats = useChatStore(s => s.loadChats)
  const createChat = useChatStore(s => s.createChat)
  const deleteChat = useChatStore(s => s.deleteChat)
  const setActiveChat = useChatStore(s => s.setActiveChat)
  const addMessage = useChatStore(s => s.addMessage)
  const updateChatModel = useChatStore(s => s.updateChatModel)
  const updateChatTitle = useChatStore(s => s.updateChatTitle)
  const togglePin = useChatStore(s => s.togglePin)

  const loadKeys = useAPIKeysStore(s => s.loadFromFile)
  const apiKeys = useAPIKeysStore(s => s.keys)

  // ========== 对话级配置（单源真值：只从 activeChat 读） ==========
  const activeChat = getActiveChat(useChatStore.getState())
  const provider: AIProvider = activeChat?.provider || 'deepseek'
  const model = activeChat?.model || 'deepseek-chat'

  const availableKeys: APIKeyEntry[] = apiKeys[provider]
  const hasProviderKey = availableKeys.length > 0
  const activeKeyId = useAPIKeysStore.getState().activeKeyId[provider]

  // ========== 每对话独立状态（架构健康：对话间完全隔离） ==========
  const [chatStates, setChatStates] = useState<Record<string, { loading: boolean; streamContent: string; streamReasoning: string; lastSentProvider?: string; lastSentModel?: string }>>({})

  // 当前对话的流式状态
  const currentChatState = activeChatId ? chatStates[activeChatId] : undefined
  const loading = currentChatState?.loading || false
  const streamContent = currentChatState?.streamContent || ''
  const streamReasoning = currentChatState?.streamReasoning || ''

  const [reasoningEnabled, setReasoningEnabled] = useState(true)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(2000)
  const [apiModalOpen, setApiModalOpen] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestChatIdRef = useRef<string | null>(null)

  // 辅助：更新指定对话的流式状态
  const updateChatState = (chatId: string, patch: Partial<{ loading: boolean; streamContent: string; streamReasoning: string; lastSentProvider: string; lastSentModel: string }>) => {
    setChatStates(prev => ({
      ...prev,
      [chatId]: { ...(prev[chatId] || { loading: false, streamContent: '', streamReasoning: '' }), ...patch }
    }))
  }

  // 辅助：追加流式内容到指定对话
  const appendStreamContent = (chatId: string, chunk: string) => {
    setChatStates(prev => {
      const cur = prev[chatId] || { loading: false, streamContent: '', streamReasoning: '' }
      return { ...prev, [chatId]: { ...cur, streamContent: cur.streamContent + chunk } }
    })
  }

  const appendStreamReasoning = (chatId: string, r: string) => {
    setChatStates(prev => {
      const cur = prev[chatId] || { loading: false, streamContent: '', streamReasoning: '' }
      return { ...prev, [chatId]: { ...cur, streamReasoning: cur.streamReasoning + r } }
    })
  }

  // ========== 初始化 ==========
  useEffect(() => { loadChats(); loadKeys() }, [loadChats, loadKeys])

  // 自动滚动
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [activeChat?.messages, streamContent, streamReasoning])

  // 防御性清理
  useEffect(() => { return () => { abortRef.current?.abort() } }, [])

  // ========== 对话操作 ==========
  const handleNewChat = () => {
    const id = createChat(provider, model)
    setActiveChat(id)
  }

  const handleDeleteChat = (id: string) => {
    setChatStates(prev => { const next = { ...prev }; delete next[id]; return next })
    if (chats.length === 1) { deleteChat(id); createChat() }
    else { deleteChat(id) }
  }

  // ========== 模型切换（只写 per-chat store） ==========
  const handleProviderChange = (p: AIProvider) => {
    if (!activeChatId) return
    updateChatModel(activeChatId, p, PROVIDER_MODELS[p]?.[0]?.id || '')
  }

  const handleModelChange = (m: string) => {
    if (!activeChatId) return
    updateChatModel(activeChatId, provider, m)
  }

  const handleSwitchKey = (keyId: string) => {
    useAPIKeysStore.getState().setActiveKey(provider, keyId)
  }

  // ========== 取消 ==========
  const handleCancel = () => {
    abortRef.current?.abort()
    abortRef.current = null
    const cid = requestChatIdRef.current
    if (cid) updateChatState(cid, { loading: false, streamContent: '', streamReasoning: '' })
  }

  // ========== 发送消息（请求 ID 绑定 + 竞态守卫） ==========
  const handleSend = async (text: string) => {
    if (!text.trim() || loading) return

    const requestChatId = activeChatId
    requestChatIdRef.current = requestChatId  // 记下请求归属
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const activeKey = useAPIKeysStore.getState().getActiveKey(provider)
    if (!activeKey) return

    const fullConfig: AIConfig = {
      provider, apiKey: activeKey,
      baseUrl: AI_PRESETS[provider]?.baseUrl || '',
      model, temperature, maxTokens,
    }

    if (!requestChatId) {
      const newId = createChat(provider, model)
      setActiveChat(newId)
      addMessage(newId, 'user', text)
    } else {
      addMessage(requestChatId, 'user', text)
    }

    const effectiveChatId = requestChatId || useChatStore.getState().activeChatId!
    // 记录实际发出的模型（数据链路拦截验证）
    updateChatState(effectiveChatId, { loading: true, streamContent: '', streamReasoning: '', lastSentProvider: provider, lastSentModel: getModelName(provider, model) })

    try {
      // 图片模型
      if (isImageModel(model)) {
        const result = await generateImage(fullConfig, { prompt: text, size: '1024x1024' })
        const localPath = `个人工作台/data/images/image_${Date.now()}.png`
        try {
          const saveResp = await fetch('http://localhost:8090/api/save-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: result.url, path: localPath }),
          })
          const saveData = await saveResp.json()
          addMessage(effectiveChatId, 'assistant', saveData.ok ? localPath : result.url)
        } catch {
          addMessage(effectiveChatId, 'assistant', result.url)
        }
        return
      }

      // 视频模型
      if (isVideoModel(model)) {
        let duration = 5
        const durationMatch = text.match(/(\d+)\s*[s秒]/i)
        if (durationMatch) duration = parseInt(durationMatch[1])
        const numFrames = Math.floor((duration * 24 - 1) / 8) * 8 + 1
        const prompt = text.replace(/\d+\s*[s秒]/gi, '').trim()

        const result = await generateVideo(fullConfig, {
          prompt: prompt || text, numFrames, frameRate: 24,
          signal: abortRef.current?.signal,
        })
        const vLocalPath = `个人工作台/data/videos/video_${Date.now()}.mp4`
        try {
          const saveResp = await fetch('http://localhost:8090/api/save-image', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: result.url, path: vLocalPath }),
          })
          const saveData = await saveResp.json()
          addMessage(effectiveChatId, 'assistant', saveData.ok ? vLocalPath : result.url)
        } catch {
          addMessage(effectiveChatId, 'assistant', result.url)
        }
        return
      }

      // 文本模型（含 reasoning）
      const currentChat = getActiveChat(useChatStore.getState())
      const modelDisplayName = getModelName(provider, model)
      const messages = [
        { role: 'system' as const, content: `你是 ${modelDisplayName}，由 ${AI_PRESETS[provider]?.baseUrl ? PROVIDER_NAMES_FOR_SYSTEM[provider] : provider} 提供。不要在每条回复中自我介绍。使用中文。` },
        ...(currentChat?.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })) || []),
        { role: 'user' as const, content: text },
      ]

      const modelSupportsReasoning = isReasoningModel(provider, model)
      const result = await chat(fullConfig, {
        messages, stream: true,
        onChunk: (chunk) => {
          appendStreamContent(effectiveChatId, chunk)
        },
        onReasoning: modelSupportsReasoning && reasoningEnabled
          ? (r) => {
              appendStreamReasoning(effectiveChatId, r)
            }
          : undefined,
        signal: abortRef.current?.signal,
        reasoningEffort: modelSupportsReasoning && reasoningEnabled ? 'medium' : undefined,
        enableWebSearch: webSearchSupported && webSearchEnabled,
      })

      // 始终存入请求归属的对话
      addMessage(effectiveChatId, 'assistant', result.content)
      updateChatState(effectiveChatId, { loading: false, streamContent: '', streamReasoning: '' })
    } catch (err: any) {
      if (err.name === 'AbortError') return
      addMessage(effectiveChatId, 'assistant', `错误: ${err.message || 'AI 调用失败'}`)
    } finally {
      updateChatState(effectiveChatId, { loading: false })
    }
  }

  // ========== 渲染 ==========
  const hasAnyKey = useAPIKeysStore.getState().hasAnyKey()
  const webSearchSupported = provider === 'zhipu' || provider === 'kimi'

  // 导出当前对话
  const handleExport = () => {
    if (!activeChat) return
    const md = `# ${activeChat.title}\n\n` +
      activeChat.messages.map(m =>
        `**${m.role === 'user' ? '🧑 用户' : '🤖 AI'}** (${new Date(m.createdAt).toLocaleString()})\n\n${m.content}\n`
      ).join('\n---\n\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeChat.title || '对话'}_${new Date().toISOString().slice(0, 10)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 编辑消息
  const handleEditMessage = (_msgId: string, content: string) => {
    // 简化：将内容填入输入框的思路通过 ChatInput 的初始值实现
    // 这里使用一个 ref 方案：直接操作 input
    const input = document.querySelector('textarea[placeholder*="输入消息"]') as HTMLTextAreaElement
    if (input) {
      input.value = content
      input.focus()
    }
  }

  // 重新生成：移除最后一条 AI 消息，发送最后一条用户消息
  const handleRegenerate = () => {
    if (!activeChat || activeChat.messages.length < 2) return
    const msgs = [...activeChat.messages]
    // 移除最后一条 AI 消息
    if (msgs[msgs.length - 1].role === 'assistant') msgs.pop()
    // 找到最后一条用户消息
    const lastUserMsg = msgs.filter(m => m.role === 'user').pop()
    if (lastUserMsg) {
      // 直接用 store 移除最后 AI 消息并发送
      // 简单实现：重新发送最后一条用户消息
      handleSend(lastUserMsg.content)
    }
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="animate-spin text-white/50" size={24} />
      </div>
    )
  }

  if (!hasAnyKey) {
    return (
      <GlassPanel cornerRadius={16} padding="32px">
        <div className="text-center text-white/60">
          <span className="text-3xl block mb-3 opacity-30">🔑</span>
          <p className="text-sm">请先配置 API Key</p>
          <button onClick={() => setApiModalOpen(true)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline">
            打开 API 管理
          </button>
        </div>
      </GlassPanel>
    )
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-260px)]">
      <ChatSidebar
        chats={chats} activeChatId={activeChatId}
        onSelect={setActiveChat} onNew={handleNewChat} onDelete={handleDeleteChat}
        onRename={(id, title) => updateChatTitle(id, title)}
        onTogglePin={(id) => togglePin(id)}
        onOpenAPIModal={() => setApiModalOpen(true)}
        onExport={activeChat ? handleExport : undefined}
      />
      <GlassPanel cornerRadius={16} padding="0" className="flex-1 flex flex-col overflow-hidden">
        {/* 模型状态栏 — 显示实际发出的模型（从数据链路拦截读取） */}
        <div className="flex items-center gap-1.5 px-4 py-1.5 border-b border-white/[.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF]/80 flex-shrink-0" />
          {currentChatState?.lastSentProvider ? (
            <>
              <span className="text-[11px] text-white/35">{PROVIDER_NAMES_FOR_SYSTEM[currentChatState.lastSentProvider as AIProvider] || currentChatState.lastSentProvider}</span>
              <span className="text-[10px] text-white/15">·</span>
              <span className="text-[11px] text-white/25">{currentChatState.lastSentModel}</span>
            </>
          ) : (
            <span className="text-[11px] text-white/20">等待发送…</span>
          )}
        </div>
        <ChatMessages
          messages={activeChat?.messages || []}
          streamContent={streamContent} streamReasoning={streamReasoning}
          loading={loading} containerRef={messagesContainerRef}
          onEditMessage={handleEditMessage}
          onRegenerate={handleRegenerate}
        />
        <ChatInput
          provider={provider} model={model} loading={loading}
          hasKey={hasProviderKey} availableKeys={availableKeys} activeKeyId={activeKeyId}
          reasoningEnabled={reasoningEnabled}
          webSearchEnabled={webSearchEnabled}
          webSearchSupported={webSearchSupported}
          temperature={temperature}
          maxTokens={maxTokens}
          onProviderChange={handleProviderChange} onModelChange={handleModelChange}
          onSend={handleSend} onCancel={handleCancel}
          onToggleReasoning={setReasoningEnabled}
          onToggleWebSearch={setWebSearchEnabled}
          onOpenAPIModal={() => setApiModalOpen(true)}
          onSwitchKey={handleSwitchKey}
          onTemperatureChange={setTemperature}
          onMaxTokensChange={setMaxTokens}
        />
      </GlassPanel>
      <APIKeyModal open={apiModalOpen} onClose={() => setApiModalOpen(false)} />
    </div>
  )
}

// AI 聊天面板组件
// 内嵌在首页，支持多对话管理和模型选择

import { useEffect, useState, useRef } from 'react'
import { useChatStore, getActiveChat } from '../../store/useChatStore'
import { useAIConfigStore, PROVIDER_MODELS, getModelName } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { chat, generateImage, generateVideo, isImageModel, isVideoModel } from '../ai/aiService'
import type { AIMessage, AIProvider, AIConfig } from '../../types'
import { MessageSquare, Plus, Trash2, Send, Loader2, ChevronDown, Settings } from 'lucide-react'
import { GlassPanel } from '../glass/GlassPanel'

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

// 渲染消息内容，支持图片和视频显示
function renderMessageContent(content: string) {
  // 检测本地视频路径（个人工作台/data/videos/xxx）
  if (content.startsWith('个人工作台/data/videos/')) {
    const videoUrl = `http://localhost:8090/${content}`
    return (
      <video 
        src={videoUrl} 
        controls 
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }
  
  // 检测远程视频 URL（.mp4 结尾）
  if (content.endsWith('.mp4') && (content.startsWith('http://') || content.startsWith('https://'))) {
    return (
      <video 
        src={content} 
        controls 
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }
  
  // 检测本地图片路径（个人工作台/data/images/xxx）
  if (content.startsWith('个人工作台/data/images/')) {
    // 本地图片，通过 server.py 提供静态文件服务
    const imageUrl = `http://localhost:8090/${content}`
    return (
      <img 
        src={imageUrl} 
        alt="生成的图片" 
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }
  
  // 检测远程 URL（http/https）
  if (content.startsWith('http://') || content.startsWith('https://')) {
    // 远程图片 URL
    return (
      <img 
        src={content} 
        alt="生成的图片" 
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }
  
  // 检测 markdown 图片格式 ![alt](url)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const match = imageRegex.exec(content)
  
  if (match) {
    const imageUrl = match[2]
    return (
      <img 
        src={imageUrl} 
        alt={match[1] || '生成的图片'} 
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }
  
  // 否则显示文本
  return content
}

export function ChatPanel() {
  // AI 配置
  const config = useAIConfigStore(s => s.config)
  const setProvider = useAIConfigStore(s => s.setProvider)
  const setModel = useAIConfigStore(s => s.setModel)
  
  // API Keys
  const keys = useAPIKeysStore(s => s.keys)
  const loadKeys = useAPIKeysStore(s => s.loadFromFile)
  const hasKey = useAPIKeysStore(s => s.hasKey)

  // Chat store
  const chats = useChatStore(s => s.chats)
  const activeChatId = useChatStore(s => s.activeChatId)
  const loadChats = useChatStore(s => s.loadChats)
  const createChat = useChatStore(s => s.createChat)
  const deleteChat = useChatStore(s => s.deleteChat)
  const setActiveChat = useChatStore(s => s.setActiveChat)
  const addMessage = useChatStore(s => s.addMessage)
  const updateChatModel = useChatStore(s => s.updateChatModel)
  const loaded = useChatStore(s => s.loaded)

  // Local state
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamContent, setStreamContent] = useState('')
  const [progress, setProgress] = useState(0) // 进度百分比
  const [progressStatus, setProgressStatus] = useState('') // 进度状态文字
  const [showProviderSelect, setShowProviderSelect] = useState(false)
  const [showModelSelect, setShowModelSelect] = useState(false)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null) // 取消控制器

  // 加载对话数据和 API Keys
  useEffect(() => {
    loadChats()
    loadKeys()
  }, [loadChats, loadKeys])

  // 切换对话时同步模型配置到全局 store
  useEffect(() => {
    if (!activeChatId) return
    const activeChat = chats.find(c => c.id === activeChatId)
    console.log('[ChatPanel] 切换对话:', activeChatId, '对话配置:', activeChat?.provider, activeChat?.model)
    if (activeChat?.provider && activeChat?.model) {
      // 对话有独立配置，同步到全局
      console.log('[ChatPanel] → 同步全局配置:', activeChat.provider, activeChat.model)
      setProvider(activeChat.provider)
      setModel(activeChat.model)
    }
  }, [activeChatId]) // 仅在切换对话时触发

  // 获取当前对话
  const activeChat = getActiveChat(useChatStore.getState())

  // 当前提供商是否有 API Key
  const currentProviderHasKey = hasKey(config.provider)
  
  // 当前提供商的模型列表
  const currentModels = PROVIDER_MODELS[config.provider] || []
  
  // 当前模型显示名称
  const currentModelName = getModelName(config.provider, config.model)

  // 滚动到底部（只滚动消息列表容器，不影响整个页面）
  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [activeChat?.messages, streamContent])

  // 取消当前操作
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setLoading(false)
    setStreamContent('')
    setProgress(0)
    setProgressStatus('')
  }

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || loading) return
    
    // 创建取消控制器
    abortControllerRef.current = new AbortController()
    
    // 从 store 获取最新配置（避免闭包问题）
    const latestConfig = useAIConfigStore.getState().config
    const latestProviderHasKey = useAPIKeysStore.getState().hasKey(latestConfig.provider)
    
    console.log(`[ChatPanel] ${new Date().toISOString()} handleSend:`, {
      provider: latestConfig.provider,
      baseUrl: latestConfig.baseUrl,
      model: latestConfig.model,
      hasKey: latestProviderHasKey,
      activeChatId,
    })
    
    if (!latestProviderHasKey) return
    if (!activeChatId) {
      const newId = createChat()
      setActiveChat(newId)
    }

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setProgress(0)
    setProgressStatus('')
    setStreamContent('')

    // 添加用户消息
    addMessage(activeChatId || useChatStore.getState().activeChatId!, 'user', userMessage)

    try {
      const apiKey = useAPIKeysStore.getState().getKey(latestConfig.provider) || ''
      const fullConfig: AIConfig = {
        ...latestConfig,
        apiKey,
      }

      // 图片模型 - 使用图片生成接口
      if (isImageModel(latestConfig.model)) {
        const result = await generateImage(fullConfig, {
          prompt: userMessage,
          size: '1024x1024',
        })
        
        // 下载图片到本地
        const timestamp = Date.now()
        const imageName = `image_${timestamp}.png`
        const localPath = `个人工作台/data/images/${imageName}`
        
        try {
          const saveResp = await fetch('http://localhost:8090/api/save-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: result.url,
              path: localPath,
            }),
          })
          const saveData = await saveResp.json()
          
          if (saveData.ok) {
            // 使用本地路径
            addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', localPath)
          } else {
            // 保存失败，使用远程 URL
            addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', result.url)
          }
        } catch (e) {
          // 保存失败，使用远程 URL
          addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', result.url)
        }
        return
      }

      // 视频模型 - 使用视频生成接口
      if (isVideoModel(latestConfig.model)) {
        // 解析时长参数（如 "5s" 或 "10秒"）
        let duration = 5 // 默认 5 秒
        const durationMatch = userMessage.match(/(\d+)\s*[s秒]/i)
        if (durationMatch) {
          duration = parseInt(durationMatch[1])
        }
        
        // 计算帧数（24fps，帧数需满足 8n+1）
        const numFrames = Math.floor((duration * 24 - 1) / 8) * 8 + 1
        
        // 提取视频描述（去掉时长参数）
        const prompt = userMessage.replace(/\d+\s*[s秒]/gi, '').trim()
        
        setProgressStatus('创建视频任务...')
        
        try {
          const result = await generateVideo(fullConfig, {
            prompt: prompt || userMessage,
            numFrames,
            frameRate: 24,
            onProgress: (prog, status) => {
              setProgress(prog)
              setProgressStatus(status)
            },
            signal: abortControllerRef.current?.signal,
          })
          
          // 下载视频到本地
          const timestamp = Date.now()
          const videoName = `video_${timestamp}.mp4`
          const localPath = `个人工作台/data/videos/${videoName}`
          
          try {
            const saveResp = await fetch('http://localhost:8090/api/save-image', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: result.url,
                path: localPath,
              }),
            })
            const saveData = await saveResp.json()
            
            if (saveData.ok) {
              addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', localPath)
            } else {
              addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', result.url)
            }
          } catch (e) {
            addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', result.url)
          }
          setProgress(0)
          setProgressStatus('')
        } catch (err: any) {
          console.error('[Chat] 视频生成失败:', err)
          addMessage(activeChatId || useChatStore.getState().activeChatId!, 'assistant', `错误: ${err.message || '视频生成失败'}`)
          setProgress(0)
          setProgressStatus('')
        }
        return
      }

      // 文本模型 - 使用对话接口
      const currentChat = getActiveChat(useChatStore.getState())
      const modelDisplayName = getModelName(latestConfig.provider, latestConfig.model)
      const providerDisplayName = PROVIDER_NAMES[latestConfig.provider]
      const messages: AIMessage[] = [
        {
          role: 'system',
          content: `你是 ${modelDisplayName}，由 ${providerDisplayName} 提供。你的身份永远是 ${modelDisplayName}，不要自称其他模型。你是一个智能助手，帮助用户解答问题、提供建议。回复要简洁、有用，使用中文。`,
        },
        ...(currentChat?.messages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })) || []),
        { role: 'user', content: userMessage },
      ]

      // 调用 AI（流式）
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

  // 新建对话，继承当前全局配置
  const handleNewChat = () => {
    const id = createChat(config.provider, config.model)
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

  // 如果没有任何 API Key，显示提示
  if (!hasAnyKey) {
    return (
      <GlassPanel cornerRadius={16} padding="32px">
        <div className="text-center text-white/60">
          <Settings size={32} className="mx-auto mb-3 text-white/30" />
          <p className="text-sm">请先在「设置」页面配置 API Key</p>
        </div>
      </GlassPanel>
    )
  }

  return (
    <div className="flex gap-4 h-[500px]">
      {/* 左侧对话列表 */}
      <GlassPanel cornerRadius={16} padding="12px" className="w-48 flex flex-col">
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
        <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
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
                    {/* 渲染消息内容，支持图片 */}
                    {renderMessageContent(msg.content)}
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
              {/* 进度条显示（图片/视频生成） */}
              {loading && progressStatus && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: '#ffffff',
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <span className="flex items-center gap-2">
                        <Loader2 className="animate-spin" size={12} />
                        {progressStatus}
                      </span>
                      {/* 进度条 */}
                      {progress > 0 && (
                        <div className="w-full h-2 rounded-full bg-white/20">
                          <div 
                            className="h-full rounded-full bg-blue-500/60 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* AI 正在回复状态（文本对话） */}
              {loading && !streamContent && !progressStatus && (
                <div className="flex justify-start">
                  <div
                    className="max-w-[80%] px-3 py-2 rounded-xl text-xs"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="animate-spin" size={12} />
                      AI 正在回复...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 输入区域 */}
        <div className="px-4 py-3 border-t border-white/5 relative">
          {/* 提供商 + 模型选择 */}
          <div className="flex items-center gap-2 mb-2">
            {/* 提供商选择 */}
            <button
              onClick={() => setShowProviderSelect(!showProviderSelect)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/70 hover:bg-white/10"
              style={{
                background: showProviderSelect ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>{PROVIDER_NAMES[config.provider]}</span>
              {currentProviderHasKey ? (
                <span className="text-green-400">✓</span>
              ) : (
                <span className="text-red-400">!</span>
              )}
              <ChevronDown size={12} />
            </button>
            
            {/* 提供商下拉菜单 */}
            {showProviderSelect && (
              <div
                className="absolute bottom-16 left-4 z-10 rounded-lg p-2"
                style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minWidth: '180px',
                }}
              >
                {(Object.keys(PROVIDER_NAMES) as AIProvider[]).map((provider) => {
                  const providerHasKey = hasKey(provider)
                  return (
                    <button
                      key={provider}
                      onClick={() => {
                        console.log(`[ChatPanel] ${new Date().toISOString()} 用户点击提供商: ${provider}, 当前对话: ${activeChatId}`)
                        setProvider(provider)
                        // 更新当前对话的独立配置
                        if (activeChatId) {
                          const defaultModel = PROVIDER_MODELS[provider]?.[0]?.id || ''
                          setModel(defaultModel)
                          updateChatModel(activeChatId, provider, defaultModel)
                          console.log(`[ChatPanel] → 更新对话模型: chat=${activeChatId} provider=${provider} model=${defaultModel}`)
                        }
                        setShowProviderSelect(false)
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
                    </button>
                  )
                })}
              </div>
            )}
            
            {/* 模型选择 */}
            <button
              onClick={() => setShowModelSelect(!showModelSelect)}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-white/70 hover:bg-white/10"
              style={{
                background: showModelSelect ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>{currentModelName}</span>
              <ChevronDown size={12} />
            </button>
            
            {/* 模型下拉菜单 */}
            {showModelSelect && (
              <div
                className="absolute bottom-16 z-10 rounded-lg p-2"
                style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  minWidth: '200px',
                  left: '180px',
                }}
              >
                {currentModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      console.log(`[ChatPanel] ${new Date().toISOString()} 用户点击模型: ${model.id}, 当前对话: ${activeChatId}`)
                      setModel(model.id)
                      // 更新当前对话的独立配置
                      if (activeChatId) {
                        updateChatModel(activeChatId, config.provider, model.id)
                      }
                      setShowModelSelect(false)
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-xs text-left"
                    style={{
                      background: config.model === model.id ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      color: config.model === model.id ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    <div>
                      <span>{model.name}</span>
                      <span className="text-white/40 ml-2">{model.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* 当前模型未配置提示 */}
          {!currentProviderHasKey && (
            <div className="text-xs text-red-400/80 mb-2">
              当前提供商未配置 API Key，请在「设置」页面配置
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
            {/* 取消按钮 */}
            {loading && (
              <button
                onClick={handleCancel}
                className="px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1.5"
                style={{
                  background: 'rgba(239, 68, 68, 0.5)',
                  border: 'none',
                }}
              >
                取消
              </button>
            )}
            {/* 发送按钮 */}
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !currentProviderHasKey}
              className="px-3 py-2 rounded-lg text-xs text-white flex items-center gap-1.5 disabled:opacity-50"
              style={{
                background: loading ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.5)',
                border: 'none',
              }}
            >
              <Send size={12} />
              发送
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
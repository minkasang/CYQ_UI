// ChatMessages - 消息列表渲染
// 纯展示组件，0 个 store 导入
// 功能：Markdown 渲染、思考过程折叠、图片/视频显示、复制按钮

import { useState } from 'react'
import { Copy, Check, Brain, Pencil, RotateCcw } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Message } from '../../store/useChatStore'

export interface ChatMessagesProps {
  messages: Message[]
  streamContent: string
  streamReasoning?: string
  loading: boolean
  containerRef: React.RefObject<HTMLDivElement | null>
  onEditMessage?: (msgId: string, content: string) => void
  onRegenerate?: () => void
}

// 渲染多媒体内容（图片、视频）
function renderMediaContent(content: string) {
  // 本地视频
  if (content.startsWith('个人工作台/data/videos/')) {
    return (
      <video
        src={`http://localhost:8090/${content}`}
        controls
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }

  // 远程视频
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

  // 本地图片
  if (content.startsWith('个人工作台/data/images/')) {
    return (
      <img
        src={`http://localhost:8090/${content}`}
        alt="图片"
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }

  // 远程图片
  if (content.startsWith('http://') || content.startsWith('https://')) {
    return (
      <img
        src={content}
        alt="图片"
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }

  // Markdown 格式图片
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  const match = imageRegex.exec(content)
  if (match) {
    return (
      <img
        src={match[2]}
        alt={match[1] || '图片'}
        className="max-w-full rounded-lg"
        style={{ maxHeight: '300px' }}
      />
    )
  }

  return null
}

// 单条消息气泡
function MessageBubble({ msg, isLastAssistant, onEdit, onRegenerate }: {
  msg: Message
  isLastAssistant?: boolean
  onEdit?: (msgId: string, content: string) => void
  onRegenerate?: () => void
}) {
  const [copied, setCopied] = useState(false)

  const isUser = msg.role === 'user'
  const mediaEl = renderMediaContent(msg.content)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex group ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="relative max-w-[80%]">
        <div
          className="px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap"
          style={{
            background: isUser ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
          }}
        >
          {mediaEl || (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.startsWith('language-')
                  if (isBlock) {
                    return (
                      <pre className="bg-black/30 rounded-lg p-3 my-2 overflow-auto">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    )
                  }
                  return (
                    <code className="bg-black/30 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        {/* 操作按钮 */}
        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
          {isUser && onEdit && (
            <button onClick={() => onEdit(msg.id, msg.content)}
              className="p-1 rounded" style={{ background: 'rgba(0,0,0,0.5)' }} title="编辑">
              <Pencil size={12} className="text-white/70" />
            </button>
          )}
          <button onClick={handleCopy}
            className="p-1 rounded" style={{ background: 'rgba(0,0,0,0.5)' }} title="复制">
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} className="text-white/70" />}
          </button>
          {isLastAssistant && onRegenerate && !isUser && (
            <button onClick={onRegenerate}
              className="p-1 rounded" style={{ background: 'rgba(0,0,0,0.5)' }} title="重新生成">
              <RotateCcw size={12} className="text-white/70" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ChatMessages({
  messages,
  streamContent,
  streamReasoning,
  loading,
  containerRef,
  onEditMessage,
  onRegenerate,
}: ChatMessagesProps) {
  const [reasoningExpanded, setReasoningExpanded] = useState(true)

  const hasMessages = messages.length > 0
  const showReasoning = !!(streamReasoning && streamReasoning.length > 0)

  // 自动滚动到底部
  const scrollToBottom = () => {
    const container = containerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }

  if (!hasMessages && !streamContent) {
    return (
      <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 flex items-center justify-center">
        <div className="flex flex-col items-center text-white/50">
          <Brain size={32} className="mb-3 opacity-30" />
          <p className="text-xs">开始新的对话</p>
          <p className="text-xs mt-1">输入你的问题，AI 会帮你解答</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3"
      onLoad={scrollToBottom}
    >
      {/* 已保存的消息 */}
      {messages.map((msg, idx) => (
        <MessageBubble key={msg.id} msg={msg}
          isLastAssistant={!loading && idx === messages.length - 1}
          onEdit={onEditMessage}
          onRegenerate={onRegenerate}
        />
      ))}

      {/* 流式思考过程 */}
      {showReasoning && (
        <div className="flex justify-start">
          <div className="max-w-[80%]">
            <button
              onClick={() => setReasoningExpanded(!reasoningExpanded)}
              className="flex items-center gap-1.5 text-xs text-white/60 hover:text-white/80 mb-1"
            >
              <Brain size={12} />
              <span>思考过程</span>
              <span className="text-xs">{reasoningExpanded ? '▼' : '▶'}</span>
            </button>
            {reasoningExpanded && (
              <div
                className="px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap italic"
                style={{
                  background: 'rgba(139, 92, 246, 0.15)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  border: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                {streamReasoning}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 流式输出 */}
      {streamContent && (
        <div className="flex justify-start">
          <div
            className="max-w-[80%] px-4 py-2.5 rounded-xl text-sm whitespace-pre-wrap"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = className?.startsWith('language-')
                  if (isBlock) {
                    return (
                      <pre className="bg-black/30 rounded-lg p-3 my-2 overflow-auto">
                        <code className={className} {...props}>{children}</code>
                      </pre>
                    )
                  }
                  return (
                    <code className="bg-black/30 px-1 py-0.5 rounded text-sm" {...props}>
                      {children}
                    </code>
                  )
                },
              }}
            >
              {streamContent}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 加载状态（非流式） */}
      {loading && !streamContent && (
        <div className="flex justify-start">
          <div
            className="max-w-[80%] px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

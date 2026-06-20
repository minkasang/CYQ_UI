// ChatSidebar - 对话列表侧边栏
// 纯展示组件，0 个 store 导入，所有数据通过 props 传入
// v2: 加重命名（双击编辑）+ 置顶功能

import { useState } from 'react'
import { MessageSquare, Plus, Trash2, Settings, Download, Pin, Pencil, Check, X } from 'lucide-react'
import { GlassPanel } from '../glass/GlassPanel'
import type { Chat } from '../../store/useChatStore'

export interface ChatSidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onRename: (id: string, title: string) => void
  onTogglePin: (id: string) => void
  onOpenAPIModal: () => void
  onExport?: () => void
  chatStates?: Record<string, { loading?: boolean; error?: boolean }>
}

// 排序：置顶优先，然后按更新时间倒序
function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return b.updatedAt - a.updatedAt
  })
}

function ChatItem({
  chat,
  isActive,
  onSelect,
  onDelete,
  onRename,
  onTogglePin,
  status,
}: {
  chat: Chat
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
  onTogglePin: () => void
  status: 'loading' | 'error' | 'unread' | null
}) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(chat.title)

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(chat.title)
    setEditing(true)
  }

  const handleSave = (e?: React.MouseEvent | React.KeyboardEvent) => {
    e?.stopPropagation()
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== chat.title) {
      onRename(trimmed)
    }
    setEditing(false)
  }

  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(e) }
    if (e.key === 'Escape') { e.preventDefault(); handleCancel(e as any) }
  }

  return (
    <div
      onClick={editing ? undefined : onSelect}
      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-xs group transition-colors cursor-pointer ${
        isActive ? 'bg-white/[0.12] text-white' : 'text-white/60 hover:bg-white/[0.04] hover:text-white/80'
      }`}
    >
      {/* 置顶图标 */}
      <button
        onClick={(e) => { e.stopPropagation(); onTogglePin() }}
        className={`flex-shrink-0 transition-colors ${
          chat.pinned ? 'text-[#0A84FF]' : 'text-white/15 hover:text-white/40 opacity-0 group-hover:opacity-100'
        }`}
        title={chat.pinned ? '取消置顶' : '置顶'}
      >
        <Pin size={11} className={chat.pinned ? 'fill-[#0A84FF]' : ''} />
      </button>

      <MessageSquare size={11} className="flex-shrink-0 text-white/25" />

      {/* 状态指示灯 */}
      {status === 'loading' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-breathe flex-shrink-0" />
      )}
      {status === 'error' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#FF453A] flex-shrink-0" />
      )}
      {status === 'unread' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#0A84FF] flex-shrink-0" />
      )}

      {/* 标题 / 编辑框 */}
      {editing ? (
        <div className="flex-1 flex items-center gap-1 min-w-0" onClick={e => e.stopPropagation()}>
          <input
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 px-1 py-0.5 rounded text-xs text-white bg-white/10 border border-white/10 outline-none focus:border-[#0A84FF]"
            autoFocus
          />
          <button onClick={handleSave} className="flex-shrink-0 p-0.5 text-green-400 hover:text-green-300"><Check size={10} /></button>
          <button onClick={handleCancel} className="flex-shrink-0 p-0.5 text-white/30 hover:text-white/60"><X size={10} /></button>
        </div>
      ) : (
        <>
          <span className="truncate flex-1" onDoubleClick={handleStartEdit}>{chat.title}</span>
          {/* 操作按钮 */}
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={handleStartEdit} className="p-0.5 text-white/25 hover:text-white/60" title="重命名">
              <Pencil size={10} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="p-0.5 text-white/25 hover:text-red-400" title="删除">
              <Trash2 size={10} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function ChatSidebar({
  chats,
  activeChatId,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onTogglePin,
  onOpenAPIModal,
  onExport,
  chatStates = {},
}: ChatSidebarProps) {
  const sorted = sortChats(chats)

  const getStatus = (chat: Chat): 'loading' | 'error' | 'unread' | null => {
    const state = chatStates[chat.id]
    if (state?.loading) return 'loading'
    if (state?.error) return 'error'
    if (chat.hasUnread) return 'unread'
    return null
  }

  return (
    <GlassPanel cornerRadius={16} padding="12px" className="w-48 flex flex-col">
      {/* 新建对话按钮 */}
      <button
        onClick={onNew}
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
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {sorted.map((chat) => (
          <ChatItem
            key={chat.id}
            chat={chat}
            isActive={activeChatId === chat.id}
            onSelect={() => onSelect(chat.id)}
            onDelete={() => onDelete(chat.id)}
            onRename={(title) => onRename(chat.id, title)}
            onTogglePin={() => onTogglePin(chat.id)}
            status={getStatus(chat)}
          />
        ))}
      </div>

      {/* 底部按钮 */}
      <div className="flex gap-1 mt-2">
        <button
          onClick={onOpenAPIModal}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10"
          style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
        >
          <Settings size={11} />
          <span>API</span>
        </button>
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10"
            style={{ border: '1px solid rgba(255, 255, 255, 0.08)' }}
            title="导出对话"
          >
            <Download size={11} />
          </button>
        )}
      </div>
    </GlassPanel>
  )
}

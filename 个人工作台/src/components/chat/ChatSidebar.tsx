// ChatSidebar - 对话列表侧边栏
// 纯展示组件，0 个 store 导入，所有数据通过 props 传入

import { MessageSquare, Plus, Trash2, Settings, Download } from 'lucide-react'
import { GlassPanel } from '../glass/GlassPanel'
import type { Chat } from '../../store/useChatStore'

export interface ChatSidebarProps {
  chats: Chat[]
  activeChatId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onOpenAPIModal: () => void
  onExport?: () => void
}

export function ChatSidebar({
  chats,
  activeChatId,
  onSelect,
  onNew,
  onDelete,
  onOpenAPIModal,
  onExport,
}: ChatSidebarProps) {
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
      <div className="flex-1 overflow-y-auto space-y-1">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
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
              className="text-white/40 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(chat.id)
              }}
            />
          </button>
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

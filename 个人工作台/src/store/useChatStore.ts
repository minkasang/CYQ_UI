// 聊天 Store
// 使用文件存储实现数据持久化，支持多对话管理
// 每个对话独立保存模型配置（provider + model）

import { create } from 'zustand'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'
import type { AIProvider } from '../types'

// 消息类型
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

// 对话类型
export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  provider?: AIProvider
  model?: string
  pinned?: boolean
  hasUnread?: boolean
}

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  loading: boolean
  loaded: boolean
  
  // 加载对话数据
  loadChats: () => Promise<void>
  
  // 创建新对话
  createChat: (provider?: AIProvider, model?: string) => string
  
  // 删除对话
  deleteChat: (id: string) => void
  
  // 切换对话
  setActiveChat: (id: string) => void
  
  // 添加消息
  addMessage: (chatId: string, role: 'user' | 'assistant', content: string) => void
  
  // 更新对话标题
  updateChatTitle: (id: string, title: string) => void
  
  // 清空对话消息
  clearMessages: (id: string) => void
  
  // 更新对话的模型配置
  updateChatModel: (chatId: string, provider: AIProvider, model: string) => void
  
  // 置顶/取消置顶
  togglePin: (id: string) => void
  
  // 标记已读
  markAsRead: (id: string) => void
}

// 生成简单唯一 ID
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 获取当前对话
export const getActiveChat = (state: ChatState): Chat | null => {
  return state.chats.find(c => c.id === state.activeChatId) || null
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChatId: null,
  loading: false,
  loaded: false,

  // 从文件加载对话数据
  loadChats: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const data = await loadFromFile<{ chats?: Chat[], activeChatId?: string }>(FILE_KEYS.CHATS, {})
      const chats = data.chats || []
      const activeChatId = data.activeChatId || (chats.length > 0 ? chats[0].id : null)
      set({ chats, activeChatId, loading: false, loaded: true })
    } catch (err) {
      console.error('[ChatStore] 加载失败:', err)
      set({ loading: false, loaded: true })
    }
  },

  // 创建新对话
  createChat: (provider?: AIProvider, model?: string) => {
    const id = genId()
    const chat: Chat = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      provider,
      model,
    }
    const newChats = [chat, ...get().chats]
    set({ chats: newChats, activeChatId: id })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: id })
    return id
  },

  // 删除对话
  deleteChat: (id) => {
    const newChats = get().chats.filter(c => c.id !== id)
    let newActiveId = get().activeChatId
    if (newActiveId === id) {
      newActiveId = newChats.length > 0 ? newChats[0].id : null
    }
    set({ chats: newChats, activeChatId: newActiveId })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: newActiveId })
  },

  // 切换对话
  setActiveChat: (id) => {
    set({ activeChatId: id })
    saveToFile(FILE_KEYS.CHATS, { chats: get().chats, activeChatId: id })
  },

  // 添加消息
  addMessage: (chatId, role, content) => {
    const message: Message = {
      id: genId(),
      role,
      content,
      createdAt: Date.now(),
    }
    const { activeChatId } = get()
    const newChats = get().chats.map(c => {
      if (c.id !== chatId) return c
      // 自动更新标题：第一条用户消息的前20字符作为标题
      const title = c.messages.length === 0 && role === 'user' 
        ? content.slice(0, 20) || '新对话'
        : c.title
      // AI 回复到达时，如果当前不在该对话，标记未读
      const hasUnread = role === 'assistant' && chatId !== activeChatId ? true : c.hasUnread
      return {
        ...c,
        title,
        messages: [...c.messages, message],
        updatedAt: Date.now(),
        hasUnread,
      }
    })
    set({ chats: newChats })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: get().activeChatId })
  },

  // 更新对话标题
  updateChatTitle: (id, title) => {
    const newChats = get().chats.map(c => 
      c.id === id ? { ...c, title, updatedAt: Date.now() } : c
    )
    set({ chats: newChats })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: get().activeChatId })
  },

  // 清空对话消息
  clearMessages: (id) => {
    const newChats = get().chats.map(c =>
      c.id === id ? { ...c, messages: [], updatedAt: Date.now() } : c
    )
    set({ chats: newChats })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: get().activeChatId })
  },

  // 更新对话的模型配置
  updateChatModel: (chatId, provider, model) => {
    console.log(`[ChatStore] ${new Date().toISOString()} updateChatModel:`, { chatId, provider, model })
    const newChats = get().chats.map(c =>
      c.id === chatId ? { ...c, provider, model, updatedAt: Date.now() } : c
    )
    set({ chats: newChats })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: get().activeChatId })
  },

  // 置顶/取消置顶
  togglePin: (id) => {
    const newChats = get().chats.map(c =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    )
    set({ chats: newChats })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: get().activeChatId })
  },

  // 标记已读
  markAsRead: (id) => {
    const chat = get().chats.find(c => c.id === id)
    if (!chat?.hasUnread) return
    const newChats = get().chats.map(c =>
      c.id === id ? { ...c, hasUnread: false } : c
    )
    set({ chats: newChats })
    saveToFile(FILE_KEYS.CHATS, { chats: newChats, activeChatId: get().activeChatId })
  },
}))
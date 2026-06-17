// 聊天 Store
// 使用文件存储实现数据持久化，支持多对话管理

import { create } from 'zustand'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

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
}

interface ChatState {
  chats: Chat[]
  activeChatId: string | null
  loading: boolean
  loaded: boolean
  
  // 加载对话数据
  loadChats: () => Promise<void>
  
  // 创建新对话
  createChat: () => string
  
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
  createChat: () => {
    const id = genId()
    const chat: Chat = {
      id,
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
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
    const newChats = get().chats.map(c => {
      if (c.id !== chatId) return c
      // 自动更新标题：第一条用户消息的前20字符作为标题
      const title = c.messages.length === 0 && role === 'user' 
        ? content.slice(0, 20) || '新对话'
        : c.title
      return {
        ...c,
        title,
        messages: [...c.messages, message],
        updatedAt: Date.now(),
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
}))
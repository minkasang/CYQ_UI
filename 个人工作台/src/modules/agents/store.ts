// 多 Agent 聊天 Store
// 独立于单 Agent ChatStore，自有持久化文件

import { create } from 'zustand'
import { loadFromFile, saveToFile } from '../../utils/fileStorage'
import type { ChatAgent } from '../../types/agent'

export interface MAMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: number
}

export interface MAChat {
  id: string
  title: string
  messages: MAMessage[]
  agents: ChatAgent[]
  strategy: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

interface MAState {
  chats: MAChat[]
  activeChatId: string | null
  loaded: boolean

  load: () => Promise<void>
  create: (agents: ChatAgent[], strategy?: string) => string
  delete: (id: string) => void
  setActive: (id: string) => void
  addMessage: (chatId: string, role: 'user' | 'assistant', content: string) => void
  toggleActive: (id: string) => void
  getById: (id: string) => MAChat | undefined
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 使用独立的持久化 key
const STORE_KEY = '个人工作台/data/ma_chats.json'

export const useMAChatStore = create<MAState>((set, get) => ({
  chats: [],
  activeChatId: null,
  loaded: false,

  load: async () => {
    if (get().loaded) return
    try {
      const data = await loadFromFile<{ chats: MAChat[]; activeChatId: string | null }>(STORE_KEY, { chats: [], activeChatId: null })
      set({ chats: data.chats || [], activeChatId: data.activeChatId, loaded: true })
    } catch {
      set({ chats: [], activeChatId: null, loaded: true })
    }
  },

  create: (agents, strategy = 'event-driven') => {
    const id = genId()
    const names = agents.map(a => a.name).join('、')
    const chat: MAChat = {
      id,
      title: `群聊: ${names}`,
      messages: [],
      agents,
      strategy,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const chats = [chat, ...get().chats]
    set({ chats, activeChatId: id })
    saveToFile(STORE_KEY, { chats, activeChatId: id })
    return id
  },

  delete: (id) => {
    const chats = get().chats.filter(c => c.id !== id)
    const activeChatId = get().activeChatId === id ? (chats[0]?.id || null) : get().activeChatId
    set({ chats, activeChatId })
    saveToFile(STORE_KEY, { chats, activeChatId })
  },

  setActive: (id) => {
    set({ activeChatId: id })
    saveToFile(STORE_KEY, { chats: get().chats, activeChatId: id })
  },

  addMessage: (chatId, role, content) => {
    const msg: MAMessage = { id: genId(), role, content, createdAt: Date.now() }
    const chats = get().chats.map(c =>
      c.id === chatId
        ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
        : c
    )
    set({ chats })
    saveToFile(STORE_KEY, { chats, activeChatId: get().activeChatId })
  },

  toggleActive: (id) => {
    const chats = get().chats.map(c =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    )
    set({ chats })
    saveToFile(STORE_KEY, { chats, activeChatId: get().activeChatId })
  },

  getById: (id) => get().chats.find(c => c.id === id),
}))

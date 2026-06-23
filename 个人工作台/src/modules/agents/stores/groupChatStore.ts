// 群聊 Store — 多 Agent 群聊
// 支持策略选择、冷却、多轮互动

import { create } from 'zustand'
import { loadFromFile, saveToFile } from '../../../utils/fileStorage'
import type { ChatAgent } from '../../../types/agent'

const KEY = '个人工作台/data/group_chats.json'

export interface GCMessage { id: string; role: 'user' | 'assistant'; content: string; senderName?: string; createdAt: number }

export interface GChat {
  id: string
  title: string
  agents: ChatAgent[]
  messages: GCMessage[]
  strategy: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

interface State {
  chats: GChat[]
  activeId: string | null
  loaded: boolean
  load: () => Promise<void>
  create: (agents: ChatAgent[], strategy?: string) => GChat
  delete: (id: string) => void
  setActive: (id: string) => void
  addMessage: (id: string, role: 'user' | 'assistant', content: string, senderName?: string) => void
  updateStrategy: (id: string, strategy: string) => void
}

let genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const useGroupChatStore = create<State>((set, get) => ({
  chats: [], activeId: null, loaded: false,

  load: async () => {
    if (get().loaded) return
    try {
      const d = await loadFromFile<{ chats: GChat[]; activeId: string | null }>(KEY, { chats: [], activeId: null })
      set({ chats: d.chats || [], activeId: d.activeId, loaded: true })
    } catch { set({ chats: [], activeId: null, loaded: true }) }
  },

  create: (agents, strategy = 'event-driven') => {
    const title = agents.length === 1 ? agents[0].name : `群聊: ${agents.map(a => a.name).join('、')}`
    const chat: GChat = { id: genId(), title, agents, messages: [], strategy, isActive: true, createdAt: Date.now(), updatedAt: Date.now() }
    const chats = [chat, ...get().chats]
    set({ chats, activeId: chat.id })
    saveToFile(KEY, { chats, activeId: chat.id })
    return chat
  },

  delete: (id) => {
    const chats = get().chats.filter(c => c.id !== id)
    const activeId = get().activeId === id ? (chats[0]?.id || null) : get().activeId
    set({ chats, activeId })
    saveToFile(KEY, { chats, activeId })
  },

  setActive: (activeId) => { set({ activeId }); saveToFile(KEY, { chats: get().chats, activeId }) },

  addMessage: (id, role, content, senderName?) => {
    const msg: GCMessage = { id: genId(), role, content, senderName, createdAt: Date.now() }
    const chats = get().chats.map(c => c.id === id ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c)
    set({ chats })
    saveToFile(KEY, { chats, activeId: get().activeId })
  },

  updateStrategy: (id, strategy) => {
    const chats = get().chats.map(c => c.id === id ? { ...c, strategy } : c)
    set({ chats })
    saveToFile(KEY, { chats, activeId: get().activeId })
  },
}))

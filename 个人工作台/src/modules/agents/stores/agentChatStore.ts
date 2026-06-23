// Agent 1v1 对话 Store — 简洁：每条对话 = Agent快照 + 消息

import { create } from 'zustand'
import { loadFromFile, saveToFile } from '../../../utils/fileStorage'
import type { ChatAgent } from '../../../types/agent'

const KEY = '个人工作台/data/agent_chats.json'

export interface AChatMessage { id: string; role: 'user' | 'assistant'; content: string; createdAt: number }

export interface AChat {
  id: string; title: string; agent: ChatAgent; messages: AChatMessage[]
  createdAt: number; updatedAt: number
}

interface State {
  chats: AChat[]; activeId: string | null; loaded: boolean
  load: () => Promise<void>
  create: (agent: ChatAgent) => AChat
  findOrCreate: (agent: ChatAgent) => AChat
  delete: (id: string) => void
  setActive: (id: string) => void
  addMessage: (id: string, role: 'user' | 'assistant', content: string) => void
}

let genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const useAgentChatStore = create<State>((set, get) => ({
  chats: [], activeId: null, loaded: false,

  load: async () => {
    if (get().loaded) return
    try { const d = await loadFromFile<{ chats: AChat[]; activeId: string | null }>(KEY, { chats: [], activeId: null })
      set({ chats: d.chats || [], activeId: d.activeId, loaded: true }) }
    catch { set({ chats: [], activeId: null, loaded: true }) }
  },

  create: (agent) => {
    const chat: AChat = { id: genId(), title: agent.name, agent, messages: [], createdAt: Date.now(), updatedAt: Date.now() }
    const chats = [chat, ...get().chats]; set({ chats, activeId: chat.id })
    saveToFile(KEY, { chats, activeId: chat.id }); return chat
  },

  findOrCreate: (agent) => {
    const exist = get().chats.find(c => c.agent.agentId === agent.agentId)
    if (exist) { set({ activeId: exist.id }); return exist }
    return get().create(agent)
  },

  delete: (id) => {
    const chats = get().chats.filter(c => c.id !== id)
    set({ chats, activeId: get().activeId === id ? (chats[0]?.id || null) : get().activeId })
    saveToFile(KEY, { chats, activeId: get().activeId })
  },

  setActive: (activeId) => { set({ activeId }); saveToFile(KEY, { chats: get().chats, activeId }) },

  addMessage: (id, role, content) => {
    const msg: AChatMessage = { id: genId(), role, content, createdAt: Date.now() }
    const chats = get().chats.map(c => c.id === id ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() } : c)
    set({ chats }); saveToFile(KEY, { chats, activeId: get().activeId })
  },
}))

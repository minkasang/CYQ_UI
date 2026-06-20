// Agent Store — Agent 配置的 CRUD + 持久化
// 深度模块：小接口（6个方法）隐藏文件读写、ID生成、重名校验

import { create } from 'zustand'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'
import type { AgentConfig, AgentFormData } from '../types/agent'

interface AgentState {
  agents: AgentConfig[]
  loaded: boolean

  load: () => Promise<void>
  add: (data: AgentFormData) => AgentConfig | null
  update: (id: string, patch: Partial<AgentConfig>) => void
  remove: (id: string) => void
  getById: (id: string) => AgentConfig | undefined
}

function genId(): string {
  return crypto.randomUUID()
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    try {
      const data = await loadFromFile<{ agents: AgentConfig[] }>(FILE_KEYS.AGENTS, { agents: [] })
      set({ agents: data.agents || [], loaded: true })
    } catch {
      set({ agents: [], loaded: true })
    }
  },

  add: (data) => {
    // 重名校验
    if (get().agents.some(a => a.name === data.name.trim())) {
      return null
    }

    const now = Date.now()
    const agent: AgentConfig = {
      id: genId(),
      name: data.name.trim(),
      provider: data.provider,
      model: data.model,
      systemPrompt: data.systemPrompt,
      cooldownMin: data.cooldownMin,
      cooldownMax: data.cooldownMax,
      modules: [],
      createdAt: now,
      updatedAt: now,
    }

    const agents = [...get().agents, agent]
    set({ agents })
    saveToFile(FILE_KEYS.AGENTS, { agents })
    return agent
  },

  update: (id, patch) => {
    const agents = get().agents.map(a =>
      a.id === id ? { ...a, ...patch, updatedAt: Date.now() } : a
    )
    set({ agents })
    saveToFile(FILE_KEYS.AGENTS, { agents })
  },

  remove: (id) => {
    const agents = get().agents.filter(a => a.id !== id)
    set({ agents })
    saveToFile(FILE_KEYS.AGENTS, { agents })
  },

  getById: (id) => get().agents.find(a => a.id === id),
}))

// API Keys Store
// 管理多个 AI 提供商的 API Key，保存到本地文件

import { create } from 'zustand'
import type { AIProvider } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 各提供商的 API Key 配置
export interface APIKeysConfig {
  agnes?: string
  deepseek?: string
  openai?: string
  claude?: string
  kimi?: string
  zhipu?: string
  custom?: string
}

interface APIKeysState {
  keys: APIKeysConfig
  loaded: boolean
  
  // 加载配置
  loadFromFile: () => Promise<void>
  
  // 设置某个提供商的 Key
  setKey: (provider: AIProvider, key: string) => void
  
  // 获取某个提供商的 Key
  getKey: (provider: AIProvider) => string | undefined
  
  // 删除某个提供商的 Key
  removeKey: (provider: AIProvider) => void
  
  // 检查某个提供商是否已配置
  hasKey: (provider: AIProvider) => boolean
}

const DEFAULT_KEYS: APIKeysConfig = {}

export const useAPIKeysStore = create<APIKeysState>((set, get) => ({
  keys: DEFAULT_KEYS,
  loaded: false,

  // 从文件加载
  loadFromFile: async () => {
    const saved = await loadFromFile<APIKeysConfig>(FILE_KEYS.API_KEYS, DEFAULT_KEYS)
    set({ keys: saved, loaded: true })
    console.log('[api-keys] 从文件加载完成')
  },

  // 保存到文件
  saveToFile: async () => {
    await saveToFile(FILE_KEYS.API_KEYS, get().keys)
    console.log('[api-keys] 已保存到文件')
  },

  // 设置 Key
  setKey: (provider, key) => {
    const newKeys = { ...get().keys, [provider]: key }
    set({ keys: newKeys })
    get().saveToFile()
  },

  // 获取 Key
  getKey: (provider) => {
    return get().keys[provider]
  },

  // 删除 Key
  removeKey: (provider) => {
    const newKeys = { ...get().keys }
    delete newKeys[provider]
    set({ keys: newKeys })
    get().saveToFile()
  },

  // 检查是否已配置
  hasKey: (provider) => {
    return !!get().keys[provider] && get().keys[provider]!.length > 0
  },
}))

// 选择器：获取所有已配置的提供商
export const selectConfiguredProviders = (state: APIKeysState): AIProvider[] => {
  return (Object.keys(state.keys) as AIProvider[]).filter(p => state.hasKey(p))
}
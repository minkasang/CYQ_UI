// API Keys Store
// 管理多个 AI 提供商的 API Key（每提供商多 Key），保存到本地文件
// 给 AI 的话：旧格式 { provider: "sk-xxx" } 会自动迁移为新格式 { provider: [{id, label, key}] }

import { create } from 'zustand'
import type { AIProvider, APIKeyEntry } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 生成简单唯一 ID
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

interface APIKeysState {
  keys: Record<AIProvider, APIKeyEntry[]>
  activeKeyId: Record<AIProvider, string | null>
  loaded: boolean

  loadFromFile: () => Promise<void>
  saveToFile: () => Promise<void>

  addKey: (provider: AIProvider, key: string, label?: string) => string
  removeKey: (provider: AIProvider, keyId: string) => void
  setActiveKey: (provider: AIProvider, keyId: string) => void

  getActiveKey: (provider: AIProvider) => string | undefined
  getActiveKeyEntry: (provider: AIProvider) => APIKeyEntry | undefined
  getKeys: (provider: AIProvider) => APIKeyEntry[]
  hasKey: (provider: AIProvider) => boolean
  hasAnyKey: () => boolean
}

const DEFAULT_KEYS: Record<AIProvider, APIKeyEntry[]> = {
  agnes: [],
  deepseek: [],
  openai: [],
  claude: [],
  kimi: [],
  zhipu: [],
  custom: [],
}

const DEFAULT_ACTIVE: Record<AIProvider, string | null> = {
  agnes: null,
  deepseek: null,
  openai: null,
  claude: null,
  kimi: null,
  zhipu: null,
  custom: null,
}

export const useAPIKeysStore = create<APIKeysState>((set, get) => ({
  keys: { ...DEFAULT_KEYS },
  activeKeyId: { ...DEFAULT_ACTIVE },
  loaded: false,

  // 从文件加载（含旧格式兼容迁移）
  loadFromFile: async () => {
    const raw = await loadFromFile<any>(FILE_KEYS.API_KEYS, {})
    
    // 旧格式迁移：Record<Provider, string> → Record<Provider, APIKeyEntry[]>
    const migrated: Record<AIProvider, APIKeyEntry[]> = { ...DEFAULT_KEYS }
    const migratedActiveKeyId: Record<AIProvider, string | null> = { ...DEFAULT_ACTIVE }
    
    const providers: AIProvider[] = ['agnes', 'deepseek', 'openai', 'claude', 'kimi', 'zhipu', 'custom']
    
    for (const provider of providers) {
      const value = raw[provider]
      
      if (typeof value === 'string' && value.length > 0) {
        // 旧格式：单个字符串 → 转为数组
        const id = genId()
        migrated[provider] = [{ id, label: '默认', key: value, createdAt: Date.now() }]
        migratedActiveKeyId[provider] = id
      } else if (Array.isArray(value) && value.length > 0) {
        // 新格式：数组，直接保留
        migrated[provider] = value
        // 恢复激活状态
        const savedActiveId = raw._activeKeyId?.[provider]
        if (savedActiveId && value.find(k => k.id === savedActiveId)) {
          migratedActiveKeyId[provider] = savedActiveId
        } else {
          migratedActiveKeyId[provider] = value[0].id
        }
      }
    }
    
    set({ keys: migrated, activeKeyId: migratedActiveKeyId, loaded: true })
    
    // 如果有旧格式数据，保存为新格式
    const hasOldFormat = providers.some(p => typeof raw[p] === 'string')
    if (hasOldFormat) {
      get().saveToFile()
    }
    console.log('[api-keys] 从文件加载完成，已配置:', providers.filter(p => migrated[p].length > 0).length, '个提供商')
  },

  // 保存到文件
  saveToFile: async () => {
    const { keys, activeKeyId } = get()
    await saveToFile(FILE_KEYS.API_KEYS, { ...keys, _activeKeyId: activeKeyId })
    console.log('[api-keys] 已保存到文件')
  },

  // 添加 Key（第一个 Key 自动激活）
  addKey: (provider, key, label = '默认') => {
    const entry: APIKeyEntry = { id: genId(), label, key, createdAt: Date.now() }
    const newKeys = { ...get().keys, [provider]: [...get().keys[provider], entry] }
    const newActiveKeyId = { ...get().activeKeyId }
    
    // 如果是该提供商的第一个 Key，自动激活
    if (newKeys[provider].length === 1) {
      newActiveKeyId[provider] = entry.id
    }
    
    set({ keys: newKeys, activeKeyId: newActiveKeyId })
    get().saveToFile()
    return entry.id
  },

  // 删除 Key（如果删的是激活 Key，自动切到剩余第一个）
  removeKey: (provider, keyId) => {
    const newKeys = { ...get().keys, [provider]: get().keys[provider].filter(k => k.id !== keyId) }
    const newActiveKeyId = { ...get().activeKeyId }
    
    // 如果删除的是激活 Key
    if (get().activeKeyId[provider] === keyId) {
      newActiveKeyId[provider] = newKeys[provider].length > 0 ? newKeys[provider][0].id : null
    }
    
    set({ keys: newKeys, activeKeyId: newActiveKeyId })
    get().saveToFile()
  },

  // 设置激活 Key
  setActiveKey: (provider, keyId) => {
    // 验证 keyId 存在
    const exists = get().keys[provider].some(k => k.id === keyId)
    if (!exists) return
    
    set({ activeKeyId: { ...get().activeKeyId, [provider]: keyId } })
    get().saveToFile()
  },

  // 获取当前激活 Key 的值
  getActiveKey: (provider) => {
    const entry = get().getActiveKeyEntry(provider)
    return entry?.key
  },

  // 获取当前激活 Key 的完整信息
  getActiveKeyEntry: (provider) => {
    const activeId = get().activeKeyId[provider]
    if (!activeId) return undefined
    return get().keys[provider].find(k => k.id === activeId)
  },

  // 获取某提供商的所有 Key
  getKeys: (provider) => {
    return get().keys[provider]
  },

  // 某提供商是否至少有一个 Key
  hasKey: (provider) => {
    return get().keys[provider].length > 0
  },

  // 是否有任何提供商配置了 Key
  hasAnyKey: () => {
    return (['agnes', 'deepseek', 'openai', 'claude', 'kimi', 'zhipu', 'custom'] as AIProvider[])
      .some(p => get().keys[p].length > 0)
  },
}))

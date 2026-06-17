// AI 配置 Store
// 给 AI 的话：API Key 存配置文件，不上传任何服务器

import { create } from 'zustand'
import type { AIConfig, AIProvider } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 各 AI 服务的默认配置
export const AI_PRESETS: Record<AIProvider, Omit<AIConfig, 'apiKey'>> = {
  agnes: {
    provider: 'agnes',
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    model: 'agnes-2.0-flash',
    temperature: 0.7,
    maxTokens: 2000,
  },
  deepseek: {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
  },
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2000,
  },
  claude: {
    provider: 'claude',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    temperature: 0.7,
    maxTokens: 2000,
  },
  kimi: {
    provider: 'kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-8k',
    temperature: 0.7,
    maxTokens: 2000,
  },
  zhipu: {
    provider: 'zhipu',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    model: 'glm-4-flash',
    temperature: 0.7,
    maxTokens: 2000,
  },
  custom: {
    provider: 'custom',
    baseUrl: '',
    model: '',
    temperature: 0.7,
    maxTokens: 2000,
  },
}

interface AIConfigState {
  config: AIConfig
  loaded: boolean
  setConfig: (config: Partial<AIConfig>) => void
  setProvider: (provider: AIProvider) => void
  setApiKey: (key: string) => void
  resetConfig: () => void
  loadFromFile: () => Promise<void>
  saveToFile: () => Promise<void>
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseUrl: AI_PRESETS.deepseek.baseUrl,
  model: AI_PRESETS.deepseek.model,
  temperature: 0.7,
  maxTokens: 2000,
}

export const useAIConfigStore = create<AIConfigState>((set, get) => ({
  config: DEFAULT_CONFIG,
  loaded: false,

  // 从配置文件加载
  loadFromFile: async () => {
    const saved = await loadFromFile<AIConfig | {}>(FILE_KEYS.AI_CONFIG, DEFAULT_CONFIG)
    // 处理空对象
    const config = saved && 'provider' in saved ? saved as AIConfig : DEFAULT_CONFIG
    set({ config, loaded: true })
    console.log('[ai-config] 从文件加载完成')
  },

  // 保存到配置文件
  saveToFile: async () => {
    const { config } = get()
    await saveToFile(FILE_KEYS.AI_CONFIG, config)
    console.log('[ai-config] 已保存到文件')
  },

  setConfig: (patch) => {
    const newConfig = { ...get().config, ...patch }
    set({ config: newConfig })
    get().saveToFile()
  },

  setProvider: (provider) => {
    const preset = AI_PRESETS[provider]
    const newConfig = {
      ...get().config,
      provider,
      baseUrl: preset.baseUrl,
      model: preset.model,
    }
    set({ config: newConfig })
    get().saveToFile()
  },

  setApiKey: (key) => {
    const newConfig = { ...get().config, apiKey: key }
    set({ config: newConfig })
    get().saveToFile()
  },

  resetConfig: () => {
    set({ config: DEFAULT_CONFIG })
    get().saveToFile()
  },
}))

// 判断是否已配置（可以调用 AI）
export const selectIsAIConfigured = (state: AIConfigState): boolean => {
  return !!state.config.apiKey && !!state.config.baseUrl && !!state.config.model
}
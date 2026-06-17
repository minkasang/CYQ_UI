// AI 配置 Store
// 给 AI 的话：API Key 存配置文件，不上传任何服务器

import { create } from 'zustand'
import type { AIConfig, AIProvider } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 各提供商的模型列表（根据官网确认）
export const PROVIDER_MODELS: Record<AIProvider, { id: string; name: string; desc: string }[]> = {
  agnes: [
    { id: 'agnes-1.5-flash', name: 'Agnes 1.5 Flash', desc: '文本对话' },
    { id: 'agnes-2.0-flash', name: 'Agnes 2.0 Flash', desc: '文本对话' },
    { id: 'agnes-image-2.0-flash', name: 'Agnes Image 2.0', desc: '图像生成' },
    { id: 'agnes-image-2.1-flash', name: 'Agnes Image 2.1', desc: '图像生成' },
    { id: 'agnes-video-v2.0', name: 'Agnes Video V2.0', desc: '视频生成' },
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', desc: 'V4 Flash 非思考' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', desc: '思考模式' },
    { id: 'deepseek-v4-pro', name: 'DeepSeek V4 Pro', desc: '专业版' },
    { id: 'deepseek-v4-flash', name: 'DeepSeek V4 Flash', desc: '快速版' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4o', desc: '全能模型' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: '轻量快速' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', desc: '高性能' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', desc: '经济实惠' },
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: '平衡版' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', desc: '最强版' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', desc: '快速版' },
  ],
  kimi: [
    { id: 'moonshot-v1-8k', name: 'Moonshot V1 8K', desc: '短文本' },
    { id: 'moonshot-v1-32k', name: 'Moonshot V1 32K', desc: '中等文本' },
    { id: 'moonshot-v1-128k', name: 'Moonshot V1 128K', desc: '长文本' },
  ],
  zhipu: [
    { id: 'glm-4', name: 'GLM-4', desc: '标准版' },
    { id: 'glm-4-flash', name: 'GLM-4 Flash', desc: '快速版' },
    { id: 'glm-4-plus', name: 'GLM-4 Plus', desc: '增强版' },
    { id: 'glm-4v', name: 'GLM-4V', desc: '视觉版' },
  ],
  custom: [
    { id: 'custom', name: '自定义模型', desc: '用户自定义' },
  ],
}

// 各 AI 服务的默认配置（baseUrl 和默认模型）
export const AI_PRESETS: Record<AIProvider, { baseUrl: string; defaultModel: string }> = {
  agnes: {
    baseUrl: 'https://apihub.agnes-ai.com/v1',
    defaultModel: 'agnes-2.0-flash',
  },
  deepseek: {
    baseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  claude: {
    baseUrl: 'https://api.anthropic.com',
    defaultModel: 'claude-3-5-sonnet-20241022',
  },
  kimi: {
    baseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
  },
  zhipu: {
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
  },
  custom: {
    baseUrl: '',
    defaultModel: '',
  },
}

interface AIConfigState {
  config: AIConfig
  loaded: boolean
  setConfig: (config: Partial<AIConfig>) => void
  setProvider: (provider: AIProvider) => void
  setModel: (model: string) => void
  setApiKey: (key: string) => void
  resetConfig: () => void
  loadFromFile: () => Promise<void>
  saveToFile: () => Promise<void>
}

const DEFAULT_CONFIG: AIConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseUrl: AI_PRESETS.deepseek.baseUrl,
  model: AI_PRESETS.deepseek.defaultModel,
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
      model: preset.defaultModel,
    }
    console.log('[ai-config] 切换提供商:', provider, 'baseUrl:', preset.baseUrl, 'model:', preset.defaultModel)
    set({ config: newConfig })
    get().saveToFile()
  },

  setModel: (model) => {
    const newConfig = {
      ...get().config,
      model,
    }
    console.log('[ai-config] 切换模型:', model)
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

// 获取当前提供商的模型列表
export const getCurrentModels = (provider: AIProvider) => {
  return PROVIDER_MODELS[provider] || []
}

// 获取模型显示名称
export const getModelName = (provider: AIProvider, modelId: string) => {
  const models = PROVIDER_MODELS[provider]
  const model = models?.find(m => m.id === modelId)
  return model?.name || modelId
}
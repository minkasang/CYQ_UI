// 全局设置 Store
// 给 AI 的话：包含玻璃参数、主题等全局配置，存配置文件

import { create } from 'zustand'
import type { GlassConfig, AppSettings } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

const DEFAULT_GLASS: GlassConfig = {
  refraction: 0.69,
  chromAberration: 0.05,
  fresnel: 1.0,
  specular: 0.0,
  cornerRadius: 24,
  zRadius: 40,
  opacity: 1.0,
  saturation: 0.0,
  brightness: 0.0,
  tintStrength: 0.0,
  shadowOpacity: 0.30,
  shadowSpread: 10,
  shadowOffsetY: 1,
  blurAmount: 0.0,
  distortion: 0.0,
  edgeHighlight: 0.05,
}

const DEFAULT_SETTINGS: AppSettings = {
  glass: DEFAULT_GLASS,
  theme: 'dark',
  language: 'zh-CN',
  ai: {
    provider: 'deepseek',
    apiKey: '',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 2000,
  },
}

interface SettingsState {
  settings: AppSettings
  loaded: boolean
  setGlass: (patch: Partial<GlassConfig>) => void
  resetGlass: () => void
  setTheme: (theme: AppSettings['theme']) => void
  setLanguage: (lang: AppSettings['language']) => void
  resetAll: () => void
  loadFromFile: () => Promise<void>
  saveToFile: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  // 从配置文件加载设置
  loadFromFile: async () => {
    const saved = await loadFromFile<AppSettings | {}>(FILE_KEYS.SETTINGS, DEFAULT_SETTINGS)
    
    // 处理空对象
    if (!saved || !('glass' in saved)) {
      console.log('[settings] 配置文件为空，使用默认设置')
      set({ settings: DEFAULT_SETTINGS, loaded: true })
      return
    }
    
    // 检查是否是旧格式（包含 mode 字段）
    if (saved.glass && 'mode' in saved.glass) {
      console.log('[settings] 检测到旧格式设置，使用默认玻璃参数')
      set({ settings: DEFAULT_SETTINGS, loaded: true })
      return
    }
    
    // 合并保存的设置和默认设置
    const merged: AppSettings = {
      ...DEFAULT_SETTINGS,
      ...saved,
      glass: {
        ...DEFAULT_GLASS,
        ...(saved.glass || {}),
      },
    }
    
    set({ settings: merged, loaded: true })
    console.log('[settings] 从文件加载完成')
  },

  // 保存到配置文件
  saveToFile: async () => {
    const { settings } = get()
    await saveToFile(FILE_KEYS.SETTINGS, settings)
    console.log('[settings] 已保存到文件')
  },

  setGlass: (patch) => {
    const newGlass = { ...get().settings.glass, ...patch }
    const newSettings = { ...get().settings, glass: newGlass }
    set({ settings: newSettings })
    get().saveToFile()
  },

  resetGlass: () => {
    const newSettings = { ...get().settings, glass: DEFAULT_GLASS }
    set({ settings: newSettings })
    get().saveToFile()
  },

  setTheme: (theme) => {
    const newSettings = { ...get().settings, theme }
    set({ settings: newSettings })
    get().saveToFile()
  },

  setLanguage: (language) => {
    const newSettings = { ...get().settings, language }
    set({ settings: newSettings })
    get().saveToFile()
  },

  resetAll: () => {
    set({ settings: DEFAULT_SETTINGS })
    get().saveToFile()
  },
}))
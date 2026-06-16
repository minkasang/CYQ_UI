// 全局设置 Store
// 给 AI 的话：包含玻璃参数、主题等全局配置

import { create } from 'zustand'
import type { GlassConfig, AppSettings } from '../types'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'

const DEFAULT_GLASS: GlassConfig = {
  mode: 'standard',
  displacementScale: 70,
  blurAmount: 0.4,
  saturation: 140,
  aberrationIntensity: 2,
  elasticity: 0.15,
  cornerRadius: 16,
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
  setGlass: (patch: Partial<GlassConfig>) => void
  resetGlass: () => void
  setTheme: (theme: AppSettings['theme']) => void
  setLanguage: (lang: AppSettings['language']) => void
  resetAll: () => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadFromStorage<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),

  setGlass: (patch) => {
    const newGlass = { ...get().settings.glass, ...patch }
    const newSettings = { ...get().settings, glass: newGlass }
    set({ settings: newSettings })
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings)
  },

  resetGlass: () => {
    const newSettings = { ...get().settings, glass: DEFAULT_GLASS }
    set({ settings: newSettings })
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings)
  },

  setTheme: (theme) => {
    const newSettings = { ...get().settings, theme }
    set({ settings: newSettings })
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings)
  },

  setLanguage: (language) => {
    const newSettings = { ...get().settings, language }
    set({ settings: newSettings })
    saveToStorage(STORAGE_KEYS.SETTINGS, newSettings)
  },

  resetAll: () => {
    set({ settings: DEFAULT_SETTINGS })
    saveToStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  },
}))

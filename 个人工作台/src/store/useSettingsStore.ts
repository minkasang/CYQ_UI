// 全局设置 Store
// 给 AI 的话：包含玻璃参数、主题等全局配置

import { create } from 'zustand'
import type { GlassConfig, AppSettings } from '../types'
import { saveToStorage, STORAGE_KEYS } from '../utils/storage'

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
  setGlass: (patch: Partial<GlassConfig>) => void
  resetGlass: () => void
  setTheme: (theme: AppSettings['theme']) => void
  setLanguage: (lang: AppSettings['language']) => void
  resetAll: () => void
}

// 安全加载设置
function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS)
    if (!raw) return DEFAULT_SETTINGS
    
    const saved = JSON.parse(raw)
    
    // 检查是否是旧格式（包含 mode 字段）
    if (saved.glass && 'mode' in saved.glass) {
      // 旧格式，直接使用默认值
      console.log('[settings] 检测到旧格式设置，使用默认玻璃参数')
      return DEFAULT_SETTINGS
    }
    
    // 合并保存的设置和默认设置
    return {
      ...DEFAULT_SETTINGS,
      ...saved,
      glass: {
        ...DEFAULT_GLASS,
        ...(saved.glass || {}),
      },
    }
  } catch (err) {
    console.error('[settings] 加载设置失败:', err)
    return DEFAULT_SETTINGS
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: loadSettings(),

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

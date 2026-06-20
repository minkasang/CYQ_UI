// 主题预设 Store
// 管理主题快照的增删改查 + 应用（引擎/字体/壁纸一站式切换）
// 持久化：data/theme_presets.json

import { create } from 'zustand'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

// ============================================================
// Types
// ============================================================

export interface ThemePreset {
  id: string
  name: string
  engine: string                         // 引擎类型 (liquid-glass | flat)
  params: Record<string, number | boolean>  // 引擎参数(平铺)
  fontFamily: string
  fontSize: number
  wallpaper: {
    type: 'url' | 'local' | 'color' | 'gradient'
    value: string
  }
  isBuiltin: boolean
  createdAt: number
}

interface ThemePresetState {
  presets: ThemePreset[]
  activeId: string | null
  loaded: boolean

  // 操作
  loadFromFile: () => Promise<void>
  saveToFile: () => Promise<void>
  addPreset: (preset: Omit<ThemePreset, 'id' | 'createdAt' | 'isBuiltin'>) => ThemePreset
  removePreset: (id: string) => void
  updatePreset: (id: string, patch: Partial<ThemePreset>) => void
  setActive: (id: string) => void
  applyPreset: (id: string) => Promise<void>  // 引擎+字体+壁纸一站式
}

// ============================================================
// Constants
// ============================================================

const BUILTIN_PRESETS: Omit<ThemePreset, 'createdAt'>[] = [
  {
    id: 'builtin-glass',
    name: '默认玻璃',
    engine: 'liquid-glass',
    params: {
      refraction: 0.69, chromAberration: 0.05, fresnel: 1.0,
      specular: 0.0, cornerRadius: 24, zRadius: 40,
      opacity: 1.0, saturation: 0, brightness: 0,
      tintStrength: 0.0, shadowOpacity: 0.30, shadowSpread: 10,
      shadowOffsetY: 1, blurAmount: 0.0, distortion: 0.0, edgeHighlight: 0.05,
    },
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 13,
    wallpaper: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    isBuiltin: true,
  },
  {
    id: 'builtin-flat-dark',
    name: '暗黑扁平',
    engine: 'flat',
    params: {
      borderWidth: 1, borderOpacity: 0.08,
      cornerRadius: 8, shadowSize: 4, shadowOpacity: 0.08,
    },
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 13,
    wallpaper: { type: 'color', value: '#0a0a0a' },
    isBuiltin: true,
  },
]

// ============================================================
// Helpers
// ============================================================

function generateId(): string {
  return 'preset-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

function mergeBuiltins(existing: ThemePreset[]): ThemePreset[] {
  const now = Date.now()
  const builtins: ThemePreset[] = BUILTIN_PRESETS.map(b => ({ ...b, createdAt: now }))
  const custom = existing.filter(p => !p.isBuiltin)
  // 用最新的内置定义覆盖旧内置
  const mergedBuiltins = builtins.map(b => {
    const old = existing.find(e => e.id === b.id)
    return old ? { ...b, params: { ...b.params, ...old.params }, fontFamily: old.fontFamily || b.fontFamily, fontSize: old.fontSize ?? b.fontSize, wallpaper: old.wallpaper || b.wallpaper } : b
  })
  return [...mergedBuiltins, ...custom]
}

// ============================================================
// Store
// ============================================================

export const useThemePresetStore = create<ThemePresetState>((set, get) => ({
  presets: BUILTIN_PRESETS.map(b => ({ ...b, createdAt: Date.now() })),
  activeId: 'builtin-glass',
  loaded: false,

  loadFromFile: async () => {
    const saved = await loadFromFile<ThemePreset[]>(FILE_KEYS.THEME_PRESETS, [])
    const merged = mergeBuiltins(Array.isArray(saved) ? saved : [])
    set({ presets: merged, activeId: merged[0]?.id || null, loaded: true })
  },

  saveToFile: async () => {
    await saveToFile(FILE_KEYS.THEME_PRESETS, get().presets)
  },

  addPreset: (input) => {
    const preset: ThemePreset = {
      ...input,
      id: generateId(),
      isBuiltin: false,
      createdAt: Date.now(),
    }
    set(state => ({ presets: [...state.presets, preset] }))
    get().saveToFile()
    return preset
  },

  removePreset: (id) => {
    const preset = get().presets.find(p => p.id === id)
    if (!preset || preset.isBuiltin) return
    set(state => ({
      presets: state.presets.filter(p => p.id !== id),
      activeId: state.activeId === id ? state.presets[0]?.id || null : state.activeId,
    }))
    get().saveToFile()
  },

  updatePreset: (id, patch) => {
    set(state => ({
      presets: state.presets.map(p => p.id === id ? { ...p, ...patch } : p),
    }))
    get().saveToFile()
  },

  setActive: (id) => {
    if (get().presets.some(p => p.id === id)) {
      set({ activeId: id })
    }
  },

  applyPreset: async (id) => {
    const preset = get().presets.find(p => p.id === id)
    if (!preset) return

    set({ activeId: id })

    // 1. 应用字体
    if (preset.fontFamily) {
      document.documentElement.style.fontFamily = preset.fontFamily
    }
    if (preset.fontSize) {
      document.documentElement.style.fontSize = `${preset.fontSize}px`
      localStorage.setItem('pw-font-size', String(preset.fontSize))
    }

    // 2. 壁纸不自动应用 — 避免覆盖用户当前壁纸

    // 3. 应用引擎参数
    try {
      const { useThemeStore } = await import('../store/useThemeStore')
      const themeStore = useThemeStore.getState()
      // 动态加载引擎模块并切换
      const themeManager = (themeStore as any)._themeManager
      if (themeManager) {
        // 尝试直接更新当前引擎参数
        themeManager.updateThemeConfig({
          engine: {
            type: preset.engine as any,
            params: preset.params,
          },
        } as any)
      }
    } catch { /* theme store may not be ready */ }

    get().saveToFile()
  },
}))

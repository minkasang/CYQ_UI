// 壁纸 Store
// 给 AI 的话：当前壁纸 + 历史记录，存 localStorage

import { create } from 'zustand'
import type { Wallpaper, WallpaperType } from '../types'
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '../utils/storage'

const HISTORY_KEY = `${STORAGE_KEYS.WALLPAPER}_history`

// 默认壁纸：使用网络图片（色彩丰富，液态玻璃效果更明显）
const DEFAULT_WALLPAPER: Wallpaper = {
  id: 'default',
  type: 'url',
  value: 'https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1920&q=80',
  name: '极光默认',
  createdAt: Date.now(),
}

interface WallpaperState {
  current: Wallpaper
  history: Wallpaper[]
  setCurrent: (wallpaper: Wallpaper) => void
  addToHistory: (wallpaper: Wallpaper) => void
  removeFromHistory: (id: string) => void
  addCustom: (type: WallpaperType, value: string, name?: string) => void
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useWallpaperStore = create<WallpaperState>((set, get) => ({
  current: loadFromStorage<Wallpaper>(`${STORAGE_KEYS.WALLPAPER}_current`, DEFAULT_WALLPAPER),
  history: loadFromStorage<Wallpaper[]>(HISTORY_KEY, [DEFAULT_WALLPAPER]),

  setCurrent: (wallpaper) => {
    set({ current: wallpaper })
    saveToStorage(`${STORAGE_KEYS.WALLPAPER}_current`, wallpaper)
  },

  addToHistory: (wallpaper) => {
    // 去重：如果已存在同名壁纸，不重复添加
    const history = get().history
    const exists = history.some(w => w.value === wallpaper.value)
    if (exists) {
      // 移到最前
      const newHistory = [wallpaper, ...history.filter(w => w.value !== wallpaper.value)].slice(0, 20)
      set({ history: newHistory })
      saveToStorage(HISTORY_KEY, newHistory)
    } else {
      const newHistory = [wallpaper, ...history].slice(0, 20)
      set({ history: newHistory })
      saveToStorage(HISTORY_KEY, newHistory)
    }
  },

  removeFromHistory: (id) => {
    const newHistory = get().history.filter(w => w.id !== id)
    set({ history: newHistory })
    saveToStorage(HISTORY_KEY, newHistory)
    // 如果删的是当前壁纸，回到默认
    if (get().current.id === id) {
      set({ current: DEFAULT_WALLPAPER })
      saveToStorage(`${STORAGE_KEYS.WALLPAPER}_current`, DEFAULT_WALLPAPER)
    }
  },

  addCustom: (type, value, name) => {
    const wallpaper: Wallpaper = {
      id: genId(),
      type,
      value,
      name: name || `${type}-${Date.now()}`,
      createdAt: Date.now(),
    }
    get().addToHistory(wallpaper)
    get().setCurrent(wallpaper)
  },
}))

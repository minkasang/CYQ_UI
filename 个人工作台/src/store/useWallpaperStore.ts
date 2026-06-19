// 壁纸 Store
// 给 AI 的话：当前壁纸 + 历史记录，双持久化（localStorage + JSON 文件）

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Wallpaper, WallpaperType } from '../types'
import { saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 本地壁纸列表
const LOCAL_WALLPAPERS: Wallpaper[] = [
  { id: 'aurora-default', type: 'url', value: '/wallpapers/aurora-default.jpg', name: '极光默认', createdAt: Date.now() },
  { id: 'purple-blue-fluid', type: 'url', value: '/wallpapers/purple-blue-fluid.jpg', name: '紫蓝流体', createdAt: Date.now() },
  { id: 'pink-purple', type: 'url', value: '/wallpapers/pink-purple.jpg', name: '粉紫晕染', createdAt: Date.now() },
  { id: 'mountains', type: 'url', value: '/wallpapers/mountains.jpg', name: '山脉', createdAt: Date.now() },
  { id: 'blue-green-swirl', type: 'url', value: '/wallpapers/blue-green-swirl.jpg', name: '蓝绿漩涡', createdAt: Date.now() },
  { id: 'rainbow-ink', type: 'url', value: '/wallpapers/rainbow-ink.jpg', name: '彩虹油墨', createdAt: Date.now() },
  { id: 'aurora', type: 'url', value: '/wallpapers/aurora.jpg', name: '极光', createdAt: Date.now() },
  { id: 'deep-blue', type: 'url', value: '/wallpapers/deep-blue.jpg', name: '深蓝液态', createdAt: Date.now() },
  { id: 'stars', type: 'url', value: '/wallpapers/stars.jpg', name: '星空', createdAt: Date.now() },
  { id: 'gold-orange', type: 'url', value: '/wallpapers/gold-orange.jpg', name: '金橙交融', createdAt: Date.now() },
  { id: 'ocean', type: 'url', value: '/wallpapers/ocean.jpg', name: '海洋', createdAt: Date.now() },
]

const DEFAULT_WALLPAPER: Wallpaper = LOCAL_WALLPAPERS[0]

interface WallpaperState {
  current: Wallpaper
  history: Wallpaper[]
  presets: Wallpaper[]
  loaded: boolean
  setCurrent: (wallpaper: Wallpaper) => void
  addToHistory: (wallpaper: Wallpaper) => void
  removeFromHistory: (id: string) => void
  addCustom: (type: WallpaperType, value: string, name?: string) => void
  loadFromFile: () => Promise<void>
  saveToFile: () => Promise<void>
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useWallpaperStore = create<WallpaperState>()(
  persist(
    (set, get) => ({
      current: DEFAULT_WALLPAPER,
      history: [DEFAULT_WALLPAPER],
      presets: LOCAL_WALLPAPERS,
      loaded: false,

      loadFromFile: async () => {
        // 纯文件备份：仅供导出/导入使用，不覆盖 persist 的状态
        // persist 中间件已自动处理 localStorage 持久化
      },

      saveToFile: async () => {
        const { current, history } = get()
        await saveToFile(FILE_KEYS.WALLPAPER, { current, history })
      },

      setCurrent: (wallpaper) => {
        set({ current: wallpaper })
        get().addToHistory(wallpaper)
      },

      addToHistory: (wallpaper) => {
        const history = get().history
        const exists = history.some(w => w.value === wallpaper.value)
        if (exists) {
          set({ history: [wallpaper, ...history.filter(w => w.value !== wallpaper.value)].slice(0, 20) })
        } else {
          set({ history: [wallpaper, ...history].slice(0, 20) })
        }
      },

      removeFromHistory: (id) => {
        const newHistory = get().history.filter(w => w.id !== id)
        set({ history: newHistory })
        if (get().current.id === id) set({ current: DEFAULT_WALLPAPER })
      },

      addCustom: (type, value, name) => {
        const wallpaper: Wallpaper = {
          id: genId(), type, value,
          name: name || `${type}-${Date.now()}`,
          createdAt: Date.now(),
        }
        get().addToHistory(wallpaper)
        get().setCurrent(wallpaper)
      },
    }),
    {
      name: 'pw-wallpaper-store',
      partialize: (state) => ({ current: state.current, history: state.history }),
    }
  )
)

// 每次状态变化也写一份文件备份（供导出/导入使用）
let _lastBackup = ''
useWallpaperStore.subscribe((state) => {
  const key = state.current.id + state.history.length
  if (key !== _lastBackup) {
    _lastBackup = key
    saveToFile(FILE_KEYS.WALLPAPER, { current: state.current, history: state.history })
  }
})

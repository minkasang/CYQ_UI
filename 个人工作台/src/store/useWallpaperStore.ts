// 壁纸 Store
// 持久化：Zustand persist → localStorage（主），subscribe → JSON 文件（备份）

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Wallpaper, WallpaperType } from '../types'
import { saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 预设本地壁纸
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
  setCurrent: (wallpaper: Wallpaper) => void
  addToHistory: (wallpaper: Wallpaper) => void
  removeFromHistory: (id: string) => void
  addCustom: (type: WallpaperType, value: string, name?: string) => void
  loadFromFile: () => Promise<void>  // 保留兼容（persist 接管后为空操作）
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

      // persist 已接管持久化，此方法保留仅为兼容旧调用方
      loadFromFile: async () => {},

      setCurrent: (wallpaper) => {
        set({ current: wallpaper })
      },

      addToHistory: (wallpaper) => {
        const history = get().history
        const exists = history.some(w => w.value === wallpaper.value)
        const next = exists
          ? [wallpaper, ...history.filter(w => w.value !== wallpaper.value)]
          : [wallpaper, ...history]
        set({ history: next.slice(0, 20) })
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
        // addToHistory + setCurrent，不重复
        get().addToHistory(wallpaper)
        set({ current: wallpaper })
      },
    }),
    {
      name: 'pw-wallpaper-store',
      partialize: (state) => ({ current: state.current, history: state.history }),
    }
  )
)

// 文件备份：每次变化同步写 JSON（供导出/导入）
let _lastBackup = ''
useWallpaperStore.subscribe((state) => {
  const key = state.current.id + String(state.history.length)
  if (key !== _lastBackup) {
    _lastBackup = key
    saveToFile(FILE_KEYS.WALLPAPER, { current: state.current, history: state.history })
  }
})

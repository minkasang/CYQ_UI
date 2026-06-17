// 壁纸 Store
// 给 AI 的话：当前壁纸 + 历史记录，存配置文件（个人工作台/data/wallpaper.json）

import { create } from 'zustand'
import type { Wallpaper, WallpaperType } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 本地壁纸列表（已下载到 public/wallpapers/）
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

// 默认壁纸：使用本地图片（加载更快）
const DEFAULT_WALLPAPER: Wallpaper = LOCAL_WALLPAPERS[0]

// 检测是否是网络 URL（需要迁移到本地）
function isNetworkUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://')
}

interface WallpaperState {
  current: Wallpaper
  history: Wallpaper[]
  presets: Wallpaper[]  // 本地预设壁纸列表
  loaded: boolean  // 是否已从文件加载
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

export const useWallpaperStore = create<WallpaperState>((set, get) => ({
  // 初始值（等待从文件加载）
  current: DEFAULT_WALLPAPER,
  history: [DEFAULT_WALLPAPER],
  presets: LOCAL_WALLPAPERS,
  loaded: false,

  // 从配置文件加载壁纸数据
  loadFromFile: async () => {
    const data = await loadFromFile<{
      current?: Wallpaper
      history?: Wallpaper[]
    }>(FILE_KEYS.WALLPAPER, { current: DEFAULT_WALLPAPER, history: [DEFAULT_WALLPAPER] })

    // 处理空对象或缺失字段
    let current = data.current || DEFAULT_WALLPAPER
    let history = data.history || [DEFAULT_WALLPAPER]

    // 迁移网络 URL 到本地
    if (isNetworkUrl(current.value)) {
      const matched = LOCAL_WALLPAPERS.find(w => w.name === current.name)
      current = matched || DEFAULT_WALLPAPER
    }

    history = history
      .map(w => isNetworkUrl(w.value) ? (LOCAL_WALLPAPERS.find(l => l.name === w.name) || DEFAULT_WALLPAPER) : w)
      .filter(w => !isNetworkUrl(w.value))
    if (history.length === 0) {
      history.push(DEFAULT_WALLPAPER)
    }

    set({ current, history, loaded: true })
    console.log('[wallpaper] 从文件加载完成:', current.name)
  },

  // 保存到配置文件
  saveToFile: async () => {
    const { current, history } = get()
    await saveToFile(FILE_KEYS.WALLPAPER, { current, history })
    console.log('[wallpaper] 已保存到文件:', current.name)
  },

  setCurrent: (wallpaper) => {
    set({ current: wallpaper })
    get().addToHistory(wallpaper)
    get().saveToFile()
  },

  addToHistory: (wallpaper) => {
    const history = get().history
    const exists = history.some(w => w.value === wallpaper.value)
    if (exists) {
      const newHistory = [wallpaper, ...history.filter(w => w.value !== wallpaper.value)].slice(0, 20)
      set({ history: newHistory })
    } else {
      const newHistory = [wallpaper, ...history].slice(0, 20)
      set({ history: newHistory })
    }
  },

  removeFromHistory: (id) => {
    const newHistory = get().history.filter(w => w.id !== id)
    set({ history: newHistory })
    if (get().current.id === id) {
      set({ current: DEFAULT_WALLPAPER })
    }
    get().saveToFile()
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

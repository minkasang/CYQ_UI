// 壁纸 Store
// 持久化：JSON 文件（通过 server.py API），localStorage 只存 currentId + historyIds

import { create } from 'zustand'
import type { Wallpaper, WallpaperType } from '../types'
import { saveToFile, FILE_KEYS } from '../utils/fileStorage'

const STORAGE_KEY = 'pw-wallpaper-ids'

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

// 查找表：ID → 壁纸完整对象（内存中，存预设 + 运行时自定义壁纸）
const idMap = new Map<string, Wallpaper>()
LOCAL_WALLPAPERS.forEach(w => idMap.set(w.id, w))

// 从 localStorage 读 ID 列表，恢复壁纸对象
function loadIds(): { currentId: string | null; historyIds: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { currentId: null, historyIds: [] }
}

// 保存 ID 列表到 localStorage（极小，几KB）
function saveIds(currentId: string, historyIds: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ currentId, historyIds }))
  } catch {}
}

// 从 JSON 文件恢复完整壁纸数据（包含 base64 value）
async function restoreFromFile(): Promise<{ current: Wallpaper; history: Wallpaper[] } | null> {
  try {
    const res = await fetch(`http://localhost:8090/api/read?path=${encodeURIComponent(FILE_KEYS.WALLPAPER)}`)
    const j = await res.json()
    if (!j.ok) return null
    const data = JSON.parse(j.content)
    if (!data?.current?.id) return null

    // 注册到 idMap
    const history = Array.isArray(data.history) ? data.history.filter((w: any) => w?.id) : []
    for (const w of history) idMap.set(w.id, w)
    idMap.set(data.current.id, data.current)

    return { current: data.current, history }
  } catch {
    return null
  }
}

interface WallpaperState {
  current: Wallpaper
  history: Wallpaper[]
  presets: Wallpaper[]
  setCurrent: (wallpaper: Wallpaper) => void
  addToHistory: (wallpaper: Wallpaper) => void
  removeFromHistory: (id: string) => void
  addCustom: (type: WallpaperType, value: string, name?: string) => void
  loadFromFile: () => Promise<void>
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useWallpaperStore = create<WallpaperState>((set, get) => ({
  current: DEFAULT_WALLPAPER,
  history: [DEFAULT_WALLPAPER],
  presets: LOCAL_WALLPAPERS,

  loadFromFile: async () => {
    // 1. 先从 localStorage 的 ID 快速恢复（预设壁纸不需要网络）
    const ids = loadIds()
    if (ids.currentId && idMap.has(ids.currentId)) {
      const current = idMap.get(ids.currentId)!
      const history = ids.historyIds.map(id => idMap.get(id)).filter(Boolean) as Wallpaper[]
      if (history.length > 0) {
        set({ current, history: history.length > 0 ? history : [DEFAULT_WALLPAPER] })
      }
    }

    // 2. 再从 JSON 文件恢复（含自定义壁纸的完整数据）
    const fileData = await restoreFromFile()
    if (fileData) {
      set({ current: fileData.current, history: fileData.history })
    }
  },

  setCurrent: (wallpaper) => {
    idMap.set(wallpaper.id, wallpaper)
    set({ current: wallpaper })
    saveIds(wallpaper.id, get().history.map(w => w.id))
  },

  addToHistory: (wallpaper) => {
    idMap.set(wallpaper.id, wallpaper)
    const history = get().history
    const exists = history.some(w => w.value === wallpaper.value)
    const next = exists
      ? [wallpaper, ...history.filter(w => w.value !== wallpaper.value)]
      : [wallpaper, ...history]
    const newHistory = next.slice(0, 20)
    set({ history: newHistory })
    saveIds(get().current.id, newHistory.map(w => w.id))
  },

  removeFromHistory: (id) => {
    const newHistory = get().history.filter(w => w.id !== id)
    set({ history: newHistory })
    if (get().current.id === id) set({ current: DEFAULT_WALLPAPER })
    saveIds(get().current.id, newHistory.map(w => w.id))
  },

  addCustom: (type, value, name) => {
    const wallpaper: Wallpaper = {
      id: genId(), type, value,
      name: name || `${type}-${Date.now()}`,
      createdAt: Date.now(),
    }
    idMap.set(wallpaper.id, wallpaper)
    get().addToHistory(wallpaper)
    set({ current: wallpaper })
    saveIds(wallpaper.id, get().history.map(w => w.id))
  },
}))

// 文件备份：每次变化同步写 JSON（完整数据，供导出/导入 + 预设备份）
let _lastBackup = ''
useWallpaperStore.subscribe((state) => {
  const key = state.current.id + String(state.history.length)
  if (key !== _lastBackup) {
    _lastBackup = key
    saveToFile(FILE_KEYS.WALLPAPER, { current: state.current, history: state.history })
  }
})

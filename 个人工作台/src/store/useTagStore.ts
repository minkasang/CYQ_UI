// 标签 Store
// 管理待办任务的标签

import { create } from 'zustand'
import type { Tag } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

interface TagState {
  tags: Tag[]
  loading: boolean
  loaded: boolean
  loadTags: () => Promise<void>
  addTag: (name: string, color: string) => void
  updateTag: (id: string, patch: Partial<Tag>) => void
  deleteTag: (id: string) => void
}

// 生成简单唯一 ID
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 预设颜色
export const TAG_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loading: false,
  loaded: false,

  loadTags: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const tags = await loadFromFile<Tag[]>(FILE_KEYS.TAGS, [])
      set({ tags, loading: false, loaded: true })
    } catch (err) {
      console.error('[TagStore] 加载失败:', err)
      set({ loading: false, loaded: true })
    }
  },

  addTag: (name, color) => {
    const tag: Tag = {
      id: genId(),
      name,
      color,
      createdAt: Date.now(),
    }
    const newTags = [...get().tags, tag]
    set({ tags: newTags })
    saveToFile(FILE_KEYS.TAGS, newTags)
  },

  updateTag: (id, patch) => {
    const newTags = get().tags.map(t =>
      t.id === id ? { ...t, ...patch } : t
    )
    set({ tags: newTags })
    saveToFile(FILE_KEYS.TAGS, newTags)
  },

  deleteTag: (id) => {
    const newTags = get().tags.filter(t => t.id !== id)
    set({ tags: newTags })
    saveToFile(FILE_KEYS.TAGS, newTags)
  },
}))

// 选择器：根据 ID 列表获取标签
export const selectTagsByIds = (state: TagState, ids: string[]): Tag[] => {
  return state.tags.filter(t => ids.includes(t.id))
}

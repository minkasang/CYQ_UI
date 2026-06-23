// 标签管理 Store — Zustand persist
// 为 Todo 模块提供标签 CRUD 能力

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Tag {
  id: string
  name: string
  color?: string
  createdAt: number
}

interface TagStore {
  tags: Tag[]
  loaded: boolean

  loadTags: () => void
  addTag: (name: string, color?: string) => Tag
  updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => void
  deleteTag: (id: string) => void
  getAll: () => Tag[]
}

export function selectTagsByIds(tagIds: string[]): (state: TagStore) => Tag[] {
  return (state) => state.tags.filter(t => tagIds.includes(t.id))
}

export const useTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      tags: [],
      loaded: false,

      loadTags: () => { set({ loaded: true }) },

      addTag: (name: string, color?: string) => {
        const tag: Tag = {
          id: crypto.randomUUID(),
          name: name.trim(),
          color,
          createdAt: Date.now(),
        }
        set({ tags: [...get().tags, tag] })
        return tag
      },

      updateTag: (id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>) => {
        set({ tags: get().tags.map(t => (t.id === id ? { ...t, ...updates } : t)) })
      },

      deleteTag: (id: string) => {
        set({ tags: get().tags.filter(t => t.id !== id) })
      },

      getAll: () => get().tags,
    }),
    { name: 'todo-tags', partialize: (state) => ({ tags: state.tags, loaded: state.loaded }) }
  )
)

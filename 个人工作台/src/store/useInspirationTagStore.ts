// 标签管理 Store — Zustand persist
// 管理标签元数据：名称、颜色、使用统计

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const COLORS = [
  '#0A84FF', // Blue
  '#FF6B6B', // Red
  '#51CF66', // Green
  '#FFD43B', // Yellow
  '#CC5DE8', // Purple
  '#FF922B', // Orange
  '#20C997', // Teal
  '#F06595', // Pink
  '#74C0FC', // Light Blue
  '#A9E34B', // Lime
]

export interface TagMeta {
  name: string
  color: string
  createdAt: number
}

interface TagStore {
  tags: TagMeta[]

  /** 获取或创建标签（首次使用时自动分配颜色） */
  ensure: (name: string) => TagMeta

  /** 更新标签颜色 */
  setColor: (name: string, color: string) => void

  /** 合并标签：from 合并到 to，返回合并后的标签名 */
  merge: (from: string, to: string) => void

  /** 删除标签元数据（不影响已使用该标签的记录） */
  remove: (name: string) => void

  /** 获取所有按使用频率排序的标签名（需外部传入统计） */
  getAll: () => TagMeta[]
}

function pickColor(tags: TagMeta[]): string {
  const used = new Set(tags.map(t => t.color))
  const available = COLORS.filter(c => !used.has(c))
  return available.length > 0 ? available[0] : COLORS[tags.length % COLORS.length]
}

export const useInspirationTagStore = create<TagStore>()(
  persist(
    (set, get) => ({
      tags: [],

      ensure: (name: string) => {
        const existing = get().tags.find(t => t.name === name)
        if (existing) return existing
        const meta: TagMeta = { name, color: pickColor(get().tags), createdAt: Date.now() }
        set({ tags: [...get().tags, meta] })
        return meta
      },

      setColor: (name, color) => {
        set({ tags: get().tags.map(t => t.name === name ? { ...t, color } : t) })
      },

      merge: (from, to) => {
        const { tags } = get()
        if (!tags.find(t => t.name === from) || !tags.find(t => t.name === to)) return
        // 保留 to，删除 from
        set({ tags: tags.filter(t => t.name !== from) })
      },

      remove: (name) => {
        set({ tags: get().tags.filter(t => t.name !== name) })
      },

      getAll: () => get().tags,
    }),
    { name: 'pw-inspiration-tags' }
  )
)

// 每日灵感 Store — Zustand persist
// 个人数字 Commonplace Book：捕获触动自己的名言/哲理/好句子

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { InspirationItem } from '../types'

interface InspirationStore {
  items: InspirationItem[]
  currentId: string | null

  add: (input: {
    content: string
    source?: string
    tags?: string[]
    reflection?: string
    impact?: number
  }) => InspirationItem

  toggleFavorite: (id: string) => void
  setImpact: (id: string, impact: number) => void
  markReviewed: (id: string) => void
  getNextReview: () => InspirationItem | null
  remove: (id: string) => void
  update: (id: string, patch: Partial<Pick<InspirationItem, 'content' | 'source' | 'tags' | 'reflection'>>) => void
}

export const useInspirationStore = create<InspirationStore>()(
  persist(
    (set, get) => ({
      items: [],
      currentId: null,

      add: (input) => {
        const now = Date.now()
        const item: InspirationItem = {
          id: crypto.randomUUID(),
          content: input.content.trim(),
          source: input.source?.trim() || undefined,
          tags: input.tags?.filter(Boolean) ?? [],
          reflection: input.reflection?.trim() || undefined,
          impact: input.impact ?? 2,
          isFavorite: false,
          createdAt: now,
          lastReviewedAt: now,
        }
        set({ items: [item, ...get().items] })
        return item
      },

      toggleFavorite: (id) => {
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
          ),
        })
      },

      setImpact: (id, impact) => {
        const clamped = Math.max(1, Math.min(3, Math.round(impact)))
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, impact: clamped } : item
          ),
        })
      },

      markReviewed: (id) => {
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, lastReviewedAt: Date.now() } : item
          ),
        })
      },

      getNextReview: () => {
        const { items } = get()
        if (items.length === 0) return null
        if (items.length === 1) return items[0]

        // 加权评分：lastReviewedAt 越早 + impact 越高 → 分值越低（越优先出现）
        const scored = items.map(item => ({
          item,
          score: item.lastReviewedAt - item.impact * 86400000, // impact * 1天
        }))
        scored.sort((a, b) => a.score - b.score)

        // 前半段随机选一条（增加变化性，避免总是同一条）
        const pool = scored.slice(0, Math.ceil(scored.length / 2))
        const chosen = pool[Math.floor(Math.random() * pool.length)].item
        set({ currentId: chosen.id })
        return chosen
      },

      remove: (id) => {
        set({ items: get().items.filter(item => item.id !== id) })
        if (get().currentId === id) set({ currentId: null })
      },

      update: (id, patch) => {
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, ...patch } : item
          ),
        })
      },
    }),
    {
      name: 'pw-inspiration',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

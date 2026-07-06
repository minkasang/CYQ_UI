// 人生图谱 Store — Zustand persist
// 从低门槛收集箱出发，逐步沉淀洞察、原则和小行动实验

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ActionExperiment,
  ActionExperimentStatus,
  InspirationItem,
  InspirationKind,
  LifeDimension,
} from '../types'

type InspirationInput = {
  content: string
  source?: string
  tags?: string[]
  reflection?: string
  kind?: InspirationKind
  dimensions?: LifeDimension[]
  insight?: string
  principle?: string
  actionExperiment?: {
    title: string
    trigger?: string
    action: string
    status?: ActionExperimentStatus
  }
  impact?: number
}

type InspirationPatch = Partial<Pick<
  InspirationItem,
  | 'content'
  | 'source'
  | 'tags'
  | 'reflection'
  | 'kind'
  | 'dimensions'
  | 'insight'
  | 'principle'
  | 'actionExperiment'
  | 'linkedDiaryIds'
>>

interface InspirationStore {
  items: InspirationItem[]
  currentId: string | null

  add: (input: InspirationInput) => InspirationItem

  toggleFavorite: (id: string) => void
  setImpact: (id: string, impact: number) => void
  markReviewed: (id: string) => void
  getNextReview: () => InspirationItem | null
  remove: (id: string) => void
  update: (id: string, patch: InspirationPatch) => void
  updateActionExperiment: (id: string, patch: Partial<ActionExperiment> | null) => void
}

function createActionExperiment(input: InspirationInput['actionExperiment']): ActionExperiment | undefined {
  if (!input?.title.trim() || !input.action.trim()) return undefined
  return {
    title: input.title.trim(),
    trigger: input.trigger?.trim() || undefined,
    action: input.action.trim(),
    status: input.status ?? 'planned',
    createdAt: Date.now(),
  }
}

function normalizePatch(patch: InspirationPatch): InspirationPatch {
  const normalized: InspirationPatch = {}
  if ('content' in patch) normalized.content = patch.content?.trim()
  if ('source' in patch) normalized.source = patch.source?.trim() || undefined
  if ('tags' in patch) normalized.tags = patch.tags?.map(t => t.trim()).filter(Boolean)
  if ('reflection' in patch) normalized.reflection = patch.reflection?.trim() || undefined
  if ('kind' in patch) normalized.kind = patch.kind
  if ('dimensions' in patch) normalized.dimensions = patch.dimensions?.filter(Boolean)
  if ('insight' in patch) normalized.insight = patch.insight?.trim() || undefined
  if ('principle' in patch) normalized.principle = patch.principle?.trim() || undefined
  if ('actionExperiment' in patch) normalized.actionExperiment = patch.actionExperiment
  if ('linkedDiaryIds' in patch) normalized.linkedDiaryIds = patch.linkedDiaryIds
  return normalized
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
          kind: input.kind ?? 'fragment',
          dimensions: input.dimensions?.filter(Boolean) ?? [],
          insight: input.insight?.trim() || undefined,
          principle: input.principle?.trim() || undefined,
          actionExperiment: createActionExperiment(input.actionExperiment),
          linkedDiaryIds: [],
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
        const normalized = normalizePatch(patch)
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, ...normalized } : item
          ),
        })
      },

      updateActionExperiment: (id, patch) => {
        set({
          items: get().items.map(item => {
            if (item.id !== id) return item
            if (patch === null) return { ...item, actionExperiment: undefined }

            const previous = item.actionExperiment
            const nextStatus = patch.status ?? previous?.status ?? 'planned'
            const next: ActionExperiment = {
              title: (patch.title ?? previous?.title ?? '').trim(),
              trigger: (patch.trigger ?? previous?.trigger)?.trim() || undefined,
              action: (patch.action ?? previous?.action ?? '').trim(),
              status: nextStatus,
              createdAt: previous?.createdAt ?? Date.now(),
              completedAt: nextStatus === 'done'
                ? patch.completedAt ?? previous?.completedAt ?? Date.now()
                : undefined,
            }

            if (!next.title || !next.action) return item
            return { ...item, actionExperiment: next }
          }),
        })
      },
    }),
    {
      name: 'pw-inspiration',
      partialize: (state) => ({ items: state.items }),
    }
  )
)

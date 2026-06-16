// 日记 Store
// 使用文件存储实现数据持久化，调用 server.py API 读写本地文件

import { create } from 'zustand'
import type { Diary } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'
import { getToday } from '../utils/date'

interface DiaryState {
  diaries: Diary[]
  currentId: string | null
  loading: boolean
  loaded: boolean
  loadDiaries: () => Promise<void>
  setCurrent: (id: string | null) => void
  createDiary: (date?: string) => Diary
  updateDiary: (id: string, patch: Partial<Diary>) => void
  deleteDiary: (id: string) => void
  getDiaryByDate: (date: string) => Diary | undefined
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useDiaryStore = create<DiaryState>((set, get) => ({
  diaries: [],
  currentId: null,
  loading: false,
  loaded: false,

  // 从文件加载日记数据
  loadDiaries: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const diaries = await loadFromFile<Diary[]>(FILE_KEYS.DIARIES, [])
      set({ diaries, loading: false, loaded: true })
    } catch (err) {
      console.error('[DiaryStore] 加载失败:', err)
      set({ loading: false, loaded: true })
    }
  },

  setCurrent: (id) => set({ currentId: id }),

  createDiary: (date) => {
    const targetDate = date || getToday()
    const existing = get().diaries.find(d => d.date === targetDate)
    if (existing) {
      set({ currentId: existing.id })
      return existing
    }
    const diary: Diary = {
      id: genId(),
      title: `${targetDate} 的日记`,
      content: '',
      date: targetDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    const newDiaries = [diary, ...get().diaries]
    set({ diaries: newDiaries, currentId: diary.id })
    saveToFile(FILE_KEYS.DIARIES, newDiaries)
    return diary
  },

  updateDiary: (id, patch) => {
    const newDiaries = get().diaries.map(d =>
      d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
    )
    set({ diaries: newDiaries })
    saveToFile(FILE_KEYS.DIARIES, newDiaries)
  },

  deleteDiary: (id) => {
    const newDiaries = get().diaries.filter(d => d.id !== id)
    set({ diaries: newDiaries, currentId: null })
    saveToFile(FILE_KEYS.DIARIES, newDiaries)
  },

  getDiaryByDate: (date) => {
    return get().diaries.find(d => d.date === date)
  },
}))

// 按日期降序排序的选择器
export const selectSortedDiaries = (state: DiaryState): Diary[] => {
  return [...state.diaries].sort((a, b) => b.date.localeCompare(a.date))
}
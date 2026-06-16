// 日记 Store
// 给 AI 的话：使用 Zustand 管理日记状态，自动持久化到 localStorage

import { create } from 'zustand'
import type { Diary } from '../types'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'
import { getToday } from '../utils/date'

interface DiaryState {
  diaries: Diary[]
  currentId: string | null
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
  diaries: loadFromStorage<Diary[]>(STORAGE_KEYS.DIARIES, []),
  currentId: null,

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
    saveToStorage(STORAGE_KEYS.DIARIES, newDiaries)
    return diary
  },

  updateDiary: (id, patch) => {
    const newDiaries = get().diaries.map(d =>
      d.id === id ? { ...d, ...patch, updatedAt: Date.now() } : d
    )
    set({ diaries: newDiaries })
    saveToStorage(STORAGE_KEYS.DIARIES, newDiaries)
  },

  deleteDiary: (id) => {
    const newDiaries = get().diaries.filter(d => d.id !== id)
    set({ diaries: newDiaries, currentId: null })
    saveToStorage(STORAGE_KEYS.DIARIES, newDiaries)
  },

  getDiaryByDate: (date) => {
    return get().diaries.find(d => d.date === date)
  },
}))

// 按日期降序排序的选择器
export const selectSortedDiaries = (state: DiaryState): Diary[] => {
  return [...state.diaries].sort((a, b) => b.date.localeCompare(a.date))
}

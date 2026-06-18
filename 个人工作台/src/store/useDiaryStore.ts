// 日记 Store
// 使用文件存储实现数据持久化，调用 server.py API 读写本地文件

import { create } from 'zustand'
import type { Diary, EmotionData } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'
import { getToday } from '../utils/date'
import { acquireWriteLock, releaseWriteLock } from '../utils/writeLock'
import { logOperation } from '../utils/operationLogger'

interface DiaryState {
  diaries: Diary[]
  currentId: string | null
  loading: boolean
  loaded: boolean
  loadDiaries: () => Promise<void>
  loadDiariesFromData: (diaries: Diary[]) => void // 从备份数据加载
  setCurrent: (id: string | null) => void
  createDiary: (date?: string) => Diary | null // 返回 null 表示获取锁失败
  updateDiary: (id: string, patch: Partial<Diary>) => boolean // 返回是否成功
  deleteDiary: (id: string) => boolean // 返回是否成功
  getDiaryByDate: (date: string) => Diary | undefined
  setEmotionData: (id: string, emotionData: EmotionData) => boolean
}

// 计算字数（去除空白字符）
function countWords(text: string): number {
  return text.replace(/\s/g, '').length
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

  // 从备份数据加载
  loadDiariesFromData: (diaries) => {
    set({ diaries, loaded: true })
    saveToFile(FILE_KEYS.DIARIES, diaries)
  },

  createDiary: (date) => {
    const lockId = acquireWriteLock('createDiary')
    if (!lockId) {
      console.warn('[DiaryStore] 获取写入锁失败')
      return null
    }

    try {
      const targetDate = date || getToday()
      // 始终创建新日记，允许同一天多篇日记
      const diary: Diary = {
        id: genId(),
        title: `${targetDate} 的日记`,
        content: '',
        date: targetDate,
        wordCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      const newDiaries = [diary, ...get().diaries]
      set({ diaries: newDiaries, currentId: diary.id })
      saveToFile(FILE_KEYS.DIARIES, newDiaries)

      // 记录操作日志
      logOperation('diary:create', { id: diary.id, date: targetDate })

      return diary
    } finally {
      releaseWriteLock(lockId)
    }
  },

  updateDiary: (id, patch) => {
    const lockId = acquireWriteLock('updateDiary')
    if (!lockId) {
      console.warn('[DiaryStore] 获取写入锁失败')
      return false
    }

    try {
      const newDiaries = get().diaries.map(d => {
        if (d.id !== id) return d
        // 自动计算字数
        const content = patch.content !== undefined ? patch.content : d.content
        const wordCount = countWords(content)
        return { ...d, ...patch, wordCount, updatedAt: Date.now() }
      })
      set({ diaries: newDiaries })
      saveToFile(FILE_KEYS.DIARIES, newDiaries)

      // 记录操作日志
      logOperation('diary:update', { id, wordCount: patch.wordCount })

      return true
    } finally {
      releaseWriteLock(lockId)
    }
  },

  deleteDiary: (id) => {
    const lockId = acquireWriteLock('deleteDiary')
    if (!lockId) {
      console.warn('[DiaryStore] 获取写入锁失败')
      return false
    }

    try {
      const newDiaries = get().diaries.filter(d => d.id !== id)
      set({ diaries: newDiaries, currentId: null })
      saveToFile(FILE_KEYS.DIARIES, newDiaries)

      // 记录操作日志
      logOperation('diary:delete', { id })

      return true
    } finally {
      releaseWriteLock(lockId)
    }
  },

  getDiaryByDate: (date) => {
    return get().diaries.find(d => d.date === date)
  },

  setEmotionData: (id, emotionData) => {
    const lockId = acquireWriteLock('setEmotionData')
    if (!lockId) {
      console.warn('[DiaryStore] 获取写入锁失败')
      return false
    }

    try {
      const newDiaries = get().diaries.map(d =>
        d.id === id ? { ...d, emotionData } : d
      )
      set({ diaries: newDiaries })
      saveToFile(FILE_KEYS.DIARIES, newDiaries)
      return true
    } finally {
      releaseWriteLock(lockId)
    }
  },
}))

// 按日期降序排序的选择器
export const selectSortedDiaries = (state: DiaryState): Diary[] => {
  return [...state.diaries].sort((a, b) => b.date.localeCompare(a.date))
}
// 成就系统 Store
// 跟踪用户成就，定义成就规则

import { create } from 'zustand'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

// 成就定义
export interface Achievement {
  id: string
  name: string
  description: string
  icon: string        // emoji 或图标名
  category: 'tasks' | 'streak' | 'time' | 'special'
  requirement: number // 达成条件数值
  unlockedAt?: number // 解锁时间
}

// 预定义成就列表
export const ACHIEVEMENTS: Achievement[] = [
  // 任务成就
  { id: 'first_task', name: '初来乍到', description: '完成第一个任务', icon: '🎯', category: 'tasks', requirement: 1 },
  { id: 'task_10', name: '小试牛刀', description: '完成10个任务', icon: '✨', category: 'tasks', requirement: 10 },
  { id: 'task_50', name: '渐入佳境', description: '完成50个任务', icon: '🌟', category: 'tasks', requirement: 50 },
  { id: 'task_100', name: '百炼成钢', description: '完成100个任务', icon: '💫', category: 'tasks', requirement: 100 },
  { id: 'task_500', name: '大师级', description: '完成500个任务', icon: '🏆', category: 'tasks', requirement: 500 },

  // 连续成就
  { id: 'streak_3', name: '三天成习', description: '连续3天完成任务', icon: '🔥', category: 'streak', requirement: 3 },
  { id: 'streak_7', name: '一周达人', description: '连续7天完成任务', icon: '💪', category: 'streak', requirement: 7 },
  { id: 'streak_30', name: '月度冠军', description: '连续30天完成任务', icon: '👑', category: 'streak', requirement: 30 },

  // 时间成就
  { id: 'time_1h', name: '专注一小时', description: '单任务累计计时1小时', icon: '⏱️', category: 'time', requirement: 60 },
  { id: 'time_10h', name: '时间管理大师', description: '累计计时10小时', icon: '⏰', category: 'time', requirement: 600 },

  // 特殊成就
  { id: 'early_bird', name: '早起鸟儿', description: '在早上6点前完成任务', icon: '🐦', category: 'special', requirement: 1 },
  { id: 'night_owl', name: '夜猫子', description: '在凌晨完成任务', icon: '🦉', category: 'special', requirement: 1 },
  { id: 'perfectionist', name: '完美主义', description: '单任务所有子任务都完成', icon: '💎', category: 'special', requirement: 1 },
]

interface AchievementState {
  unlockedIds: string[]   // 已解锁的成就ID
  stats: {
    totalCompleted: number    // 总完成任务数
    currentStreak: number     // 当前连续天数
    longestStreak: number     // 最长连续天数
    totalTimeSpent: number    // 总计时时长（分钟）
    lastCompletedDate?: string // 最后完成日期
  }
  loading: boolean
  loaded: boolean

  // 操作
  loadAchievements: () => Promise<void>
  checkAndUnlock: (stats: Partial<AchievementState['stats']>) => Achievement[]
  unlockAchievement: (id: string) => void
  updateStats: (newStats: Partial<AchievementState['stats']>) => void
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
  unlockedIds: [],
  stats: {
    totalCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalTimeSpent: 0,
  },
  loading: false,
  loaded: false,

  loadAchievements: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const data = await loadFromFile<{
        unlockedIds: string[]
        stats: AchievementState['stats']
      }>(FILE_KEYS.ACHIEVEMENTS, { unlockedIds: [], stats: get().stats })
      set({ ...data, loading: false, loaded: true })
    } catch (err) {
      console.error('[AchievementStore] 加载失败:', err)
      set({ loading: false, loaded: true })
    }
  },

  checkAndUnlock: (newStats) => {
    const { unlockedIds, stats } = get()
    const updatedStats = { ...stats, ...newStats }
    const newlyUnlocked: Achievement[] = []

    // 检查每个成就
    for (const achievement of ACHIEVEMENTS) {
      if (unlockedIds.includes(achievement.id)) continue

      let shouldUnlock = false
      switch (achievement.category) {
        case 'tasks':
          shouldUnlock = updatedStats.totalCompleted >= achievement.requirement
          break
        case 'streak':
          shouldUnlock = updatedStats.currentStreak >= achievement.requirement
          break
        case 'time':
          shouldUnlock = updatedStats.totalTimeSpent >= achievement.requirement
          break
      }

      if (shouldUnlock) {
        newlyUnlocked.push({ ...achievement, unlockedAt: Date.now() })
      }
    }

    // 更新状态
    if (newlyUnlocked.length > 0) {
      const newUnlockedIds = [...unlockedIds, ...newlyUnlocked.map(a => a.id)]
      set({ unlockedIds: newUnlockedIds, stats: updatedStats })
      saveToFile(FILE_KEYS.ACHIEVEMENTS, { unlockedIds: newUnlockedIds, stats: updatedStats })
    } else if (JSON.stringify(stats) !== JSON.stringify(updatedStats)) {
      set({ stats: updatedStats })
      saveToFile(FILE_KEYS.ACHIEVEMENTS, { unlockedIds, stats: updatedStats })
    }

    return newlyUnlocked
  },

  unlockAchievement: (id) => {
    const { unlockedIds, stats } = get()
    if (unlockedIds.includes(id)) return

    const achievement = ACHIEVEMENTS.find(a => a.id === id)
    if (!achievement) return

    const newUnlockedIds = [...unlockedIds, id]
    set({ unlockedIds: newUnlockedIds })
    saveToFile(FILE_KEYS.ACHIEVEMENTS, { unlockedIds: newUnlockedIds, stats })
  },

  updateStats: (newStats) => {
    const { stats, unlockedIds } = get()
    const updatedStats = { ...stats, ...newStats }
    set({ stats: updatedStats })
    saveToFile(FILE_KEYS.ACHIEVEMENTS, { unlockedIds, stats: updatedStats })
  },
}))

// 获取已解锁的成就详情
export function getUnlockedAchievements(): Achievement[] {
  const unlockedIds = useAchievementStore.getState().unlockedIds
  return ACHIEVEMENTS.filter(a => unlockedIds.includes(a.id)).map(a => ({
    ...a,
    unlockedAt: Date.now(), // 实际解锁时间从store获取
  }))
}

// 获取成就进度
export function getAchievementProgress(achievement: Achievement): { current: number; target: number; percent: number } {
  const stats = useAchievementStore.getState().stats
  let current = 0

  switch (achievement.category) {
    case 'tasks':
      current = stats.totalCompleted
      break
    case 'streak':
      current = stats.currentStreak
      break
    case 'time':
      current = stats.totalTimeSpent
      break
  }

  return {
    current,
    target: achievement.requirement,
    percent: Math.min(100, Math.round((current / achievement.requirement) * 100)),
  }
}

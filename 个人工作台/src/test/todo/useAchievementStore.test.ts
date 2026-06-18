import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAchievementStore, ACHIEVEMENTS } from '../../store/useAchievementStore'

// Mock fileStorage
vi.mock('../../utils/fileStorage', () => ({
  loadFromFile: vi.fn().mockResolvedValue({ unlockedIds: [], stats: { totalCompleted: 0, currentStreak: 0, longestStreak: 0, totalTimeSpent: 0 } }),
  saveToFile: vi.fn().mockResolvedValue(true),
  FILE_KEYS: {
    ACHIEVEMENTS: '个人工作台/data/achievements.json',
  },
}))

describe('useAchievementStore', () => {
  beforeEach(() => {
    // 重置 store
    useAchievementStore.setState({
      unlockedIds: [],
      stats: {
        totalCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalTimeSpent: 0,
      },
      loading: false,
      loaded: false,
    })
  })

  describe('成就定义', () => {
    it('应该有预定义的成就列表', () => {
      expect(ACHIEVEMENTS.length).toBeGreaterThan(0)
    })

    it('每个成就应该有必要的字段', () => {
      for (const achievement of ACHIEVEMENTS) {
        expect(achievement.id).toBeDefined()
        expect(achievement.name).toBeDefined()
        expect(achievement.description).toBeDefined()
        expect(achievement.icon).toBeDefined()
        expect(achievement.category).toBeDefined()
        expect(achievement.requirement).toBeGreaterThan(0)
      }
    })
  })

  describe('成就解锁', () => {
    it('完成第一个任务应该解锁"初来乍到"成就', () => {
      const newlyUnlocked = useAchievementStore.getState().checkAndUnlock({ totalCompleted: 1 })

      expect(newlyUnlocked.length).toBe(1)
      expect(newlyUnlocked[0].id).toBe('first_task')
    })

    it('完成10个任务应该解锁两个成就', () => {
      const newlyUnlocked = useAchievementStore.getState().checkAndUnlock({ totalCompleted: 10 })

      // 应该解锁 first_task 和 task_10
      expect(newlyUnlocked.length).toBe(2)
      const ids = newlyUnlocked.map(a => a.id)
      expect(ids).toContain('first_task')
      expect(ids).toContain('task_10')
    })

    it('连续3天应该解锁"三天成习"成就', () => {
      const newlyUnlocked = useAchievementStore.getState().checkAndUnlock({ currentStreak: 3 })

      expect(newlyUnlocked.length).toBe(1)
      expect(newlyUnlocked[0].id).toBe('streak_3')
    })

    it('累计1小时应该解锁"专注一小时"成就', () => {
      const newlyUnlocked = useAchievementStore.getState().checkAndUnlock({ totalTimeSpent: 60 })

      expect(newlyUnlocked.length).toBe(1)
      expect(newlyUnlocked[0].id).toBe('time_1h')
    })

    it('已解锁的成就不应该重复解锁', () => {
      useAchievementStore.getState().checkAndUnlock({ totalCompleted: 1 })
      const secondCheck = useAchievementStore.getState().checkAndUnlock({ totalCompleted: 1 })

      expect(secondCheck.length).toBe(0)
    })
  })

  describe('手动解锁', () => {
    it('应该能手动解锁成就', () => {
      useAchievementStore.getState().unlockAchievement('early_bird')

      const unlockedIds = useAchievementStore.getState().unlockedIds
      expect(unlockedIds).toContain('early_bird')
    })

    it('不应该重复解锁已解锁的成就', () => {
      useAchievementStore.getState().unlockAchievement('early_bird')
      useAchievementStore.getState().unlockAchievement('early_bird')

      const unlockedIds = useAchievementStore.getState().unlockedIds
      const count = unlockedIds.filter(id => id === 'early_bird').length
      expect(count).toBe(1)
    })
  })

  describe('统计更新', () => {
    it('应该能更新统计数据', () => {
      useAchievementStore.getState().updateStats({ totalCompleted: 5 })

      const stats = useAchievementStore.getState().stats
      expect(stats.totalCompleted).toBe(5)
    })
  })
})

// 成就检查 Hook
// 在任务完成时检查成就条件

import { useCallback } from 'react'
import { useTodoStore } from './useTodoStore'
import { useAchievementStore } from './useAchievementStore'

export function useAchievementCheck() {
  const todos = useTodoStore(s => s.todos)
  const checkAndUnlock = useAchievementStore(s => s.checkAndUnlock)
  const stats = useAchievementStore(s => s.stats)

  // 计算统计数据
  const calculateStats = useCallback(() => {
    const completedTodos = todos.filter(t => t.completed && !t.archived)
    const totalCompleted = completedTodos.length

    // 计算连续天数
    const completedDates = [...new Set(
      completedTodos
        .filter(t => t.completedAt)
        .map(t => new Date(t.completedAt!).toLocaleDateString('zh-CN'))
    )].sort().reverse()

    let currentStreak = 0
    const today = new Date().toLocaleDateString('zh-CN')

    if (completedDates.length > 0) {
      // 检查今天或昨天是否有完成
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('zh-CN')

      if (completedDates[0] === today || completedDates[0] === yesterday) {
        currentStreak = 1
        const checkDate = completedDates[0] === today
          ? new Date()
          : new Date(Date.now() - 86400000)

        for (let i = 1; i < completedDates.length; i++) {
          const prevDate = new Date(checkDate.getTime() - i * 86400000).toLocaleDateString('zh-CN')
          if (completedDates.includes(prevDate)) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }

    // 计算总时间
    const totalTimeSpent = todos.reduce((sum, t) => sum + (t.timeSpent || 0), 0)

    return {
      totalCompleted,
      currentStreak,
      longestStreak: Math.max(stats.longestStreak, currentStreak),
      totalTimeSpent,
      lastCompletedDate: completedDates[0],
    }
  }, [todos, stats.longestStreak])

  // 检查成就
  const checkAchievements = useCallback(() => {
    const newStats = calculateStats()
    return checkAndUnlock(newStats)
  }, [calculateStats, checkAndUnlock])

  // 检查特殊成就
  const checkSpecialAchievements = useCallback((todo: { completedAt?: number; subtasks: { completed: boolean }[] }) => {
    const newlyUnlocked: string[] = []

    if (todo.completedAt) {
      const hour = new Date(todo.completedAt).getHours()

      // 早起鸟儿 (6点前)
      if (hour < 6) {
        newlyUnlocked.push('early_bird')
      }

      // 夜猫子 (凌晨0-5点)
      if (hour >= 0 && hour < 5) {
        newlyUnlocked.push('night_owl')
      }
    }

    // 完美主义 (所有子任务完成)
    if (todo.subtasks.length > 0 && todo.subtasks.every(s => s.completed)) {
      newlyUnlocked.push('perfectionist')
    }

    // 解锁特殊成就
    const unlockAchievement = useAchievementStore.getState().unlockAchievement
    newlyUnlocked.forEach(id => unlockAchievement(id))

    return newlyUnlocked
  }, [])

  return {
    checkAchievements,
    checkSpecialAchievements,
    calculateStats,
  }
}

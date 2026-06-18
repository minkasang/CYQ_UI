// 成就徽章组件
// 显示单个成就的徽章

import type { Achievement } from '../../store/useAchievementStore'
import { getAchievementProgress } from '../../store/useAchievementStore'

interface AchievementBadgeProps {
  achievement: Achievement
  unlocked: boolean
  showProgress?: boolean
}

export function AchievementBadge({ achievement, unlocked, showProgress = false }: AchievementBadgeProps) {
  const progress = getAchievementProgress(achievement)

  return (
    <div
      className={`relative p-3 rounded-xl transition ${
        unlocked
          ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/30'
          : 'bg-white/5 border border-white/10 opacity-50'
      }`}
    >
      {/* 图标 */}
      <div className={`text-2xl mb-2 ${unlocked ? '' : 'grayscale'}`}>
        {achievement.icon}
      </div>

      {/* 名称 */}
      <div className={`text-sm font-medium ${unlocked ? 'text-white' : 'text-white/50'}`}>
        {achievement.name}
      </div>

      {/* 描述 */}
      <div className="text-[10px] text-white/40 mt-0.5">
        {achievement.description}
      </div>

      {/* 进度条 */}
      {showProgress && !unlocked && (
        <div className="mt-2">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500/50 transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="text-[10px] text-white/30 mt-1 text-right">
            {progress.current}/{progress.target}
          </div>
        </div>
      )}

      {/* 解锁标记 */}
      {unlocked && (
        <div className="absolute top-2 right-2">
          <span className="text-[10px] text-yellow-300">✓</span>
        </div>
      )}
    </div>
  )
}

// 成就面板组件
// 显示所有成就列表
import { useEffect } from 'react'
import { useAchievementStore, ACHIEVEMENTS } from '../../store/useAchievementStore'

interface AchievementPanelProps {
  onClose?: () => void
}

export function AchievementPanel(_props: AchievementPanelProps) {
  const unlockedIds = useAchievementStore(s => s.unlockedIds)
  const loadAchievements = useAchievementStore(s => s.loadAchievements)

  useEffect(() => {
    loadAchievements()
  }, [loadAchievements])

  // 按类别分组
  const categories = {
    tasks: ACHIEVEMENTS.filter(a => a.category === 'tasks'),
    streak: ACHIEVEMENTS.filter(a => a.category === 'streak'),
    time: ACHIEVEMENTS.filter(a => a.category === 'time'),
    special: ACHIEVEMENTS.filter(a => a.category === 'special'),
  }

  const categoryLabels: Record<string, string> = {
    tasks: '任务成就',
    streak: '连续成就',
    time: '时间成就',
    special: '特殊成就',
  }

  const unlockedCount = unlockedIds.length
  const totalCount = ACHIEVEMENTS.length

  return (
    <div className="space-y-4">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">成就</h3>
        <span className="text-sm text-white/60">
          {unlockedCount}/{totalCount} 已解锁
        </span>
      </div>

      {/* 总进度 */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all"
          style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* 分类展示 */}
      {(Object.keys(categories) as ('tasks' | 'streak' | 'time' | 'special')[]).map(cat => (
        <div key={cat}>
          <h4 className="text-xs text-white/50 mb-2">{categoryLabels[cat]}</h4>
          <div className="grid grid-cols-3 gap-2">
            {categories[cat].map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                unlocked={unlockedIds.includes(achievement.id)}
                showProgress
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// 成就通知组件
// 显示新解锁的成就
interface AchievementNotificationProps {
  achievement: Achievement
  onClose: () => void
}

export function AchievementNotification({ achievement, onClose }: AchievementNotificationProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-yellow-400/30 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="text-3xl">{achievement.icon}</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-white">成就解锁！</div>
            <div className="text-white/90 font-medium">{achievement.name}</div>
            <div className="text-xs text-white/70">{achievement.description}</div>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

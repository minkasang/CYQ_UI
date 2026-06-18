// 写作统计组件
// 展示日记写作数据统计

import { useMemo } from 'react'
import { BarChart3, FileText, TrendingUp, Calendar, Award } from 'lucide-react'
import { useDiaryStore } from '../../store/useDiaryStore'

export function DiaryStats() {
  const diaries = useDiaryStore(s => s.diaries)

  // 统计数据
  const stats = useMemo(() => {
    const total = diaries.length
    const totalWords = diaries.reduce((sum, d) => sum + (d.wordCount || 0), 0)
    const avgWords = total > 0 ? Math.round(totalWords / total) : 0

    // 计算连续记录天数
    const sortedDates = [...new Set(diaries.map(d => d.date))].sort((a, b) => b.localeCompare(a))
    let maxStreak = 0
    let currentStreak = 0

    for (let i = 0; i < sortedDates.length - 1; i++) {
      const current = new Date(sortedDates[i])
      const next = new Date(sortedDates[i + 1])
      const diffDays = Math.floor((current.getTime() - next.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentStreak++
        maxStreak = Math.max(maxStreak, currentStreak)
      } else {
        currentStreak = 0
      }
    }

    // 当前连续天数（从今天开始算）
    const today = new Date().toISOString().split('T')[0]
    let currentWritingStreak = 0
    const todayDate = new Date(today)

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(todayDate)
      expectedDate.setDate(expectedDate.getDate() - i)
      const expectedDateStr = expectedDate.toISOString().split('T')[0]

      if (sortedDates.includes(expectedDateStr)) {
        currentWritingStreak++
      } else {
        break
      }
    }

    // 本月统计
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonthDiaries = diaries.filter(d => d.date.startsWith(thisMonth))
    const thisMonthWords = thisMonthDiaries.reduce((sum, d) => sum + (d.wordCount || 0), 0)

    // 本周统计
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const thisWeekDiaries = diaries.filter(d => d.date >= weekStartStr)
    const thisWeekWords = thisWeekDiaries.reduce((sum, d) => sum + (d.wordCount || 0), 0)

    // 写作频率（过去30天）
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]
    const last30DaysDiaries = diaries.filter(d => d.date >= thirtyDaysAgoStr)
    const writingFrequency = last30DaysDiaries.length / 30 * 100

    return {
      total,
      totalWords,
      avgWords,
      maxStreak: maxStreak + 1,
      currentStreak: currentWritingStreak,
      thisMonth: {
        count: thisMonthDiaries.length,
        words: thisMonthWords,
      },
      thisWeek: {
        count: thisWeekDiaries.length,
        words: thisWeekWords,
      },
      writingFrequency: Math.round(writingFrequency),
    }
  }, [diaries])

  // 写作时间分布（按星期）
  const weekdayDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0] // 周日到周六
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']

    diaries.forEach(d => {
      const date = new Date(d.date)
      counts[date.getDay()]++
    })

    const max = Math.max(...counts, 1)

    return weekdays.map((day, i) => ({
      day,
      count: counts[i],
      percentage: Math.round((counts[i] / max) * 100),
    }))
  }, [diaries])

  if (diaries.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
        <BarChart3 size={24} className="mx-auto mb-2 text-white/30" />
        <p className="text-sm text-white/50">暂无统计数据</p>
        <p className="text-xs text-white/30 mt-1">写日记后会显示统计信息</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
        <BarChart3 size={16} /> 写作统计
      </h3>

      {/* 核心数据 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <FileText size={12} /> 总日记数
          </div>
          <div className="text-2xl font-bold text-white">{stats.total}</div>
          <div className="text-xs text-white/40">篇</div>
        </div>

        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <TrendingUp size={12} /> 总字数
          </div>
          <div className="text-2xl font-bold text-white">{stats.totalWords.toLocaleString()}</div>
          <div className="text-xs text-white/40">字</div>
        </div>

        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <Calendar size={12} /> 平均字数
          </div>
          <div className="text-2xl font-bold text-white">{stats.avgWords}</div>
          <div className="text-xs text-white/40">字/篇</div>
        </div>

        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-2 text-xs text-white/50 mb-1">
            <Award size={12} /> 连续记录
          </div>
          <div className="text-2xl font-bold text-white">{stats.currentStreak}</div>
          <div className="text-xs text-white/40">天（最长 {stats.maxStreak} 天）</div>
        </div>
      </div>

      {/* 本周/本月 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-400/20">
          <div className="text-xs text-blue-300 mb-1">本周</div>
          <div className="text-lg font-semibold text-white">{stats.thisWeek.count} 篇</div>
          <div className="text-xs text-white/50">{stats.thisWeek.words} 字</div>
        </div>

        <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-400/20">
          <div className="text-xs text-purple-300 mb-1">本月</div>
          <div className="text-lg font-semibold text-white">{stats.thisMonth.count} 篇</div>
          <div className="text-xs text-white/50">{stats.thisMonth.words} 字</div>
        </div>
      </div>

      {/* 写作频率 */}
      <div className="p-3 rounded-lg bg-white/5">
        <div className="text-xs text-white/60 mb-2">过去 30 天写作频率</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
              style={{ width: `${stats.writingFrequency}%` }}
            />
          </div>
          <span className="text-xs text-white/60">{stats.writingFrequency}%</span>
        </div>
      </div>

      {/* 写作时间分布 */}
      <div className="p-3 rounded-lg bg-white/5">
        <div className="text-xs text-white/60 mb-2">写作时间分布（按星期）</div>
        <div className="flex items-end justify-between gap-1 h-12">
          {weekdayDistribution.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${item.percentage}%`,
                  backgroundColor: item.percentage > 70 ? '#60a5fa' : item.percentage > 40 ? '#818cf8' : '#4b5563',
                  minHeight: item.count > 0 ? '4px' : '0',
                }}
                title={`${item.count} 篇`}
              />
              <span className="text-[10px] text-white/40">{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

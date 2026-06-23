// 情绪趋势图组件
// 展示近 7/30 天情绪变化趋势

import { useState, useMemo } from 'react'
import { TrendingUp, PieChart, BarChart3 } from 'lucide-react'
import { useDiaryStore } from '../../store/useDiaryStore'
import type { EmotionType } from '../../types'

// 情绪配置
const EMOTION_CONFIG: Record<EmotionType, { label: string; color: string; bgColor: string }> = {
  happy: { label: '开心', color: '#fbbf24', bgColor: 'bg-yellow-500/20' },
  calm: { label: '平静', color: '#60a5fa', bgColor: 'bg-blue-500/20' },
  anxious: { label: '焦虑', color: '#fb923c', bgColor: 'bg-orange-500/20' },
  sad: { label: '悲伤', color: '#60a5fa', bgColor: 'bg-blue-600/20' },
  angry: { label: '愤怒', color: '#f87171', bgColor: 'bg-red-500/20' },
  neutral: { label: '中性', color: '#9ca3af', bgColor: 'bg-gray-500/20' },
  excited: { label: '兴奋', color: '#f472b6', bgColor: 'bg-pink-500/20' },
}

type TimeRange = '7d' | '30d'

export function EmotionChart() {
  const diaries = useDiaryStore(s => s.diaries)
  const [timeRange, setTimeRange] = useState<TimeRange>('7d')

  // 计算时间范围
  const timeRangeDays = timeRange === '7d' ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - timeRangeDays)

  // 过滤时间范围内的日记
  const filteredDiaries = useMemo(() => {
    return diaries.filter(d => {
      const diaryDate = new Date(d.date)
      return diaryDate >= startDate && d.emotionData
    })
  }, [diaries, startDate])

  // 情绪统计
  const emotionStats = useMemo(() => {
    const stats: Record<string, { count: number; avgIntensity: number }> = {}

    filteredDiaries.forEach(d => {
      if (!d.emotionData) return
      const type = d.emotionData.type
      if (!stats[type]) {
        stats[type] = { count: 0, avgIntensity: 0 }
      }
      stats[type].count++
      stats[type].avgIntensity += d.emotionData.intensity
    })

    // 计算平均强度
    Object.keys(stats).forEach(type => {
      stats[type].avgIntensity = Math.round(stats[type].avgIntensity / stats[type].count * 10) / 10
    })

    return stats
  }, [filteredDiaries])

  // 情绪趋势数据（按日期）
  const trendData = useMemo(() => {
    const data: { date: string; emotion: EmotionType; intensity: number }[] = []

    for (let i = timeRangeDays - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const diary = filteredDiaries.find(d => d.date === dateStr)
      if (diary?.emotionData) {
        data.push({
          date: dateStr,
          emotion: diary.emotionData.type,
          intensity: diary.emotionData.intensity,
        })
      }
    }

    return data
  }, [filteredDiaries, timeRangeDays])

  // 总数
  const totalWithEmotion = filteredDiaries.filter(d => d.emotionData).length

  if (totalWithEmotion === 0) {
    return (
      <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
        <TrendingUp size={24} className="mx-auto mb-2 text-white/30" />
        <p className="text-sm text-white/50">暂无情绪数据</p>
        <p className="text-xs text-white/30 mt-1">开启情绪分析后，写日记时会自动分析情绪</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 时间范围切换 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
          <TrendingUp size={16} /> 情绪趋势
        </h3>
        <div className="flex gap-1">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-2 py-1 rounded text-xs transition ${
              timeRange === '7d'
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            7天
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-2 py-1 rounded text-xs transition ${
              timeRange === '30d'
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            30天
          </button>
        </div>
      </div>

      {/* 情绪分布 */}
      <div className="grid grid-cols-2 gap-4">
        {/* 饼图 */}
        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
            <PieChart size={12} /> 情绪分布
          </div>
          <div className="space-y-1.5">
            {Object.entries(emotionStats)
              .sort((a, b) => b[1].count - a[1].count)
              .slice(0, 5)
              .map(([type, data]) => {
                const config = EMOTION_CONFIG[type as EmotionType]
                const percentage = Math.round((data.count / totalWithEmotion) * 100)

                return (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="text-xs text-white/70 flex-1">{config.label}</span>
                    <span className="text-xs text-white/40">{percentage}%</span>
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color,
                        }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </div>

        {/* 统计 */}
        <div className="p-3 rounded-lg bg-white/5">
          <div className="flex items-center gap-1 text-xs text-white/60 mb-2">
            <BarChart3 size={12} /> 情绪统计
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/50">分析日记数</span>
              <span className="text-white/80">{totalWithEmotion} 篇</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">主要情绪</span>
              <span className="text-white/80">
                {Object.entries(emotionStats).sort((a, b) => b[1].count - a[1].count)[0]?.[0]
                  ? EMOTION_CONFIG[Object.entries(emotionStats).sort((a, b) => b[1].count - a[1].count)[0][0] as EmotionType].label
                  : '-'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/50">平均强度</span>
              <span className="text-white/80">
                {(Object.values(emotionStats).reduce((sum, s) => sum + s.avgIntensity, 0) /
                  Object.keys(emotionStats).length || 0).toFixed(1)}/5
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 趋势图（简单柱状图） */}
      {trendData.length > 0 && (
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-white/60 mb-2">近 {timeRangeDays} 天情绪变化</div>
          <div className="flex items-end gap-1 h-16">
            {trendData.map((item, index) => {
              const config = EMOTION_CONFIG[item.emotion]
              const height = (item.intensity / 5) * 100

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-0.5"
                  title={`${item.date}: ${config.label} (${item.intensity}/5)`}
                >
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${height}%`,
                      backgroundColor: config.color,
                      minHeight: '4px',
                    }}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-white/30 mt-1">
            <span>{trendData[0]?.date.slice(5)}</span>
            <span>{trendData[trendData.length - 1]?.date.slice(5)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

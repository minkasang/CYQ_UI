// 时间轴视图组件
// 按月/年分组展示日记

import { useMemo, useState } from 'react'
import { Calendar, ChevronRight, BookOpen } from 'lucide-react'
import { useDiaryStore } from '../../store/useDiaryStore'

interface TimelineViewProps {
  onSelectDiary: (id: string) => void
  selectedId?: string | null
  filterTag?: string | null
}

type GroupBy = 'month' | 'year'

export function TimelineView({ onSelectDiary, selectedId, filterTag }: TimelineViewProps) {
  const diaries = useDiaryStore(s => s.diaries)
  const [groupBy, setGroupBy] = useState<GroupBy>('month')

  // 过滤标签
  const filteredDiaries = useMemo(() => {
    if (!filterTag) return diaries
    return diaries.filter(d => d.tags?.includes(filterTag))
  }, [diaries, filterTag])

  // 按时间分组
  const groupedDiaries = useMemo(() => {
    const groups: Record<string, typeof diaries> = {}

    filteredDiaries.forEach(d => {
      const date = new Date(d.date)
      const key = groupBy === 'month'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}`

      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(d)
    })

    // 按时间降序排序
    return Object.entries(groups)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, items]) => ({
        key,
        label: formatGroupLabel(key, groupBy),
        diaries: items.sort((a, b) => b.date.localeCompare(a.date)),
      }))
  }, [filteredDiaries, groupBy])

  // 格式化分组标签
  function formatGroupLabel(key: string, groupBy: GroupBy): string {
    if (groupBy === 'month') {
      const [year, month] = key.split('-')
      return `${year}年${parseInt(month)}月`
    }
    return `${key}年`
  }

  if (filteredDiaries.length === 0) {
    return (
      <div className="text-center py-8 text-white/40 text-sm">
        {filterTag ? `没有标签为"${filterTag}"的日记` : '暂无日记'}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 分组切换 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60 flex items-center gap-1">
          <Calendar size={12} /> 时间轴
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => setGroupBy('month')}
            className={`px-2 py-0.5 rounded text-xs transition ${
              groupBy === 'month'
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            月
          </button>
          <button
            onClick={() => setGroupBy('year')}
            className={`px-2 py-0.5 rounded text-xs transition ${
              groupBy === 'year'
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            年
          </button>
        </div>
      </div>

      {/* 时间轴 */}
      <div className="space-y-4">
        {groupedDiaries.map(({ key, label, diaries: items }) => (
          <div key={key}>
            {/* 分组标题 */}
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm font-medium text-white/80">{label}</span>
              <span className="text-xs text-white/40">({items.length}篇)</span>
            </div>

            {/* 日记列表 */}
            <div className="ml-3 border-l border-white/10 pl-4 space-y-2">
              {items.map(diary => {
                const isSelected = diary.id === selectedId
                const hasEmotion = diary.emotionData

                return (
                  <button
                    key={diary.id}
                    onClick={() => onSelectDiary(diary.id)}
                    className={`w-full text-left p-2 rounded-lg transition ${
                      isSelected
                        ? 'bg-white/15 border border-white/20'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <BookOpen size={14} className="text-white/40 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white/90 truncate">{diary.title}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                          <span>{diary.date}</span>
                          <span>·</span>
                          <span>{diary.wordCount}字</span>
                          {hasEmotion && (
                            <>
                              <span>·</span>
                              <span className="text-blue-300">{diary.emotionData?.type}</span>
                            </>
                          )}
                        </div>
                        {/* 标签 */}
                        {diary.tags && diary.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {diary.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="px-1.5 py-0.5 rounded bg-white/10 text-xs text-white/50"
                              >
                                {tag}
                              </span>
                            ))}
                            {diary.tags.length > 3 && (
                              <span className="text-xs text-white/30">+{diary.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <ChevronRight size={14} className="text-white/30 flex-shrink-0" />
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 标签筛选组件
// 展示所有标签，支持按标签筛选日记

import { useMemo, useState } from 'react'
import { Tag, X, ChevronDown, ChevronUp } from 'lucide-react'
import { useDiaryStore } from '../../store/useDiaryStore'

interface TagFilterProps {
  selectedTag: string | null
  onSelectTag: (tag: string | null) => void
}

export function TagFilter({ selectedTag, onSelectTag }: TagFilterProps) {
  const diaries = useDiaryStore(s => s.diaries)
  const [expanded, setExpanded] = useState(true)

  // 统计标签使用次数
  const tagStats = useMemo(() => {
    const stats: Record<string, number> = {}

    diaries.forEach(d => {
      d.tags?.forEach(tag => {
        stats[tag] = (stats[tag] || 0) + 1
      })
    })

    // 按使用次数排序
    return Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
  }, [diaries])

  // 总标签数
  const totalTags = tagStats.length

  if (totalTags === 0) {
    return null
  }

  return (
    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
      {/* 标题 */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm text-white/80 hover:text-white transition"
      >
        <span className="flex items-center gap-2">
          <Tag size={14} /> 标签筛选
          <span className="text-xs text-white/40">({totalTags})</span>
        </span>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {/* 标签列表 */}
      {expanded && (
        <div className="mt-3 space-y-2">
          {/* 全部 */}
          <button
            onClick={() => onSelectTag(null)}
            className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition ${
              selectedTag === null
                ? 'bg-blue-500/30 text-blue-200'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            全部日记
          </button>

          {/* 标签列表 */}
          <div className="flex flex-wrap gap-1.5">
            {tagStats.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition ${
                  selectedTag === tag
                    ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
                }`}
              >
                <Tag size={10} />
                {tag}
                <span className="text-white/40">{count}</span>
              </button>
            ))}
          </div>

          {/* 清除筛选 */}
          {selectedTag && (
            <button
              onClick={() => onSelectTag(null)}
              className="flex items-center gap-1 text-xs text-white/50 hover:text-white/70 transition mt-2"
            >
              <X size={12} /> 清除筛选
            </button>
          )}
        </div>
      )}
    </div>
  )
}

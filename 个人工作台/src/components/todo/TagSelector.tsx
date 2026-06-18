// 标签选择器
// 负责任务的标签选择

import type { Tag } from '../../types'

interface TagSelectorProps {
  allTags: Tag[]
  selectedTagIds: string[]
  onToggle: (tagId: string) => void
}

export function TagSelector({ allTags, selectedTagIds, onToggle }: TagSelectorProps) {
  if (allTags.length === 0) {
    return (
      <div>
        <label className="text-xs text-white/60 mb-1 block">标签</label>
        <span className="text-xs text-white/40">暂无标签，请在设置中创建</span>
      </div>
    )
  }

  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">标签</label>
      <div className="flex flex-wrap gap-1.5">
        {allTags.map(tag => {
          const isSelected = selectedTagIds.includes(tag.id)
          return (
            <button
              key={tag.id}
              onClick={() => onToggle(tag.id)}
              className={`px-2 py-1 rounded text-xs transition ${
                isSelected
                  ? 'text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              style={isSelected ? { backgroundColor: tag.color } : {}}
            >
              {tag.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 情绪选择器组件
// 用户选择当前心情的 emoji

import { Smile, Meh, Frown, Angry, Annoyed, Heart, Sparkles } from 'lucide-react'

// 情绪选项定义
const MOOD_OPTIONS = [
  { value: '😊', label: '开心', icon: Smile },
  { value: '😌', label: '平静', icon: Meh },
  { value: '😢', label: '悲伤', icon: Frown },
  { value: '😤', label: '愤怒', icon: Angry },
  { value: '😰', label: '焦虑', icon: Annoyed },
  { value: '❤️', label: '感恩', icon: Heart },
  { value: '✨', label: '兴奋', icon: Sparkles },
]

interface MoodSelectorProps {
  value?: string
  onChange: (mood: string) => void
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {MOOD_OPTIONS.map((option) => {
        const isSelected = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-2.5 py-1.5 rounded-lg text-sm transition flex items-center gap-1 ${
              isSelected
                ? 'bg-blue-500/30 text-white border border-blue-400/50'
                : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
            }`}
            title={option.label}
          >
            <span>{option.value}</span>
            <span className="text-xs">{option.label}</span>
          </button>
        )
      })}
      {value && (
        <button
          onClick={() => onChange('')}
          className="px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/70 transition"
        >
          清除
        </button>
      )}
    </div>
  )
}

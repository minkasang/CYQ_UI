// 日记元数据组件
// 整合情绪选择、天气选择、标签输入

import { Cloud, Sun, CloudRain, CloudSnow, Wind } from 'lucide-react'
import { MoodSelector } from './MoodSelector'
import { TagInput } from './TagInput'

// 天气选项
const WEATHER_OPTIONS = [
  { value: '☀️', label: '晴天', icon: Sun },
  { value: '⛅', label: '多云', icon: Cloud },
  { value: '🌧️', label: '雨天', icon: CloudRain },
  { value: '❄️', label: '雪天', icon: CloudSnow },
  { value: '💨', label: '大风', icon: Wind },
]

// 常用标签建议
const TAG_SUGGESTIONS = [
  '工作', '学习', '生活', '旅行', '美食',
  '运动', '阅读', '电影', '音乐', '思考',
  '感恩', '成长', '挑战', '放松', '家庭',
]

interface DiaryMetaProps {
  mood?: string
  weather?: string
  tags?: string[]
  wordCount: number
  onChange: (patch: { mood?: string; weather?: string; tags?: string[] }) => void
}

export function DiaryMeta({ mood, weather, tags, wordCount, onChange }: DiaryMetaProps) {
  return (
    <div className="space-y-4 p-4 rounded-xl bg-white/5 border border-white/10">
      {/* 情绪选择 */}
      <div>
        <label className="text-xs text-white/60 mb-2 block">今天的心情</label>
        <MoodSelector
          value={mood}
          onChange={(m) => onChange({ mood: m })}
        />
      </div>

      {/* 天气选择 */}
      <div>
        <label className="text-xs text-white/60 mb-2 block">天气</label>
        <div className="flex flex-wrap gap-1.5">
          {WEATHER_OPTIONS.map((option) => {
            const isSelected = weather === option.value
            return (
              <button
                key={option.value}
                onClick={() => onChange({ weather: option.value })}
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
          {weather && (
            <button
              onClick={() => onChange({ weather: '' })}
              className="px-2 py-1.5 rounded-lg text-xs text-white/50 hover:text-white/70 transition"
            >
              清除
            </button>
          )}
        </div>
      </div>

      {/* 标签输入 */}
      <div>
        <label className="text-xs text-white/60 mb-2 block">标签</label>
        <TagInput
          value={tags}
          onChange={(t) => onChange({ tags: t })}
          suggestions={TAG_SUGGESTIONS}
        />
      </div>

      {/* 字数统计 */}
      <div className="flex items-center justify-between text-xs text-white/40 pt-2 border-t border-white/10">
        <span>字数统计</span>
        <span className="font-mono">{wordCount} 字</span>
      </div>
    </div>
  )
}

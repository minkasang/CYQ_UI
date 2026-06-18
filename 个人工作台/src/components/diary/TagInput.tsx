// 标签输入组件
// 支持创建、删除标签

import { useState } from 'react'
import { X, Plus, Tag } from 'lucide-react'

interface TagInputProps {
  value?: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]  // 建议标签列表
}

export function TagInput({ value = [], onChange, suggestions = [] }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  // 添加标签
  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInputValue('')
    setShowSuggestions(false)
  }

  // 删除标签
  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  // 过滤建议列表
  const filteredSuggestions = suggestions.filter(
    s => s.includes(inputValue) && !value.includes(s)
  )

  return (
    <div className="space-y-2">
      {/* 已选标签 */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/20 text-blue-200 text-xs"
            >
              <Tag size={10} />
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-0.5 hover:text-red-300 transition"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 输入框 */}
      <div className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value)
              setShowSuggestions(true)
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && inputValue.trim()) {
                e.preventDefault()
                addTag(inputValue)
              }
            }}
            placeholder="输入标签..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 outline-none focus:border-blue-400/50"
          />
          {inputValue.trim() && (
            <button
              onClick={() => addTag(inputValue)}
              className="px-2 py-1.5 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-white text-xs transition flex items-center gap-1"
            >
              <Plus size={12} /> 添加
            </button>
          )}
        </div>

        {/* 建议列表 */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 p-2 rounded-lg bg-black/50 border border-white/10 backdrop-blur-sm z-10">
            <div className="text-[10px] text-white/40 mb-1">建议标签</div>
            <div className="flex flex-wrap gap-1">
              {filteredSuggestions.slice(0, 6).map((s) => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-xs text-white/70 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

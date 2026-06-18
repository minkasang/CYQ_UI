// 重复任务配置组件
// 配置任务的重复规则

import { useState } from 'react'
import { Repeat } from 'lucide-react'
import type { RepeatConfig } from '../../types'

interface RepeatConfigEditorProps {
  value?: RepeatConfig
  onChange: (config: RepeatConfig | undefined) => void
}

const REPEAT_TYPES: { value: RepeatConfig['type']; label: string }[] = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'custom', label: '自定义' },
]

const WEEKDAYS = [
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
  { value: 7, label: '日' },
]

export function RepeatConfigEditor({ value, onChange }: RepeatConfigEditorProps) {
  const [showConfig, setShowConfig] = useState(!!value)

  const handleToggle = () => {
    if (showConfig) {
      onChange(undefined)
      setShowConfig(false)
    } else {
      setShowConfig(true)
      onChange({ type: 'daily', interval: 1 })
    }
  }

  const handleTypeChange = (type: RepeatConfig['type']) => {
    onChange({
      ...value,
      type,
      interval: value?.interval || 1,
      daysOfWeek: type === 'weekly' ? [1] : undefined,
    })
  }

  const handleIntervalChange = (interval: number) => {
    if (value) {
      onChange({ ...value, interval: Math.max(1, interval) })
    }
  }

  const handleEndDateChange = (endDate: string) => {
    if (value) {
      onChange({ ...value, endDate: endDate || undefined })
    }
  }

  const toggleWeekday = (day: number) => {
    if (value) {
      const days = value.daysOfWeek || []
      const newDays = days.includes(day)
        ? days.filter(d => d !== day)
        : [...days, day].sort()
      onChange({ ...value, daysOfWeek: newDays })
    }
  }

  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">重复任务</label>

      {/* 开关 */}
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition ${
          showConfig
            ? 'bg-blue-500/30 text-white'
            : 'bg-white/5 text-white/60 hover:bg-white/10'
        }`}
      >
        <Repeat size={14} />
        {showConfig ? '已启用' : '启用重复'}
      </button>

      {/* 配置面板 */}
      {showConfig && value && (
        <div className="mt-3 p-3 rounded-lg bg-white/5 space-y-3">
          {/* 重复类型 */}
          <div className="flex flex-wrap gap-1.5">
            {REPEAT_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => handleTypeChange(t.value)}
                className={`px-2 py-1 rounded text-xs transition ${
                  value.type === t.value
                    ? 'bg-blue-500/30 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 间隔 */}
          {value.type === 'custom' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">每</span>
              <input
                type="number"
                value={value.interval}
                onChange={e => handleIntervalChange(parseInt(e.target.value) || 1)}
                min={1}
                className="w-16 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-400/50"
              />
              <span className="text-xs text-white/60">天</span>
            </div>
          )}

          {/* 周几选择 */}
          {value.type === 'weekly' && (
            <div>
              <span className="text-xs text-white/40 mb-1 block">选择星期</span>
              <div className="flex gap-1">
                {WEEKDAYS.map(d => (
                  <button
                    key={d.value}
                    onClick={() => toggleWeekday(d.value)}
                    className={`w-7 h-7 rounded text-xs transition ${
                      value.daysOfWeek?.includes(d.value)
                        ? 'bg-blue-500/30 text-white'
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 结束日期 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">结束日期</span>
            <input
              type="date"
              value={value.endDate || ''}
              onChange={e => handleEndDateChange(e.target.value)}
              className="flex-1 px-2 py-1 rounded bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-blue-400/50"
            />
          </div>
        </div>
      )}
    </div>
  )
}

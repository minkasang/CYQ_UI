// 时间追踪组件
// 显示任务的计时状态，支持开始/停止计时

import { useEffect, useState } from 'react'
import { Play, Pause, Clock, Timer } from 'lucide-react'
import type { Todo, TimeEntry } from '../../types'

interface TimeTrackerProps {
  todo: Todo
  onStart: () => void
  onStop: () => void
}

// 格式化分钟数为可读时间
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

// 格式化时间戳
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TimeTracker({ todo, onStart, onStop }: TimeTrackerProps) {
  const [now, setNow] = useState(Date.now())

  // 找到正在进行的计时
  const activeEntry = todo.timeEntries.find(e => !e.endTime)
  const isTracking = !!activeEntry

  // 更新当前时间用于实时显示
  useEffect(() => {
    if (!isTracking) return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [isTracking])

  // 计算当前计时时长（分钟）
  const currentDuration = activeEntry
    ? Math.floor((now - activeEntry.startTime) / 60000)
    : 0

  // 总时间（包含当前计时）
  const totalTime = todo.timeSpent + currentDuration

  return (
    <div className="space-y-2">
      {/* 计时控制 */}
      <div className="flex items-center gap-2">
        {isTracking ? (
          <>
            <button
              onClick={onStop}
              className="flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition text-xs"
            >
              <Pause size={12} />
              停止
            </button>
            <div className="flex items-center gap-1 text-orange-300 text-xs">
              <Timer size={12} className="animate-pulse" />
              <span>{formatDuration(currentDuration)}</span>
            </div>
          </>
        ) : (
          <button
            onClick={onStart}
            disabled={todo.completed}
            className="flex items-center gap-1 px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Play size={12} />
            开始计时
          </button>
        )}

        {/* 累计时间 */}
        {totalTime > 0 && (
          <div className="flex items-center gap-1 text-white/50 text-xs ml-auto">
            <Clock size={12} />
            <span>累计 {formatDuration(totalTime)}</span>
          </div>
        )}
      </div>

      {/* 时间记录列表 */}
      {todo.timeEntries.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-white/40 hover:text-white/60 transition">
            时间记录 ({todo.timeEntries.length}条)
          </summary>
          <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
            {todo.timeEntries
              .slice()
              .reverse()
              .map(entry => (
                <TimeEntryRow key={entry.id} entry={entry} />
              ))}
          </div>
        </details>
      )}
    </div>
  )
}

function TimeEntryRow({ entry }: { entry: TimeEntry }) {
  const isActive = !entry.endTime

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded ${isActive ? 'bg-orange-500/10' : 'bg-white/5'}`}>
      <span className="text-white/40">{formatTime(entry.startTime)}</span>
      {isActive ? (
        <span className="text-orange-300">计时中...</span>
      ) : (
        <>
          <span className="text-white/30">→</span>
          <span className="text-white/40">{formatTime(entry.endTime!)}</span>
          <span className="text-white/60 ml-auto">{formatDuration(entry.duration)}</span>
        </>
      )}
    </div>
  )
}

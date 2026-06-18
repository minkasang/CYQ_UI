// 操作日志查看组件
// 在设置页面显示操作历史

import { useState, useEffect } from 'react'
import { Clock, Trash2, Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import {
  getOperationLogs,
  clearOperationLogs,
  formatLogTime,
  getOperationLabel,
  type OperationLog,
} from '../../utils/operationLogger'

export function OperationLogViewer() {
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // 加载日志
  useEffect(() => {
    setLogs(getOperationLogs().reverse()) // 最新的在前
  }, [])

  // 清空日志
  const handleClear = () => {
    if (!confirm('确定要清空所有操作日志吗？')) return
    clearOperationLogs()
    setLogs([])
  }

  // 刷新日志
  const handleRefresh = () => {
    setLogs(getOperationLogs().reverse())
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-6 text-white/40 text-xs">
        <Clock size={20} className="mx-auto mb-2 opacity-50" />
        暂无操作记录
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* 操作栏 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/60">共 {logs.length} 条记录</span>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            className="text-xs text-white/40 hover:text-white/70 transition"
          >
            刷新
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-xs text-red-300/60 hover:text-red-300 transition"
          >
            <Trash2 size={12} /> 清空
          </button>
        </div>
      </div>

      {/* 日志列表 */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-lg bg-white/5 border border-white/10 overflow-hidden"
          >
            {/* 日志头部 */}
            <div
              className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-white/5"
              onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
            >
              <div className="flex items-center gap-2">
                {log.success ? (
                  <Check size={12} className="text-green-400" />
                ) : (
                  <X size={12} className="text-red-400" />
                )}
                <span className="text-xs text-white/80">{getOperationLabel(log.type)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40">{formatLogTime(log.timestamp)}</span>
                {expandedId === log.id ? (
                  <ChevronUp size={12} className="text-white/40" />
                ) : (
                  <ChevronDown size={12} className="text-white/40" />
                )}
              </div>
            </div>

            {/* 展开详情 */}
            {expandedId === log.id && (
              <div className="px-3 py-2 border-t border-white/10 bg-white/5">
                <div className="text-[10px] text-white/50 font-mono space-y-1">
                  <div>ID: {log.id}</div>
                  {log.duration !== undefined && (
                    <div>耗时: {log.duration}ms</div>
                  )}
                  {Object.keys(log.detail).length > 0 && (
                    <div>
                      详情: {JSON.stringify(log.detail, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

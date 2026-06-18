// 存储警告组件
// 在存储空间不足时提醒用户

import { useEffect, useState } from 'react'
import { AlertTriangle, HardDrive } from 'lucide-react'
import { getStorageStatus, formatBytes, cleanupOldData } from '../../utils/storageMonitor'

export function StorageWarning() {
  const [status, setStatus] = useState<ReturnType<typeof getStorageStatus> | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 检查存储状态
    const checkStatus = () => {
      const s = getStorageStatus()
      setStatus(s)
    }

    checkStatus()
    // 每 30 秒检查一次
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  // 无警告或已关闭
  if (!status || !status.isWarning || dismissed) {
    return null
  }

  // 严重警告
  if (status.isCritical) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl bg-red-500/90 text-white text-sm shadow-xl flex items-center gap-3">
        <AlertTriangle size={18} className="animate-pulse" />
        <div>
          <div className="font-semibold">存储空间严重不足！</div>
          <div className="text-xs opacity-80">
            已使用 {formatBytes(status.used)} ({status.percentage}%)
          </div>
        </div>
        <button
          onClick={() => {
            const cleaned = cleanupOldData(7)
            if (cleaned > 0) {
              setStatus(getStorageStatus())
            }
          }}
          className="px-2 py-1 rounded bg-white/20 hover:bg-white/30 text-xs"
        >
          清理临时数据
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-white/60 hover:text-white"
        >
          ✕
        </button>
      </div>
    )
  }

  // 普通警告
  return (
    <div className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-lg bg-yellow-500/90 text-white text-xs shadow-lg flex items-center gap-2">
      <HardDrive size={14} />
      <span>存储空间不足 {status.percentage}%</span>
      <button
        onClick={() => setDismissed(true)}
        className="text-white/60 hover:text-white ml-2"
      >
        ✕
      </button>
    </div>
  )
}

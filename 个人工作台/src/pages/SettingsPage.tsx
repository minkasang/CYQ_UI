// 设置页面
import { useState } from 'react'
import { AlertTriangle, Database, Trash2, Download, Upload } from 'lucide-react'
import { APIConfig } from '../components/ai/APIConfig'
import { clearAllStorage } from '../utils/storage'
import { downloadExport, importData, readFileAsText } from '../utils/export'
import { useLiquidGlass } from '../hooks/useLiquidGlass'
import { useWallpaperStore } from '../store/useWallpaperStore'

export function SettingsPage() {
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleClearAll = () => {
    if (!confirmReset) {
      setConfirmReset(true)
      setTimeout(() => setConfirmReset(false), 5000)
      return
    }
    clearAllStorage()
    showToast('✓ 已清空所有数据')
    setTimeout(() => window.location.reload(), 1000)
  }

  const handleExport = () => {
    try {
      downloadExport()
      showToast('✓ 导出成功')
    } catch {
      showToast('✗ 导出失败')
    }
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await readFileAsText(file)
        const result = importData(text)
        if (result.success) {
          showToast(`✓ 导入成功（${result.count} 条）`)
          setTimeout(() => window.location.reload(), 1000)
        } else {
          showToast('✗ 导入失败：' + result.error)
        }
      } catch {
        showToast('✗ 读取文件失败')
      }
    }
    input.click()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold text-white mb-1">⚙️ 设置</h1>
      <p className="text-sm text-white/60 mb-4">
        配置 AI 服务、玻璃效果、数据管理
      </p>

      {/* AI 配置 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <APIConfig />
      </div>

      {/* 玻璃调参 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3">🎛 玻璃效果</h3>
        <p className="text-xs text-white/60 mb-3">
          点击顶部「玻璃调参」按钮可实时调节参数
        </p>
      </div>

      {/* 数据管理 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Database size={16} /> 数据管理
        </h3>
        <p className="text-xs text-white/60 mb-3">
          导出 JSON 文件可在另一台电脑导入，实现数据迁移
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="text-sm px-3 py-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-white transition flex items-center gap-1.5"
          >
            <Download size={14} /> 导出全部数据
          </button>
          <button
            onClick={handleImport}
            className="text-sm px-3 py-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/80 transition flex items-center gap-1.5"
          >
            <Upload size={14} /> 导入数据
          </button>
          <button
            onClick={handleClearAll}
            className={`text-sm px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${
              confirmReset
                ? 'bg-red-500/40 text-white border border-red-400/50'
                : 'bg-red-500/15 hover:bg-red-500/30 text-red-200'
            }`}
          >
            {confirmReset ? (
              <><AlertTriangle size={14} />再点一次确认清空</>
            ) : (
              <><Trash2 size={14} />清空所有数据</>
            )}
          </button>
        </div>
      </div>

      {/* 关于 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-2">关于</h3>
        <div className="text-xs text-white/60 space-y-1">
          <p>个人工作台 v0.1.0</p>
          <p>技术栈：React 18 + Vite + TypeScript + Tailwind + Zustand + WebGL Liquid Glass</p>
          <p>数据存储：浏览器本地（localStorage）</p>
          <p>开源协议：MIT</p>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm text-white shadow-xl z-50"
          style={{
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}

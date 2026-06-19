// 设置页面（合并版：模块管理 + 原完整功能）
import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { useSettingsStore } from '../../../store/useSettingsStore'
import { useAPIKeysStore } from '../../../store/useAPIKeysStore'
import { useEffect, useState } from 'react'
import { ALL_MODULE_IDS, MODULE_NAMES, notifyModuleToggleChanged } from '../../../hooks/useModuleRoutes'
import { APIKeyModal } from '../../../components/chat/APIKeyModal'
import { DiarySettingsPanel } from '../../../components/diary/DiarySettingsPanel'
import { BackupManager } from '../../../components/diary/BackupManager'
import { OperationLogViewer } from '../../../components/common/OperationLogViewer'
import { LayoutManager } from '../../../components/layout/LayoutManager'
import { GlassControlPanel } from '../../../components/glass/GlassControlPanel'
import { clearAllStorage } from '../../../utils/storage'
import { downloadExport, importData, readFileAsText } from '../../../utils/export'
import { AlertTriangle, Database, Trash2, Download, Upload, Key, Clock } from 'lucide-react'

const PREFIX = 'module_toggle_'

function readToggle(id: string): boolean {
  return localStorage.getItem(PREFIX + id) !== 'off'
}

function writeToggle(id: string, on: boolean) {
  localStorage.setItem(PREFIX + id, on ? 'on' : 'off')
  notifyModuleToggleChanged()
}

export function SettingsPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadFromFile = useSettingsStore(s => s.loadFromFile)
  const settings = useSettingsStore(s => s.settings)
  const setTheme = useSettingsStore(s => s.setTheme)
  const setLanguage = useSettingsStore(s => s.setLanguage)
  const resetAll = useSettingsStore(s => s.resetAll)
  const loadKeys = useAPIKeysStore(s => s.loadFromFile)

  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [confirmReset, setConfirmReset] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [apiModalOpen, setApiModalOpen] = useState(false)

  useEffect(() => { loadFromFile() }, [loadFromFile])
  useEffect(() => { loadKeys() }, [loadKeys])

  useEffect(() => {
    const t: Record<string, boolean> = {}
    ALL_MODULE_IDS.forEach(id => { t[id] = readToggle(id) })
    setToggles(t)
  }, [])

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

  const handleExport = async () => {
    try {
      await downloadExport()
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
        const result = await importData(text)
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

      {/* 模块管理 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3">🧩 模块管理</h3>
        <p className="text-xs text-white/60 mb-3">开启或关闭功能模块，路由会实时生效</p>
        <div className="space-y-2">
          {ALL_MODULE_IDS.map(id => (
            <div key={id} className="flex items-center justify-between py-1.5 px-2 rounded bg-white/5">
              <span className="text-white/80 text-sm">{MODULE_NAMES[id] || id}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={toggles[id] ?? true}
                  disabled={id === 'settings'}
                  onChange={() => {
                    const next = !toggles[id]
                    writeToggle(id, next)
                    setToggles(prev => ({ ...prev, [id]: next }))
                  }}
                />
                <div className={`w-9 h-5 rounded-full peer transition-colors
                  ${toggles[id] ? 'bg-blue-500' : 'bg-white/20'}
                  ${id === 'settings' ? 'opacity-50 cursor-not-allowed' : ''}
                  after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                  after:bg-white after:rounded-full after:h-4 after:w-4
                  after:transition-transform ${toggles[id] ? 'after:translate-x-4' : ''}
                `} />
              </label>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 mt-4 pt-4">
          <h3 className="text-sm font-medium text-white/80 mb-2">主题</h3>
          <select value={settings.theme || 'dark'} onChange={(e) => setTheme(e.target.value as any)}
            className="w-full px-3 py-2 rounded bg-white/10 text-white">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>
        <div className="mt-3">
          <h3 className="text-sm font-medium text-white/80 mb-2">语言</h3>
          <select value={settings.language || 'zh-CN'} onChange={(e) => setLanguage(e.target.value as any)}
            className="w-full px-3 py-2 rounded bg-white/10 text-white">
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>
        <div className="mt-3">
          <button onClick={() => resetAll()} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">
            重置所有设置
          </button>
        </div>
      </div>

      {/* 布局切换 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <LayoutManager />
      </div>

      {/* AI 配置 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Key size={16} /> API Key 管理
        </h3>
        <p className="text-xs text-white/60 mb-3">
          配置各 AI 提供商的 API Key，所有 AI 功能共用
        </p>
        <button
          onClick={() => setApiModalOpen(true)}
          className="text-sm px-4 py-2 rounded-lg bg-blue-500/30 hover:bg-blue-500/50 text-white transition"
        >
          管理 API Key
        </button>
      </div>

      {/* 日记设置 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <DiarySettingsPanel />
      </div>

      {/* 日记备份 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Database size={16} /> 日记备份
        </h3>
        <p className="text-xs text-white/60 mb-3">
          定期备份日记数据，防止数据丢失。最多保留 7 个备份。
        </p>
        <BackupManager />
      </div>

      {/* 玻璃调参 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3">🎛 玻璃效果</h3>
        <GlassControlPanel />
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

      {/* 操作日志 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-5">
        <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
          <Clock size={16} /> 操作日志
        </h3>
        <p className="text-xs text-white/60 mb-3">
          记录关键操作，便于问题排查
        </p>
        <OperationLogViewer />
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

      {/* APIKeyModal */}
      <APIKeyModal open={apiModalOpen} onClose={() => setApiModalOpen(false)} />
    </div>
  )
}

// 设置页面（侧边栏+内容布局）
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
import { TextColorPanel } from '../../../components/glass/TextColorPanel'
import { downloadExport, importData, readFileAsText } from '../../../utils/export'
import { Database, Download, Upload, Key } from 'lucide-react'

const PREFIX = 'module_toggle_'
function readToggle(id: string) { return localStorage.getItem(PREFIX + id) !== 'off' }
function writeToggle(id: string, on: boolean) {
  localStorage.setItem(PREFIX + id, on ? 'on' : 'off')
  notifyModuleToggleChanged()
}

// 侧边栏导航分类
const SECTIONS = [
  { id: 'display', label: '显示', icon: '🎨' },
  { id: 'modules', label: '模块', icon: '🧩' },
  { id: 'layout', label: '布局', icon: '🖥' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'diary', label: '日记', icon: '📝' },
  { id: 'data', label: '数据', icon: '📦' },
  { id: 'about', label: '关于', icon: 'ℹ️' },
]

export function SettingsPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadFromFile = useSettingsStore(s => s.loadFromFile)
  const setTheme = useSettingsStore(s => s.setTheme)
  const setLanguage = useSettingsStore(s => s.setLanguage)
  const resetAll = useSettingsStore(s => s.resetAll)
  const loadKeys = useAPIKeysStore(s => s.loadFromFile)
  const settings = useSettingsStore(s => s.settings)

  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [toast, setToast] = useState<string | null>(null)
  const [apiModalOpen, setApiModalOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('display')

  useEffect(() => { loadFromFile() }, [loadFromFile])
  useEffect(() => { loadKeys() }, [loadKeys])
  useEffect(() => {
    const t: Record<string, boolean> = {}
    ALL_MODULE_IDS.forEach(id => { t[id] = readToggle(id) })
    setToggles(t)
  }, [])

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000) }

  const handleExport = async () => {
    try { await downloadExport(); showToast('✓ 导出成功') }
    catch { showToast('✗ 导出失败') }
  }
  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      try {
        const text = await readFileAsText(file)
        const result = await importData(text)
        showToast(result.success ? `✓ 导入成功（${result.count} 条）` : '✗ 导入失败：' + result.error)
      } catch { showToast('✗ 读取文件失败') }
    }
    input.click()
  }

  return (
    <div className="h-full flex gap-0">
      {/* 左侧边栏 */}
      <aside className="w-[180px] flex-shrink-0 py-6 px-3 overflow-auto"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <nav className="space-y-0.5">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left transition-colors"
              style={{
                background: activeSection === s.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: activeSection === s.id ? '#fff' : 'rgba(255,255,255,0.5)',
                fontWeight: activeSection === s.id ? 500 : 400,
              }}
            >
              <span>{s.icon}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 右侧内容 */}
      <main className="flex-1 overflow-auto py-6 px-8">
        <div className="max-w-2xl space-y-5">
          {activeSection === 'display' && (
            <>
              <h2 className="text-[22px] font-normal text-white">🎨 显示</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-white/80 mb-4">文字颜色</h3>
                <TextColorPanel inline />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-white/80 mb-4">文字大小</h3>
                <FontSizeSlider />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-white/80 mb-4">玻璃效果</h3>
                <GlassControlPanel inline />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-white/80 mb-3">主题</h3>
                <select value={settings.theme || 'dark'} onChange={e => setTheme(e.target.value as any)}
                  className="w-full px-3 py-2 rounded bg-white/10 text-white text-sm">
                  <option value="light">浅色</option><option value="dark">深色</option><option value="auto">跟随系统</option>
                </select>
              </div>
            </>
          )}

          {activeSection === 'modules' && (
            <>
              <h2 className="text-[22px] font-normal text-white">🧩 模块管理</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 space-y-2">
                {ALL_MODULE_IDS.map(id => (
                  <div key={id} className="flex items-center justify-between py-1.5">
                    <span className="text-white/80 text-sm">{MODULE_NAMES[id] || id}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={toggles[id] ?? true}
                        disabled={id === 'settings'}
                        onChange={() => { writeToggle(id, !toggles[id]); setToggles(prev => ({ ...prev, [id]: !prev[id] })) }} />
                      <div className={`w-9 h-5 rounded-full peer transition-colors ${toggles[id] ? 'bg-blue-500' : 'bg-white/20'} ${id === 'settings' ? 'opacity-50 cursor-not-allowed' : ''} after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform ${toggles[id] ? 'after:translate-x-4' : ''}`} />
                    </label>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-3 mt-3">
                  <select value={settings.language || 'zh-CN'} onChange={e => setLanguage(e.target.value as any)}
                    className="w-full px-3 py-2 rounded bg-white/10 text-white text-sm">
                    <option value="zh-CN">简体中文</option><option value="en-US">English</option>
                  </select>
                  <button onClick={() => resetAll()} className="mt-3 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm">重置所有设置</button>
                </div>
              </div>
            </>
          )}

          {activeSection === 'layout' && (
            <>
              <h2 className="text-[22px] font-normal text-white">🖥 页面布局</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <LayoutManager />
              </div>
            </>
          )}

          {activeSection === 'ai' && (
            <>
              <h2 className="text-[22px] font-normal text-white">🤖 AI 配置</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2"><Key size={14} /> API Key 管理</h3>
                <button onClick={() => setApiModalOpen(true)}
                  className="text-sm px-3 py-1.5 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white transition">
                  管理 API Key
                </button>
              </div>
            </>
          )}

          {activeSection === 'diary' && (
            <>
              <h2 className="text-[22px] font-normal text-white">📝 日记</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <DiarySettingsPanel />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2"><Database size={14} /> 日记备份</h3>
                <BackupManager />
              </div>
            </>
          )}

          {activeSection === 'data' && (
            <>
              <h2 className="text-[22px] font-normal text-white">📦 数据管理</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleExport} className="text-sm px-3 py-2 rounded bg-blue-500/30 hover:bg-blue-500/50 text-white transition flex items-center gap-1.5"><Download size={14} />导出全部</button>
                  <button onClick={handleImport} className="text-sm px-3 py-2 rounded bg-white/8 hover:bg-white/15 text-white/80 transition flex items-center gap-1.5"><Upload size={14} />导入数据</button>
                </div>
                <OperationLogViewer />
              </div>
            </>
          )}

          {activeSection === 'about' && (
            <>
              <h2 className="text-[22px] font-normal text-white">ℹ️ 关于</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <p className="text-sm text-white/80">个人工作台 v0.1</p>
                <p className="text-xs text-white/40 mt-1">React + Vite + TypeScript + Tailwind + Zustand + WebGL Liquid Glass</p>
              </div>
            </>
          )}
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm text-white shadow-xl z-50"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}>
          {toast}
        </div>
      )}
      <APIKeyModal open={apiModalOpen} onClose={() => setApiModalOpen(false)} />
    </div>
  )
}

// 初始化字号
export function initFontSize() {
  const saved = localStorage.getItem('pw-font-size')
  if (saved) document.documentElement.style.fontSize = `${saved}px`
}

function FontSizeSlider() {
  const [size, setSize] = useState(() => {
    const s = parseFloat(localStorage.getItem('pw-font-size') || '13')
    return isNaN(s) ? 13 : s
  })
  const apply = (v: number) => {
    setSize(v)
    localStorage.setItem('pw-font-size', String(v))
    document.documentElement.style.fontSize = `${v}px`
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-white/70">基础字号</span>
        <div className="flex items-center gap-2">
          <button onClick={() => apply(Math.max(10, size - 1))}
            className="text-[11px] px-2 py-px rounded bg-white/8 text-white/60 hover:bg-white/15 transition-colors">−</button>
          <input type="number" min={10} max={20} value={size}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) apply(Math.min(20, Math.max(10, v))) }}
            className="w-[40px] text-center text-[11px] text-white/70 font-mono bg-white/5 border border-white/10 rounded px-1 py-0.5 outline-none" />
          <button onClick={() => apply(Math.min(20, size + 1))}
            className="text-[11px] px-2 py-px rounded bg-white/8 text-white/60 hover:bg-white/15 transition-colors">+</button>
          <span className="text-[10px] text-white/30">px</span>
        </div>
      </div>
      <input type="range" min={10} max={20} step={1} value={size}
        onChange={e => apply(Number(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
          [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:cursor-pointer" />
      <p className="text-[10px] text-white/30 mt-1">macOS 默认 13px · 范围 10-20px</p>
    </div>
  )
}

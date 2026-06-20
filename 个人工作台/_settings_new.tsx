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
import { Palette, SquaresFour, Layout, Brain, Notebook, Database, DownloadSimple, UploadSimple, Key, Info, Question, CaretDown } from '@phosphor-icons/react'
import { Toggle } from '../../../components/ui/Toggle'
import { Select } from '../../../components/ui/Select'
import { showToast, ToastContainer } from '../../../components/ui/Toast'
import { FontSizeSlider } from '../../../components/settings/FontSizeSlider'
import { FontUploadModal } from '../../../components/settings/FontUploadModal'
import { applyFontFamily, EN_FONT_OPTIONS, ZH_FONT_OPTIONS } from '../../../utils/fontFamily'

const PREFIX = 'module_toggle_'
function readToggle(id: string) { return localStorage.getItem(PREFIX + id) !== 'off' }
function writeToggle(id: string, on: boolean) {
  localStorage.setItem(PREFIX + id, on ? 'on' : 'off')
  notifyModuleToggleChanged()
}

// 侧边栏导航分类
const SECTIONS = [
  { id: 'display', label: '显示', Icon: Palette },
  { id: 'modules', label: '模块', Icon: SquaresFour },
  { id: 'layout', label: '布局', Icon: Layout },
  { id: 'ai', label: 'AI', Icon: Brain },
  { id: 'diary', label: '日记', Icon: Notebook },
  { id: 'data', label: '数据', Icon: Database },
  { id: 'about', label: '关于', Icon: Info },
  { id: 'help', label: '帮助', Icon: Question },
]

export function SettingsPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadFromFile = useSettingsStore(s => s.loadFromFile)
  const setTheme = useSettingsStore(s => s.setTheme)
  const setLanguage = useSettingsStore(s => s.setLanguage)
  const resetAll = useSettingsStore(s => s.resetAll)
  const saveToFile = useSettingsStore(s => s.saveToFile)
  const loadKeys = useAPIKeysStore(s => s.loadFromFile)
  const settings = useSettingsStore(s => s.settings)

  const [toggles, setToggles] = useState<Record<string, boolean>>({})
  const [apiModalOpen, setApiModalOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('display')
  const [fontEn, setFontEn] = useState(() => localStorage.getItem('pw-font-en') || 'geist')
  const [fontZh, setFontZh] = useState(() => localStorage.getItem('pw-font-zh') || 'pingfang')
  const [fontUploadOpen, setFontUploadOpen] = useState(false)
  const [userFonts, setUserFonts] = useState<{ name: string; path: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('pw-user-fonts') || '[]') } catch { return [] }
  })

  useEffect(() => { loadFromFile() }, [loadFromFile])
  useEffect(() => { loadKeys() }, [loadKeys])
  useEffect(() => {
    const t: Record<string, boolean> = {}
    ALL_MODULE_IDS.forEach(id => { t[id] = readToggle(id) })
    setToggles(t)
  }, [])

  // 初始化字体
  useEffect(() => { applyFontFamily(fontEn, fontZh) }, [fontEn, fontZh])

  const handleExport = async () => {
    try { await downloadExport(); showToast({ message: '导出成功', type: 'success' }) }
    catch { showToast({ message: '导出失败', type: 'error' }) }
  }
  const handleImport = () => {
    const input = document.createElement('input'); input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return
      try {
        const text = await readFileAsText(file)
        const result = await importData(text)
        showToast(result.success
          ? { message: `导入成功（${result.count} 条）`, type: 'success' }
          : { message: '导入失败：' + result.error, type: 'error' })
      } catch { showToast({ message: '读取文件失败', type: 'error' }) }
    }
    input.click()
  }

  return (
    <div className="h-full flex flex-col md:flex-row gap-0 overflow-hidden">
      {/* 侧边栏 — 桌面竖排固定 / 移动端横排 */}
      <aside className="md:w-52 flex-shrink-0 md:py-6 md:px-3 md:border-r border-[var(--border-subtle)] md:h-full overflow-x-auto md:overflow-y-auto">
        <nav className="flex md:flex-col gap-0.5 px-2 md:px-0 py-2 md:py-0 overflow-x-auto md:overflow-x-visible">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 md:gap-2.5 px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-sm text-left transition-all duration-200 ${
                activeSection === s.id
                  ? 'bg-white/10 text-[var(--text-primary)] font-medium'
                  : 'text-[var(--text-tertiary)] hover:bg-white/[0.04] hover:text-[var(--text-secondary)]'
              }`}
            >
              <s.Icon size={16} weight={activeSection === s.id ? 'fill' : 'regular'} className="md:size-[18px]" />
              <span className="hidden md:inline">{s.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* 右侧内容 — 多列卡片网格 */}
      <main className="flex-1 overflow-auto py-6 md:py-12 px-4 md:px-12">
        <div key={activeSection} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-fade-slide-up">
          {activeSection === 'display' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">显示</h2>
              {/* 玻璃效果 — 大卡片 + 3 小卡片 Bento */}
              <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="lg:col-span-2 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">玻璃效果</h3>
                <GlassControlPanel inline />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">文字颜色</h3>
                <TextColorPanel inline />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">文字大小</h3>
                <FontSizeSlider />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">主题</h3>
                <Select
                  value={(settings.theme || 'dark') as 'light' | 'dark' | 'auto'}
                  onChange={(v) => setTheme(v)}
                  options={[
                    { value: 'light' as const, label: '浅色' },
                    { value: 'dark' as const, label: '深色' },
                    { value: 'auto' as const, label: '跟随系统' },
                  ]}
                />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">字体</h3>
                  <button
                    onClick={() => setFontUploadOpen(true)}
                    className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition"
                  >
                    + 添加字体
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-1.5 tracking-wide">英文 / 数字</p>
                    <Select
                      value={fontEn}
                      onChange={(v) => { setFontEn(v); localStorage.setItem('pw-font-en', v) }}
                      options={[
                        ...EN_FONT_OPTIONS.map(o => ({ value: o.value, label: o.label })),
                        ...userFonts.map(f => ({ value: f.name, label: `${f.name} ★` })),
                      ]}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-1.5 tracking-wide">中文</p>
                    <Select
                      value={fontZh}
                      onChange={(v) => { setFontZh(v); localStorage.setItem('pw-font-zh', v) }}
                      options={[
                        ...ZH_FONT_OPTIONS.map(o => ({ value: o.value, label: o.label })),
                        ...userFonts.map(f => ({ value: f.name, label: `${f.name} ★` })),
                      ]}
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'modules' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">模块管理</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 space-y-0">
                {ALL_MODULE_IDS.map((id, i) => (
                  <div key={id} className={`flex items-center justify-between ${i > 0 ? 'border-t border-[var(--border-subtle)]' : ''} py-3`}>
                    <span className="text-[var(--text-secondary)] text-sm">{MODULE_NAMES[id] || id}</span>
                    <Toggle
                      checked={toggles[id] ?? true}
                      disabled={id === 'settings'}
                      onChange={(v) => { writeToggle(id, v); setToggles(prev => ({ ...prev, [id]: v })) }}
                    />
                  </div>
                ))}
                <div className="border-t border-[var(--border-hairline)] pt-4 mt-2 space-y-3">
                  <Select
                    value={(settings.language || 'zh-CN') as 'zh-CN' | 'en-US'}
                    onChange={(v) => setLanguage(v)}
                    options={[
                      { value: 'zh-CN' as const, label: '简体中文' },
                      { value: 'en-US' as const, label: 'English' },
                    ]}
                  />
                  <button onClick={() => resetAll()} className="px-3 py-1.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">重置所有设置</button>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'layout' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">页面布局</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <LayoutManager />
              </div>
            </section>
          )}

          {activeSection === 'ai' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">AI 配置</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">模型提供商</h3>
                <Select
                  value={(settings.ai?.provider || 'deepseek') as string}
                  onChange={(v) => {
                    useSettingsStore.setState(s => ({ settings: { ...s.settings, ai: { ...s.settings.ai, provider: v as any } } }))
                    saveToFile()
                  }}
                  options={[
                    { value: 'deepseek' as const, label: 'DeepSeek' },
                    { value: 'zhipu' as const, label: '智谱 GLM' },
                    { value: 'openai' as const, label: 'OpenAI' },
                    { value: 'claude' as const, label: 'Claude' },
                    { value: 'kimi' as const, label: 'Kimi' },
                    { value: 'agnes' as const, label: 'Agnes AI' },
                    { value: 'custom' as const, label: '自定义' },
                  ]}
                />
                <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-tertiary)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  已连接
                </div>
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2"><Key size={14} weight="fill" /> API Key 管理</h3>
                <button onClick={() => setApiModalOpen(true)}
                  className="text-sm px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition active:scale-[0.98]">
                  管理 API Key
                </button>
              </div>
            </section>
          )}

          {activeSection === 'diary' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">日记</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 lg:col-span-1">
                <DiarySettingsPanel />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 lg:col-span-1">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2"><Database size={14} weight="fill" /> 日记备份</h3>
                <BackupManager />
              </div>
            </section>
          )}

          {activeSection === 'data' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">数据管理</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">导入 / 导出</h3>
                <div className="flex flex-wrap gap-2">
                  <button onClick={handleExport} className="text-sm px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition active:scale-[0.98] flex items-center gap-1.5"><DownloadSimple size={14} />导出全部</button>
                  <button onClick={handleImport} className="text-sm px-4 py-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.10] text-[var(--text-secondary)] transition active:scale-[0.98] flex items-center gap-1.5"><UploadSimple size={14} />导入数据</button>
                </div>
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">操作日志</h3>
                <OperationLogViewer />
              </div>
            </section>
          )}

          {activeSection === 'about' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">关于</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="lg:col-span-2 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/15 flex items-center justify-center">
                  <Info size={28} weight="fill" className="text-[var(--accent)]" />
                </div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">个人工作台</p>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent)]/15 text-[var(--accent)]">v0.1</span>
                <p className="text-xs text-[var(--text-tertiary)] mt-4 max-w-xs mx-auto">React + Vite + TypeScript + Tailwind + Zustand + WebGL Liquid Glass</p>
              </div>
            </section>
          )}

          {activeSection === 'help' && (
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">帮助</h2>

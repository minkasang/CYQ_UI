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
  const saveToFile = useSettingsStore(s => s.saveToFile)
  const setTheme = useSettingsStore(s => s.setTheme)
  const setLanguage = useSettingsStore(s => s.setLanguage)
  const resetAll = useSettingsStore(s => s.resetAll)
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
    <div className="flex flex-col md:flex-row min-h-full">
        {/* 侧边栏 — sticky 固定 */}
        <aside className="md:sticky md:top-0 md:w-52 flex-shrink-0 md:py-6 md:px-3 md:border-r border-[var(--border-subtle)] md:self-start">
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
      <main className="flex-1 py-6 md:py-12 px-4 md:px-12">
        <div key={activeSection} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 animate-fade-slide-up">

          {/* 显示 */}
          {activeSection === 'display' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">显示</h2>
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
                <Select value={(settings.theme || 'dark') as 'light'|'dark'|'auto'} onChange={(v) => setTheme(v)} options={[{ value: 'light' as const, label: '浅色' }, { value: 'dark' as const, label: '深色' }, { value: 'auto' as const, label: '跟随系统' }]} />
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)]">字体</h3>
                  <button onClick={() => setFontUploadOpen(true)} className="text-xs px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition">+ 添加字体</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-1.5 tracking-wide">英文 / 数字</p>
                    <Select value={fontEn} onChange={(v) => { setFontEn(v); localStorage.setItem('pw-font-en', v) }} options={[...EN_FONT_OPTIONS.map(o => ({ value: o.value, label: o.label })), ...userFonts.map(f => ({ value: f.name, label: `${f.name} ★` }))]} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[var(--text-tertiary)] mb-1.5 tracking-wide">中文</p>
                    <Select value={fontZh} onChange={(v) => { setFontZh(v); localStorage.setItem('pw-font-zh', v) }} options={[...ZH_FONT_OPTIONS.map(o => ({ value: o.value, label: o.label })), ...userFonts.map(f => ({ value: f.name, label: `${f.name} ★` }))]} />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* 模块 */}
          {activeSection === 'modules' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">模块管理</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 space-y-0">
                {ALL_MODULE_IDS.map((id, i) => (
                  <div key={id} className={`flex items-center justify-between ${i > 0 ? 'border-t border-[var(--border-subtle)]' : ''} py-3`}>
                    <span className="text-[var(--text-secondary)] text-sm">{MODULE_NAMES[id] || id}</span>
                    <Toggle checked={toggles[id] ?? true} disabled={id === 'settings'} onChange={(v) => { writeToggle(id, v); setToggles(prev => ({ ...prev, [id]: v })) }} />
                  </div>
                ))}
                <div className="border-t border-[var(--border-hairline)] pt-4 mt-2 space-y-3">
                  <Select value={(settings.language || 'zh-CN') as 'zh-CN'|'en-US'} onChange={(v) => setLanguage(v)} options={[{ value: 'zh-CN' as const, label: '简体中文' }, { value: 'en-US' as const, label: 'English' }]} />
                  <button onClick={() => resetAll()} className="px-3 py-1.5 text-sm text-red-400/80 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors">重置所有设置</button>
                </div>
              </div>
            </section>
          )}

          {/* 布局 */}
          {activeSection === 'layout' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">页面布局</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <LayoutManager />
              </div>
            </section>
          )}

          {/* AI */}
          {activeSection === 'ai' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">AI 配置</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">模型提供商</h3>
                <Select value={(settings.ai?.provider || 'deepseek') as string} onChange={(v) => { useSettingsStore.setState(s => ({ settings: { ...s.settings, ai: { ...s.settings.ai, provider: v as any } } })); saveToFile() }} options={[{ value: 'deepseek' as const, label: 'DeepSeek' }, { value: 'zhipu' as const, label: '智谱 GLM' }, { value: 'openai' as const, label: 'OpenAI' }, { value: 'claude' as const, label: 'Claude' }, { value: 'kimi' as const, label: 'Kimi' }, { value: 'agnes' as const, label: 'Agnes AI' }, { value: 'custom' as const, label: '自定义' }]} />
                <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-tertiary)]"><span className="w-1.5 h-1.5 rounded-full bg-green-400" />已连接</div>
              </div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2"><Key size={14} weight="fill" /> API Key 管理</h3>
                <button onClick={() => setApiModalOpen(true)} className="text-sm px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition active:scale-[0.98]">管理 API Key</button>
              </div>
            </section>
          )}

          {/* 日记 */}
          {activeSection === 'diary' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">日记</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 lg:col-span-1"><DiarySettingsPanel /></div>
              <div ref={(el) => registerPanel(el, { cornerRadius: 12 })} className="rounded-xl p-5 lg:col-span-1">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2"><Database size={14} weight="fill" /> 日记备份</h3>
                <BackupManager />
              </div>
            </section>
          )}

          {/* 数据 */}
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

          {/* 关于 */}
          {activeSection === 'about' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">关于</h2>
              <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="lg:col-span-2 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[var(--accent)]/15 flex items-center justify-center"><Info size={28} weight="fill" className="text-[var(--accent)]" /></div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">个人工作台</p>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent)]/15 text-[var(--accent)]">v0.1</span>
                <p className="text-xs text-[var(--text-tertiary)] mt-4 max-w-xs mx-auto">React + Vite + TypeScript + Tailwind + Zustand + WebGL Liquid Glass</p>
              </div>
            </section>
          )}

          {/* 帮助 */}
          {activeSection === 'help' && (
            <section className="contents">
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] lg:col-span-2">帮助</h2>
              <HelpCard title="🚀 快速上手 — 3 分钟了解这个软件" defaultOpen>
                <div className="space-y-3 text-sm leading-relaxed">
                  <p className="text-[var(--text-secondary)]">个人工作台是一个集日记、待办、AI 对话、灵感收集于一体的桌面工具。下面是最快上手的 3 步：</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-xs text-[var(--accent)] font-medium mb-1">第 1 步</p><p className="text-[var(--text-secondary)] text-xs">在「模块管理」里打开你想用的功能模块，关闭不需要的，保持界面清爽</p></div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-xs text-[var(--accent)] font-medium mb-1">第 2 步</p><p className="text-[var(--text-secondary)] text-xs">在「AI 配置」里选一个 AI 提供商并填入 API Key，解锁 AI 对话和写作辅助</p></div>
                    <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-xs text-[var(--accent)] font-medium mb-1">第 3 步</p><p className="text-[var(--text-secondary)] text-xs">在「页面布局」里选一个喜欢的布局风格，macOS 风、仪表盘或顶部导航</p></div>
                  </div>
                  <p className="text-[var(--text-tertiary)] text-xs">💡 所有数据都保存在你电脑的 <code className="text-[11px] bg-white/[0.06] px-1 py-0.5 rounded">个人工作台/data/</code> 目录下，不会上传到任何服务器。</p>
                </div>
              </HelpCard>
              <HelpCard title="🤖 使用 AI 对话 — 从零到能聊天">
                <SubSection title="什么是 API Key？"><p className="text-[var(--text-secondary)]">API Key 是你向 AI 公司购买服务的「钥匙」。就像手机号需要 SIM 卡才能打电话——你需要一个 API Key 才能让软件帮你问 AI 问题。</p></SubSection>
                <SubSection title="要花钱吗？花多少？">
                  <p className="text-[var(--text-secondary)] mb-3">要，但很便宜。AI 按字数收费，聊一句通常只要几分钱。充 10 块钱可能用一两个月。下面是各平台的大致价格：</p>
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-[var(--text-secondary)] text-xs">
                      <thead><tr className="border-b border-[var(--border-subtle)]"><th className="text-left py-1.5 pr-2 font-medium">提供商</th><th className="text-left py-1.5 pr-2 font-medium">价格（参考）</th><th className="text-left py-1.5 pr-2 font-medium">注册难度</th><th className="text-left py-1.5 font-medium">一句话总结</th></tr></thead>
                      <tbody>
                        <tr className="border-b border-[var(--border-subtle)]/50"><td className="py-1.5 pr-2 font-medium text-green-400">Agnes AI</td><td className="py-1.5 pr-2">目前免费</td><td className="py-1.5 pr-2">简单</td><td className="py-1.5">新加坡公司，文本+图像+视频，OpenAI 兼容</td></tr>
                        <tr className="border-b border-[var(--border-subtle)]/50"><td className="py-1.5 pr-2 font-medium text-green-400">智谱 GLM</td><td className="py-1.5 pr-2">部分免费 / 收费 ¥1起</td><td className="py-1.5 pr-2">简单</td><td className="py-1.5">国内公司，手机号注册，中文理解好</td></tr>
                        <tr className="border-b border-[var(--border-subtle)]/50"><td className="py-1.5 pr-2 font-medium">DeepSeek</td><td className="py-1.5 pr-2">极便宜（¥1/百万字）</td><td className="py-1.5 pr-2">简单</td><td className="py-1.5">国产之光，中文极好，新用户送额度</td></tr>
                        <tr className="border-b border-[var(--border-subtle)]/50"><td className="py-1.5 pr-2 font-medium">Kimi</td><td className="py-1.5 pr-2">按量计费</td><td className="py-1.5 pr-2">简单</td><td className="py-1.5">长文本处理强，新用户有体验额度</td></tr>
                        <tr className="border-b border-[var(--border-subtle)]/50"><td className="py-1.5 pr-2 font-medium">OpenAI</td><td className="py-1.5 pr-2">较贵（≈¥1-3/次）</td><td className="py-1.5 pr-2">困难</td><td className="py-1.5">全球最强，但需国外手机号+外币信用卡</td></tr>
                        <tr><td className="py-1.5 pr-2 font-medium">Claude</td><td className="py-1.5 pr-2">最贵（≈¥5-15/次）</td><td className="py-1.5 pr-2">困难</td><td className="py-1.5">代码和写作极强，需国外网络环境</td></tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[var(--text-tertiary)] text-xs">💡 新手推荐顺序：Agnes AI（免费）→ 智谱（国内方便）→ DeepSeek（性价比高）。</p>
                </SubSection>
                <SubSection title="怎么获取和配置？">
                  <ol className="list-decimal pl-4 text-[var(--text-secondary)] space-y-2">
                    <li><strong>注册</strong>：去下面任一网站注册账号<ul className="mt-1 space-y-0.5 text-[var(--text-tertiary)] text-xs"><li>· Agnes AI — <a href="https://agnes-ai.com" target="_blank" className="text-[var(--accent)] underline">agnes-ai.com</a></li><li>· 智谱 — <a href="https://open.bigmodel.cn" target="_blank" className="text-[var(--accent)] underline">open.bigmodel.cn</a></li><li>· DeepSeek — <a href="https://platform.deepseek.com" target="_blank" className="text-[var(--accent)] underline">platform.deepseek.com</a></li><li>· Kimi — <a href="https://platform.moonshot.cn" target="_blank" className="text-[var(--accent)] underline">platform.moonshot.cn</a></li></ul></li>
                    <li><strong>创建 Key</strong>：在网站的「API 密钥」或「API Keys」页面创建一个 Key。<strong>Key 只显示一次，创建后立刻复制保存！</strong></li>
                    <li><strong>填入软件</strong>：回到本软件 →「AI 配置」→ 选择你注册的提供商 →「管理 API Key」→ 粘贴 Key</li>
                  </ol>
                </SubSection>
              </HelpCard>
              <HelpCard title="🎨 自定义外观 — 字体、主题和玻璃效果">
                <SubSection title="换字体">
                  <p className="text-[var(--text-secondary)] mb-2">在「显示」→「字体」里，英文和中文可以独立选择。</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-xs text-[var(--text-tertiary)] mb-1">推荐组合</p><ul className="text-xs text-[var(--text-secondary)] space-y-0.5"><li>· Space Grotesk + 苹方 — 科技感</li><li>· Playfair Display + 霞鹜文楷 — 文艺</li><li>· JetBrains Mono + 苹方 — 程序员风</li></ul></div>
                    <div className="p-2 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-xs text-[var(--text-tertiary)] mb-1">添加自己的字体</p><p className="text-xs text-[var(--text-secondary)]">点击「+ 添加字体」浏览到 <code className="text-[11px] bg-white/[0.06] px-1 py-0.5 rounded">.ttf</code> 文件。免费下载：<a href="https://fonts.google.com" target="_blank" className="text-[var(--accent)] underline">Google Fonts</a>、<a href="https://www.fonts.net.cn" target="_blank" className="text-[var(--accent)] underline">字体天下</a></p></div>
                  </div>
                </SubSection>
                <SubSection title="玻璃效果"><p className="text-[var(--text-secondary)]">在「显示」里调整折射率、色散等参数。折射率越高毛玻璃感越强。</p></SubSection>
                <SubSection title="主题和文字"><p className="text-[var(--text-secondary)]">主题：深色 / 浅色 / 跟随系统（推荐）。字号 10-20px，macOS 默认 13px。</p></SubSection>
              </HelpCard>
              <HelpCard title="📦 数据安全 — 备份、迁移和恢复">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-sm font-medium text-[var(--text-primary)] mb-1">导出备份</p><p className="text-[var(--text-secondary)] text-xs">「导出全部」打包成 JSON 下载。建议定期备份。</p></div>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-sm font-medium text-[var(--text-primary)] mb-1">换电脑迁移</p><p className="text-[var(--text-secondary)] text-xs">旧电脑导出 → 新电脑导入，数据自动合并。</p></div>
                  <div className="p-3 rounded-lg bg-white/[0.03] border border-[var(--border-subtle)]"><p className="text-sm font-medium text-[var(--text-primary)] mb-1">重置设置</p><p className="text-[var(--text-secondary)] text-xs">只恢复偏好，<strong>不删日记和待办</strong>。</p></div>
                </div>
              </HelpCard>
              <HelpCard title="❓ 常见问题">
                <SubSection title="模块开关是什么？"><p className="text-[var(--text-secondary)]">在「模块管理」里随时开关功能模块。关闭的模块从首页消失。设置模块不可关闭。</p></SubSection>
                <SubSection title="布局方案有什么区别？"><p className="text-[var(--text-secondary)]">macOS 风格有毛玻璃效果；仪表盘多模块同屏；顶部导航最简洁。在「页面布局」切换。</p></SubSection>
                <SubSection title="日记的 AI 功能怎么用？"><p className="text-[var(--text-secondary)]">先配好 API Key，然后在日记设置里开启 AI 写作辅助、情绪分析。</p></SubSection>
                <SubSection title="怎么切换语言？"><p className="text-[var(--text-secondary)]">在「模块管理」底部切换简体中文 / English。</p></SubSection>
              </HelpCard>
            </section>
          )}
        </div>
      </main>

      <ToastContainer />
      <APIKeyModal open={apiModalOpen} onClose={() => setApiModalOpen(false)} />
      <FontUploadModal open={fontUploadOpen} onClose={() => setFontUploadOpen(false)} onFontLoaded={(name, path) => { const newFonts = [...userFonts, { name, path }]; setUserFonts(newFonts); localStorage.setItem('pw-user-fonts', JSON.stringify(newFonts)); applyFontFamily(fontEn, fontZh); showToast({ message: `字体「${name}」已加载`, type: 'success' }) }} />
    </div>
  )
}

function HelpCard({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="lg:col-span-2 rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/[0.02] transition">
        <span className="text-sm font-medium text-[var(--text-primary)]">{title}</span>
        <CaretDown size={16} className={`text-[var(--text-tertiary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-5 pb-5 pt-1 border-t border-[var(--border-subtle)]">{children}</div>}
    </div>
  )
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 last:mb-0">
      <p className="font-medium text-[var(--text-primary)] mb-1.5 text-sm">{title}</p>
      {children}
    </div>
  )
}

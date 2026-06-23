// Bento 版首页 — 首屏网格概览 + 下方手风琴详情
// 规范：docs/bento-layout-design.md
// 与 HomePage.tsx 的区别：
//   1. 首屏用 Bento 网格替代纵向 section 堆叠
//   2. 下方用手风琴替代 scroll-snap 分屏
//   3. 服从模块开关，关掉的模块 Bento 和手风琴都不显示

import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CheckSquare, BookText, Sparkles, MessageCircle,
  Image, Plus, ArrowRight, ChevronDown, ChevronRight, Lightbulb,
} from 'lucide-react'
import { TodoList } from '../components/todo/TodoList'
import { TodoInput } from '../components/todo/TodoInput'
import { DiaryEditor } from '../components/diary/DiaryEditor'
import { DiaryList } from '../components/diary/DiaryList'
import { AISummary } from '../components/ai/AISummary'
import { ChatPanel } from '../components/chat/ChatPanel'
import { WallpaperManager } from '../components/wallpaper/WallpaperManager'
import { InspirationSection } from '../modules/inspiration/pages/InspirationSection'
import { useTodoStore, selectTodoStats } from '../store/useTodoStore'
import { useDiaryStore, selectSortedDiaries } from '../store/useDiaryStore'
import { useWallpaperStore } from '../store/useWallpaperStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAIConfigStore } from '../store/useAIConfigStore'
import { useThemeStore } from '../store/useThemeStore'
import { useInspirationStore } from '../store/useInspirationStore'
import { friendlyDate, getToday } from '../utils/date'
import { useLiquidGlass } from '../hooks/useLiquidGlass'
import { useModuleToggles } from '../hooks/useModuleRoutes'

// ============================================================
// Helpers
// ============================================================

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

// ============================================================
// Accordion
// ============================================================

interface AccordionItemData {
  id: string
  label: string
  icon: React.ReactNode
  moduleKey: string
  children: React.ReactNode
}

function AccordionZone({ items, expandedId, onToggle }: {
  items: AccordionItemData[]
  expandedId: string | null
  onToggle: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map(item => {
        const isOpen = expandedId === item.id
        return (
          <div key={item.id} id={`accordion-${item.id}`}>
            {/* Trigger */}
            <button
              onClick={() => onToggle(isOpen ? '' : item.id)}
              aria-expanded={isOpen}
              className="accordion-trigger group"
            >
              <span className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-colors">
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </span>
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left">{item.label}</span>
            </button>
            {/* Content */}
            {isOpen && (
              <div className="accordion-content animate-accordion-down">
                {item.children}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// Bento Cards
// ============================================================

function BentoCard({ className, onClick, children, registerPanel }: {
  className?: string
  onClick?: () => void
  children: React.ReactNode
  registerPanel?: (el: HTMLElement, conf?: any) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current && registerPanel) {
      registerPanel(ref.current, { cornerRadius: 16 })
    }
  }, [registerPanel])
  return (
    <div ref={ref} onClick={onClick} className={`bento-card p-5 ${className || ''}`}>
      {children}
    </div>
  )
}

// ============================================================
// Main
// ============================================================

export function HomePageBento({ showAccordion = true }: { showAccordion?: boolean }) {
  const stats = useTodoStore(selectTodoStats)
  const diaries = useDiaryStore(selectSortedDiaries)
  const loadTodos = useTodoStore(s => s.loadTodos)
  const loadDiaries = useDiaryStore(s => s.loadDiaries)
  const loadWallpaper = useWallpaperStore(s => s.loadFromFile)
  const loadSettings = useSettingsStore(s => s.loadFromFile)
  const loadAIConfig = useAIConfigStore(s => s.loadFromFile)
  const loadThemeConfig = useThemeStore(s => s.loadFromFile)
  const today = getToday()
  const todayDiary = diaries.find(d => d.date === today)
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const inspirationItems = useInspirationStore(s => s.items)
  const latestInspiration = inspirationItems[0]

  const { registerPanel } = useLiquidGlass(bgUrl)
  const { isOn } = useModuleToggles()
  const navigate = useNavigate()
  const [expandedAccordion, setExpandedAccordion] = useState<string | null>(null)
  const accordionRef = useRef<HTMLDivElement>(null)

  // 加载所有配置数据
  useEffect(() => {
    loadTodos()
    loadDiaries()
    loadWallpaper()
    loadSettings()
    loadAIConfig()
    loadThemeConfig()
  }, [loadTodos, loadDiaries, loadWallpaper, loadSettings, loadAIConfig, loadThemeConfig])

  // 监听 Dock 的 accordion 展开事件
  useEffect(() => {
    const handler = (e: Event) => {
      const { id } = (e as CustomEvent<{ id: string }>).detail
      setExpandedAccordion(id)
      // 滚动到对应 accordion
      setTimeout(() => {
        document.getElementById(`accordion-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
    window.addEventListener('bento-accordion-expand', handler)
    return () => window.removeEventListener('bento-accordion-expand', handler)
  }, [])

  const handleAccordionToggle = useCallback((id: string) => {
    setExpandedAccordion(prev => prev === id ? null : id)
    if (id) {
      setTimeout(() => {
        document.getElementById(`accordion-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 150)
    }
  }, [])

  // 点 Bento 卡片：有手风琴→展开，无手风琴→跳转路由
  const handleCardClick = useCallback((moduleId: string, route: string) => {
    if (showAccordion) {
      handleAccordionToggle(moduleId)
    } else {
      navigate(route)
    }
  }, [showAccordion, handleAccordionToggle, navigate])

  // ============================================================
  // Accordion items — 按模块开关过滤
  // ============================================================
  const accordionItems: AccordionItemData[] = [
    {
      id: 'inspiration', label: '每日灵感', icon: '💡', moduleKey: 'inspiration',
      children: <InspirationSection registerPanel={registerPanel} />,
    },
    {
      id: 'todo', label: '每日待办', icon: '✅', moduleKey: 'todo',
      children: (
        <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-4">
          <TodoInput />
          <div className="mt-4">
            <TodoList />
          </div>
        </div>
      ),
    },
    {
      id: 'diary', label: '每日日记', icon: '📖', moduleKey: 'diary',
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-4">
              <DiaryEditor />
            </div>
          </div>
          <div>
            <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-4">
              <DiaryList />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'ai', label: 'AI 总结', icon: '✨', moduleKey: 'ai',
      children: (
        <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-4">
          <AISummary />
        </div>
      ),
    },
    {
      id: 'chat', label: 'AI 聊天', icon: '💬', moduleKey: 'ai',
      children: (
        <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-4">
          <ChatPanel />
        </div>
      ),
    },
    {
      id: 'wallpaper', label: '壁纸设置', icon: '🖼', moduleKey: 'wallpaper',
      children: (
        <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-4">
          <WallpaperManager />
        </div>
      ),
    },
  ].filter(item => isOn(item.moduleKey))

  // ============================================================
  // Render
  // ============================================================

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 pb-32">
      {/* ============================================================
          Section 1 — Bento Grid
          ============================================================ */}
      <section className="min-h-dvh flex flex-col justify-center py-12">
        {/* ── Row 1: Hero + Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Hero */}
          <div className="md:col-span-2">
            <BentoCard registerPanel={registerPanel}>
              <div className="py-3">
                <div className="text-[11px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">
                  {friendlyDate(new Date())}
                </div>
                <h1 className="text-[var(--text-4xl)] font-bold text-[var(--text-primary)] mb-1" style={{ lineHeight: 1.1 }}>
                  {getGreeting()} <span className="inline-block animate-bounce-subtle">👋</span>
                </h1>
                <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-2">
                  你的个人工作台 — 灵感、待办、日记，一站掌握
                </p>
              </div>
            </BentoCard>
          </div>

          {/* Stats Stack */}
          <div className="flex flex-col gap-4">
            {isOn('todo') && (
              <BentoCard registerPanel={registerPanel} onClick={() => handleCardClick('todo', '/todo')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">待办</span>
                  <CheckSquare size={14} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="text-[var(--text-2xl)] font-bold text-[var(--text-primary)]">{stats.today}</div>
                <div className="text-[11px] text-[var(--text-tertiary)] mt-1">今日待办 · 已完成 {stats.completed}</div>
              </BentoCard>
            )}
            {isOn('diary') && (
              <BentoCard registerPanel={registerPanel} onClick={() => handleCardClick('diary', '/diary')}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">日记</span>
                  <BookText size={14} className="text-[var(--text-tertiary)]" />
                </div>
                <div className="text-[var(--text-2xl)] font-bold text-[var(--text-primary)]">{diaries.length}</div>
                <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
                  共 {diaries.length} 篇 · 今日{todayDiary ? '已写 ✓' : '未写'}
                </div>
              </BentoCard>
            )}
          </div>
        </div>

        {/* ── Row 2: Inspiration + Todo Quick Add ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* Inspiration — 大卡片 */}
          {isOn('inspiration') && (
            <div className="md:col-span-2">
              <BentoCard registerPanel={registerPanel} onClick={() => handleCardClick('inspiration', '/inspiration')}>
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={16} className="text-[var(--accent)]" />
                  <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">每日灵感</span>
                </div>
                {latestInspiration ? (
                  <div>
                    <p className="text-[var(--text-lg)] text-[var(--text-primary)] font-medium italic mb-2 line-clamp-2">
                      「{latestInspiration.content}」
                    </p>
                    {latestInspiration.source && (
                      <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">
                        — {latestInspiration.source}
                      </p>
                    )}
                    <div className="flex items-center gap-1 mt-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <span key={i} className={`text-sm ${i < latestInspiration.impact ? 'text-yellow-400' : 'text-[var(--text-quaternary)]'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mb-2">记下触动你的第一句话</p>
                    <span className="inline-flex items-center gap-1 text-[var(--text-sm)] text-[var(--accent)]">
                      <Plus size={14} /> 写一句
                    </span>
                  </div>
                )}
              </BentoCard>
            </div>
          )}

          {/* AI Summary — 小卡片 */}
          {isOn('ai') && (
            <BentoCard registerPanel={registerPanel} onClick={() => handleCardClick('ai', '/ai')}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-[var(--accent)]" />
                <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">AI 总结</span>
              </div>
              <p className="text-[var(--text-sm)] text-[var(--text-secondary)] mb-3 line-clamp-2">
                用 AI 整理你的日记与想法，发现隐藏的连接
              </p>
              <span className="inline-flex items-center gap-1 text-[var(--text-xs)] text-[var(--accent)]">
                开始总结 <ArrowRight size={12} />
              </span>
            </BentoCard>
          )}
        </div>

        {/* ── Row 3: Quick links ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {isOn('ai') && (
            <BentoCard registerPanel={registerPanel} onClick={() => handleCardClick('chat', '/ai')} className="text-center">
              <MessageCircle size={18} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
              <span className="text-[var(--text-xs)] text-[var(--text-secondary)]">AI 聊天</span>
            </BentoCard>
          )}
          {isOn('wallpaper') && (
            <BentoCard registerPanel={registerPanel} onClick={() => handleCardClick('wallpaper', '/wallpaper')} className="text-center">
              <Image size={18} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
              <span className="text-[var(--text-xs)] text-[var(--text-secondary)]">壁纸</span>
            </BentoCard>
          )}
        </div>

        {/* 向下滚动提示 */}
        {showAccordion && accordionItems.length > 0 && (
          <div className="flex justify-center mt-10">
            <button
              onClick={() => {
                const first = accordionItems[0]
                if (first) handleAccordionToggle(first.id)
              }}
              className="flex flex-col items-center gap-1 text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] transition-colors"
            >
              <span className="text-[11px]">探索更多</span>
              <ChevronDown size={16} className="animate-bounce-subtle" />
            </button>
          </div>
        )}
      </section>

      {/* ============================================================
          Section 2 — Accordion Zone (仅有手风琴时)
          ============================================================ */}
      {showAccordion && accordionItems.length > 0 && (
        <section ref={accordionRef} className="py-12">
          <div className="mb-6">
            <h2 className="text-[var(--text-xl)] font-bold text-[var(--text-primary)] mb-1">模块详情</h2>
            <p className="text-[var(--text-sm)] text-[var(--text-tertiary)]">点击展开你需要的模块</p>
          </div>
          <AccordionZone
            items={accordionItems}
            expandedId={expandedAccordion}
            onToggle={handleAccordionToggle}
          />
        </section>
      )}
    </div>
  )
}

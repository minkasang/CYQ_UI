// 首页 - 纵向滚动布局
// 给 AI 的话：长页面，每个功能区是一个 section，滚动时入场动画
// section id: welcome, todo, diary, ai, wallpaper

import { useRef, useEffect, useState } from 'react'
import { CheckSquare, BookText, ArrowRight, ChevronDown } from 'lucide-react'
import { TodoList } from '../components/todo/TodoList'
import { DiaryEditor } from '../components/diary/DiaryEditor'
import { DiaryList } from '../components/diary/DiaryList'
import { AISummary } from '../components/ai/AISummary'
import { ChatPanel } from '../components/chat/ChatPanel'
import { WallpaperManager } from '../components/wallpaper/WallpaperManager'
import { useTodoStore, selectTodoStats } from '../store/useTodoStore'
import { useDiaryStore, selectSortedDiaries } from '../store/useDiaryStore'
import { useWallpaperStore } from '../store/useWallpaperStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useAIConfigStore } from '../store/useAIConfigStore'
import { useThemeStore } from '../store/useThemeStore'
import { friendlyDate, getToday } from '../utils/date'
import { useLiquidGlass } from '../hooks/useLiquidGlass'

// 滚动入场动画 Hook
function useScrollAnimation(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, isVisible }
}

export function HomePage() {
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

  const { registerPanel } = useLiquidGlass(bgUrl)

  // 加载所有配置数据
  useEffect(() => {
    loadTodos()
    loadDiaries()
    loadWallpaper()
    loadSettings()
    loadAIConfig()
    loadThemeConfig()
  }, [loadTodos, loadDiaries, loadWallpaper, loadSettings, loadAIConfig, loadThemeConfig])

  // 各个 section 的滚动动画
  const welcomeAnim = useScrollAnimation(0.3)
  const todoAnim = useScrollAnimation(0.2)
  const diaryAnim = useScrollAnimation(0.2)
  const aiAnim = useScrollAnimation(0.2)
  const chatAnim = useScrollAnimation(0.2)
  const wallpaperAnim = useScrollAnimation(0.2)

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* ===== 第 1 屏：欢迎区 ===== */}
      <section
        id="welcome"
        ref={welcomeAnim.ref}
        className={`min-h-[80vh] flex flex-col justify-center transition-all duration-1000 ${
          welcomeAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-3">
            {getGreeting()} 👋
          </h1>
          <p className="text-lg text-white/60">
            {friendlyDate(new Date())}
          </p>
          <p className="text-sm text-white/40 mt-2">
            向下滚动探索你的工作台
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatCard label="今日待办" value={stats.today} icon={CheckSquare} onClick={() => scrollTo('todo')} registerPanel={registerPanel} />
          <StatCard label="已完成" value={stats.completed} icon={CheckSquare} onClick={() => scrollTo('todo')} registerPanel={registerPanel} />
          <StatCard label="日记总数" value={diaries.length} icon={BookText} onClick={() => scrollTo('diary')} registerPanel={registerPanel} />
          <StatCard label="今日日记" value={todayDiary ? '✓' : '–'} icon={BookText} onClick={() => scrollTo('diary')} registerPanel={registerPanel} />
        </div>

        {/* 向下滚动提示 */}
        <button
          onClick={() => scrollTo('todo')}
          className="flex flex-col items-center gap-1 text-white/30 hover:text-white/60 transition self-center mt-4"
        >
          <span className="text-xs">向下滑动</span>
          <ChevronDown size={20} className="animate-bounce" />
        </button>
      </section>

      {/* ===== 第 2 屏：待办区 ===== */}
      <section
        id="todo"
        ref={todoAnim.ref}
        className={`py-8 transition-all duration-1000 ${
          todoAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <SectionTitle title="每日待办" subtitle="管理工作与生活的任务清单" />
        <div ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl p-5">
          <TodoList />
        </div>
      </section>

      {/* ===== 第 3 屏：日记区 ===== */}
      <section
        id="diary"
        ref={diaryAnim.ref}
        className={`py-8 transition-all duration-1000 ${
          diaryAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <SectionTitle title="每日日记" subtitle="记录今天的想法与感悟" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <div ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl p-5">
              <DiaryEditor />
            </div>
          </div>
          <div>
            <div ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl p-5">
              <DiaryList />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 第 4 屏：AI 总结区 ===== */}
      <section
        id="ai"
        ref={aiAnim.ref}
        className={`py-8 transition-all duration-1000 ${
          aiAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <SectionTitle title="AI 总结" subtitle="用 AI 整理你的日记与想法" />
        <div ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl p-5">
          <AISummary />
        </div>
      </section>

      {/* ===== 第 5 屏：AI 聊天区 ===== */}
      <section
        id="chat"
        ref={chatAnim.ref}
        className={`py-10 transition-all duration-1000 ${
          chatAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <SectionTitle title="AI 聊天" subtitle="与 AI 进行多轮对话" />
        <div ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl p-5">
          <ChatPanel />
        </div>
      </section>

      {/* ===== 第 6 屏：壁纸设置区 ===== */}
      <section
        id="wallpaper"
        ref={wallpaperAnim.ref}
        className={`py-8 transition-all duration-1000 ${
          wallpaperAnim.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <SectionTitle title="壁纸设置" subtitle="换个背景，换个心情" />
        <div ref={(el) => registerPanel(el, { cornerRadius: 24 })} className="rounded-3xl p-5">
          <WallpaperManager />
        </div>
      </section>

      {/* 底部留白 */}
      <div className="h-20" />
    </div>
  )
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 12) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  if (hour < 22) return '晚上好'
  return '夜深了'
}

interface StatCardProps {
  label: string
  value: number | string
  icon: typeof CheckSquare
  onClick?: () => void
  registerPanel: (el: HTMLElement | null, overrides?: import('../lib/liquid-glass').LiquidGlassConfig) => void
}

function StatCard({ label, value, icon: Icon, onClick, registerPanel }: StatCardProps) {
  return (
    <button onClick={onClick} className="w-full">
      <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon size={16} className="text-white/80" />
          <ArrowRight size={12} className="text-white/50" />
        </div>
        <div className="text-2xl font-bold text-white text-center">{value}</div>
        <div className="text-[10px] text-white/70 mt-0.5 text-center">{label}</div>
      </div>
    </button>
  )
}

interface SectionTitleProps {
  title: string
  subtitle: string
}

function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-bold text-white mb-1">{title}</h2>
      <p className="text-sm text-white/50">{subtitle}</p>
    </div>
  )
}

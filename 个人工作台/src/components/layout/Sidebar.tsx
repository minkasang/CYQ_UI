// 左侧导航栏（极简版）
// 给 AI 的话：去掉所有花哨的 hover/active 玻璃效果，只用纯色背景
// 避免多层半透明叠加导致的"光晕"和"错位"感
//
// 模块开关：读取 localStorage 'module_toggle_{id}'，订阅 useModuleRoutes 的通知重渲染

import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CheckSquare, BookText, Sparkles, Settings as SettingsIcon, Image as ImageIcon, MessageSquare, Lightbulb } from 'lucide-react'

const ALL_SECTIONS = [
  { id: 'welcome', label: '首页', icon: Home },
  { id: 'inspiration', label: '灵感', icon: Lightbulb },
  { id: 'todo', label: '待办', icon: CheckSquare },
  { id: 'diary', label: '日记', icon: BookText },
  { id: 'ai', label: 'AI 总结', icon: Sparkles },
  { id: 'chat', label: 'AI 聊天', icon: MessageSquare },
  { id: 'wallpaper', label: '壁纸', icon: ImageIcon },
]

// 始终显示的入口（不可关闭）
const ALWAYS_ON = new Set(['settings'])

const PREFIX = 'module_toggle_'

function isOn(id: string): boolean {
  if (ALWAYS_ON.has(id)) return true
  // chat 跟随 ai 模块开关，没有独立的 chat 模块
  const toggleKey = id === 'chat' ? 'ai' : id
  return localStorage.getItem(PREFIX + toggleKey) !== 'off'
}

// 侧边栏订阅路由 Hook 的版本通知
let _v = 0
const _listeners: Array<() => void> = []

// useModuleRoutes 会在 init 完成后调用这个，侧边栏和路由联动
;(window as any).__sidebarRefresh = () => {
  _v++
  _listeners.forEach(fn => fn())
}

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const [activeSection, setActiveSection] = useState('welcome')
  const [, setV] = useState(_v)

  // 订阅切换通知
  useEffect(() => {
    const fn = () => setV(_v)
    _listeners.push(fn)
    return () => { const i = _listeners.indexOf(fn); if (i >= 0) _listeners.splice(i, 1) }
  }, [])

  const sections = ALL_SECTIONS.filter(s => isOn(s.id))

  // 监听滚动
  useEffect(() => {
    if (!isHome) return

    const handleScroll = () => {
      const main = document.querySelector('main')
      if (!main) return
      const scrollTop = main.scrollTop + 200

      let current = 'welcome'
      for (const section of sections) {
        const el = document.getElementById(section.id)
        if (el && el.offsetTop <= scrollTop) {
          current = section.id
        }
      }
      setActiveSection(current)
    }

    const main = document.querySelector('main')
    if (main) {
      main.addEventListener('scroll', handleScroll)
      handleScroll()
    }
    return () => {
      if (main) main.removeEventListener('scroll', handleScroll)
    }
  }, [isHome, sections])

  const handleNavClick = useCallback((id: string) => {
    if (isHome) {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      navigate('/')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }, [isHome, navigate])

  return (
    <aside className={`flex flex-col h-full py-6 bg-black/40 border-r border-white/5 ${collapsed ? 'w-16' : 'w-52'}`}>
      {/* Logo */}
      <div className="px-4 mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-white bg-blue-500">
          W
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-sm font-semibold text-white">工作台</h1>
            <p className="text-[10px] text-white/50">v0.1</p>
          </div>
        )}
      </div>

      {/* 导航 */}
      <nav className="flex-1 px-2 space-y-1">
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = isHome && activeSection === id
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left transition-[background,color] duration-150 ${
                isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}

        <div className="h-px bg-white/5 my-2"></div>

        <button
          onClick={() => navigate('/settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left transition-[background,color] duration-150 ${
            location.pathname === '/settings' ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
          }`}
        >
          <SettingsIcon size={16} className="flex-shrink-0" />
          {!collapsed && <span>设置</span>}
        </button>
      </nav>
    </aside>
  )
}

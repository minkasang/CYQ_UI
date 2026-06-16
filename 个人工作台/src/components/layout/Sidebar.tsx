// 左侧导航栏（极简版）
// 给 AI 的话：去掉所有花哨的 hover/active 玻璃效果，只用纯色背景
// 避免多层半透明叠加导致的"光晕"和"错位"感

import { useEffect, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Home, CheckSquare, BookText, Sparkles, Settings as SettingsIcon, Image as ImageIcon } from 'lucide-react'

const SECTIONS = [
  { id: 'welcome', label: '首页', icon: Home },
  { id: 'todo', label: '待办', icon: CheckSquare },
  { id: 'diary', label: '日记', icon: BookText },
  { id: 'ai', label: 'AI 总结', icon: Sparkles },
  { id: 'wallpaper', label: '壁纸', icon: ImageIcon },
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const [activeSection, setActiveSection] = useState('welcome')

  // 监听滚动
  useEffect(() => {
    if (!isHome) return

    const handleScroll = () => {
      const main = document.querySelector('main')
      if (!main) return
      const scrollTop = main.scrollTop + 200

      let current = 'welcome'
      for (const section of SECTIONS) {
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
  }, [isHome])

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
    <aside
      className={`flex flex-col h-full py-6 ${collapsed ? 'w-16' : 'w-52'}`}
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
      }}
    >
      {/* Logo */}
      <div className="px-4 mb-8 flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-white"
          style={{ background: '#3b82f6' }}
        >
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
        {SECTIONS.map(({ id, label, icon: Icon }) => {
          const isActive = isHome && activeSection === id
          return (
            <button
              key={id}
              onClick={() => handleNavClick(id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left"
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <Icon size={16} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          )
        })}

        <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.06)', margin: '8px 0' }}></div>

        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left"
          style={{
            background: location.pathname === '/settings' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
            color: location.pathname === '/settings' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={(e) => {
            if (location.pathname !== '/settings') {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            }
          }}
          onMouseLeave={(e) => {
            if (location.pathname !== '/settings') {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          <SettingsIcon size={16} className="flex-shrink-0" />
          {!collapsed && <span>设置</span>}
        </button>
      </nav>
    </aside>
  )
}

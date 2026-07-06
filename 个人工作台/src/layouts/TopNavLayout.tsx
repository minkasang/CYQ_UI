// 顶栏导航布局 — 水平导航菜单 + 无侧栏
// 规范：共享执行规则文件/布局系统/architecture.md §3.4
// 除首页和设置外，所有模块点击后滚动到首页对应 section

import { type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

const NAV_ITEMS = [
  { to: '/', label: '首页' },
  { to: '/', label: '图谱', scrollTo: 'inspiration' },
  { to: '/', label: '待办', scrollTo: 'todo' },
  { to: '/', label: '日记', scrollTo: 'diary' },
  { to: '/', label: 'AI', scrollTo: 'ai' },
  { to: '/settings', label: '设置' },
]

export function TopNavLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()

  const linkClass = (active: boolean) =>
    `px-3 py-1.5 rounded text-xs transition-colors ${
      active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/5'
    }`

  const scrollToSection = (id: string) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <GlobalBackground />

      <header className="flex-shrink-0 flex items-center px-4 gap-8 h-[44px] bg-black/30 border-b border-white/5">
        <span className="text-sm font-semibold text-white tracking-tight">工作台</span>
        <nav className="flex gap-1">
          {NAV_ITEMS.map(item => {
            if ('scrollTo' in item && item.scrollTo) {
              return (
                <button
                  key={item.scrollTo}
                  onClick={() => scrollToSection(item.scrollTo!)}
                  className={linkClass(location.pathname === '/')}
                >
                  {item.label}
                </button>
              )
            }
            const isSettings = item.to === '/settings'
            const active = isSettings
              ? location.pathname.startsWith('/settings')
              : location.pathname === '/'
            return (
              <NavLink key={item.to + (item.label)} to={item.to} className={linkClass(active)}>
                {item.label}
              </NavLink>
            )
          })}
        </nav>
      </header>

      <main className="flex-1 overflow-auto snap-y snap-proximity">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

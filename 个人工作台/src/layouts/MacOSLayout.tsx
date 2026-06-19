// macOS 布局壳 — Apple 设计语言
// 规范来源：共享执行规则文件/布局系统/macos-design-spec.md

import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

export function MacOSLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif' }}>
      <GlobalBackground />

      {/* Traffic light 装饰（纯视觉） */}
      <div className="absolute top-4 left-4 flex gap-2 z-50 pointer-events-none">
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
      </div>

      {/* 顶栏 — ~50px */}
      <div className="flex-shrink-0 flex items-center px-4 gap-4"
        style={{
          height: 50,
          background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
        <button onClick={() => setCollapsed(!collapsed)}
          className="text-white/60 hover:text-white transition">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
        <div className="flex-1 text-center text-xs text-white/50">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 侧边栏 — 240px, vibrancy blur */}
        <aside
          className="flex-shrink-0 h-full flex flex-col py-6"
          style={{
            width: collapsed ? 0 : 240,
            overflow: 'hidden',
            background: 'rgba(30,30,30,0.72)',
            backdropFilter: 'saturate(180%) blur(20px)',
            WebkitBackdropFilter: 'saturate(180%) blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            transition: 'width 0.25s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          {/* Logo */}
          <div className="px-4 mb-8 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold text-white"
              style={{ background: '#2997ff' }}>
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
            {NAV_ITEMS.map(({ id, label, icon }) => (
              <NavLink
                key={id}
                to={id === 'home' ? '/' : `/${id}`}
                className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left no-underline"
                style={({ isActive }) => ({
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#ffffff' : 'rgba(255,255,255,0.7)',
                  transition: 'background 0.15s',
                })}
              >
                <span className="text-base">{icon}</span>
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* 底部设置 */}
          <div className="px-2">
            <NavLink
              to="/settings"
              className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-left no-underline"
              style={({ isActive }) => ({
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
              })}
            >
              <span className="text-base">⚙️</span>
              {!collapsed && <span>设置</span>}
            </NavLink>
          </div>
        </aside>

        {/* 内容区 — max-w-1200px 居中, 8px 网格间距 */}
        <main className="flex-1 overflow-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
          <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  )
}

const NAV_ITEMS = [
  { id: 'home', label: '首页', icon: '🏠' },
  { id: 'todo', label: '待办', icon: '✅' },
  { id: 'diary', label: '日记', icon: '📖' },
  { id: 'ai', label: 'AI 总结', icon: '✨' },
  { id: 'chat', label: 'AI 聊天', icon: '💬' },
  { id: 'wallpaper', label: '壁纸', icon: '🖼' },
]

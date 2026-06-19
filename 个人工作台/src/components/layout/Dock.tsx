// 底部浮动 Dock — macOS 风格导航
// 规范来源：doc/macos-design-spec-v1.md §4

import { NavLink, useLocation } from 'react-router-dom'

const DOCK_ITEMS = [
  { id: 'home', to: '/', icon: '🏠', label: '首页' },
  { id: 'todo', to: '/todo', icon: '✅', label: '待办' },
  { id: 'diary', to: '/diary', icon: '📖', label: '日记' },
  { id: 'ai', to: '/ai', icon: '💬', label: 'AI' },
  { id: 'settings', to: '/settings', icon: '⚙️', label: '设置' },
]

export function Dock() {
  const location = useLocation()

  return (
    <div
      className="fixed z-50 flex items-center gap-1"
      style={{
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 12px',
        height: 48,
        borderRadius: 20,
        background: 'rgba(30,30,32,0.85)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        boxShadow: [
          '0 0 0 0.5px rgba(255,255,255,0.08)',
          '0 4px 16px rgba(0,0,0,0.12)',
          '0 8px 32px rgba(0,0,0,0.2)',
        ].join(', '),
      }}
    >
      {DOCK_ITEMS.map(item => {
        const isActive = location.pathname === item.to ||
          (item.to !== '/' && location.pathname.startsWith(item.to))
        return (
          <NavLink
            key={item.id}
            to={item.to}
            className="relative flex flex-col items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'transparent',
              transition: 'all 150ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.transform = 'scale(1.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <span style={{ fontSize: 20, opacity: isActive ? 1 : 0.5, transition: 'opacity 150ms' }}>
              {item.icon}
            </span>
            {/* 活跃指示：3px Action Blue 圆点 */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  bottom: -2,
                  width: 3,
                  height: 3,
                  borderRadius: '50%',
                  background: '#0A84FF',
                }}
              />
            )}
          </NavLink>
        )
      })}
    </div>
  )
}

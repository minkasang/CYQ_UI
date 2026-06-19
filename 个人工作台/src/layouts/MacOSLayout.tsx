// macOS 布局壳 — 纯内容 + 浮动 Dock
// 规范：doc/macos-design-spec-v1.md · 范式3

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { Dock } from '../components/layout/Dock'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

export function MacOSLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // 监听内容滚动，切换顶栏背景
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 10)
    el.addEventListener('scroll', onScroll)
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className="h-screen w-screen overflow-hidden flex flex-col"
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <GlobalBackground />

      {/* Traffic light 装饰 */}
      <div className="absolute top-[16px] left-[12px] flex gap-2 z-[60] pointer-events-none">
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
      </div>

      {/* 顶栏 — 44px, sticky, 滚动渐变 */}
      <div
        className="sticky top-0 z-40 flex items-center px-4 flex-shrink-0"
        style={{
          height: 44,
          background: scrolled
            ? 'rgba(0,0,0,0.6)'
            : 'rgba(0,0,0,0)',
          backdropFilter: scrolled ? 'saturate(180%) blur(10px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'saturate(180%) blur(10px)' : 'none',
          transition: 'background 0.3s ease',
        }}
      >
        {/* 日期 */}
        <div className="flex-1 text-center text-xs text-white/50">
          {new Date().toLocaleDateString('zh-CN', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
          })}
        </div>

        {/* 搜索 */}
        {searchOpen ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              placeholder="搜索..."
              className="w-[200px] h-[28px] px-3 rounded-md text-xs bg-white/10 border border-white/10 text-white outline-none placeholder-white/30 focus:border-[#0A84FF] transition-colors"
              style={{ fontFamily: 'inherit' }}
              onKeyDown={e => e.key === 'Escape' && setSearchOpen(false)}
            />
            <button onClick={() => setSearchOpen(false)}
              className="text-white/40 hover:text-white/80 text-xs">
              ✕
            </button>
          </div>
        ) : (
          <button onClick={() => setSearchOpen(true)}
            className="text-white/40 hover:text-white/80 transition"
            title="搜索">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l3 3" />
            </svg>
          </button>
        )}
      </div>

      {/* 内容区 — #1C1C1E 背景, 全宽, 独立滚动 */}
      <main
        ref={mainRef}
        className="flex-1 overflow-auto"
        style={{ background: '#1C1C1E' }}
      >
        <div className="px-8 py-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>

      {/* 底部浮动 Dock */}
      <Dock />
    </div>
  )
}

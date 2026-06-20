// Bento 布局壳 — 基于 macOS 布局优化
// 规范：docs/bento-layout-design.md
// 与原 MacOSLayout 的区别：
//   1. 顶栏更紧凑（40px → 与 8px 网格对齐）
//   2. 内容区无 snap 滚动（Bento 首页自行管理滚动）
//   3. Traffic lights 保留，macOS 原生感
//   4. 搜索替换为命令面板风格

import { useState, useRef, useEffect, type ReactNode } from 'react'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { Dock } from '../components/layout/Dock'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

export function BentoLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // 监听内容滚动，切换顶栏背景
  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setScrolled(el.scrollTop > 10)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col" style={{ fontFamily: 'var(--font-sans)' }}>
      <GlobalBackground />

      {/* Traffic light 装饰 — 左上角 macOS 三色点 */}
      <div className="absolute top-[14px] left-[14px] flex gap-[8px] z-[60] pointer-events-none select-none">
        <span className="w-[12px] h-[12px] rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-[12px] h-[12px] rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="w-[12px] h-[12px] rounded-full" style={{ background: '#28C840' }} />
      </div>

      {/* 顶栏 — 40px 高度，对齐 8px 网格 */}
      <header
        className={`sticky top-0 z-40 flex items-center justify-between flex-shrink-0 h-10 px-4 transition-all duration-300 ${
          scrolled
            ? 'bg-black/50 backdrop-blur-[10px] backdrop-saturate-[180%] border-b border-[var(--border-subtle)]'
            : 'bg-transparent'
        }`}
      >
        {/* 左侧留白给 traffic lights */}
        <div className="w-[60px]" />

        {/* 日期 — 居中 */}
        <div className="flex-1 text-center">
          <span className="text-xs text-[var(--text-tertiary)] tracking-wide select-none">
            {new Date().toLocaleDateString('zh-CN', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
            })}
          </span>
        </div>

        {/* 右侧：保持对称 */}
        <div className="w-[60px]" />
      </header>

      {/* 内容区 — 平滑滚动，无 snap */}
      <main
        ref={mainRef}
        className="flex-1 overflow-auto"
      >
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* 底部浮动 Dock */}
      <Dock />
    </div>
  )
}

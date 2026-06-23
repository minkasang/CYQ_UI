// 无侧栏全宽布局 — 顶栏极简 + Dock 导航
// 规范：共享执行规则文件/布局系统/architecture.md §3.3

import type { ReactNode } from 'react'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { Dock } from '../components/layout/Dock'
import { ErrorBoundary } from '../components/common/ErrorBoundary'
import { friendlyDate } from '../utils/date'

export function FullWidthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <GlobalBackground />

      {/* 顶栏 — 极简：仅日期 */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-[40px] bg-black/30 border-b border-white/5">
        <span className="text-xs text-white/70">{friendlyDate(new Date())}</span>
        <span className="text-xs text-white/30">全宽布局</span>
      </header>

      {/* 内容区 — 全宽，无最大宽度限制 */}
      <main className="flex-1 overflow-auto p-6 snap-y snap-proximity">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>

      {/* 底部浮动 Dock */}
      <Dock />
    </div>
  )
}

// 顶栏导航布局占位壳
// TODO: 后续完整实现

import type { ReactNode } from 'react'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

export function TopNavLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <GlobalBackground />
      <div className="flex-shrink-0 flex items-center px-4 gap-6 h-[44px]"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-sm font-semibold text-white">工作台</span>
        <nav className="flex gap-4">
          <span className="text-xs text-white/70">首页</span>
          <span className="text-xs text-white/50">待办</span>
          <span className="text-xs text-white/50">日记</span>
          <span className="text-xs text-white/50">AI</span>
        </nav>
      </div>
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1200px] mx-auto px-6 py-6 space-y-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  )
}

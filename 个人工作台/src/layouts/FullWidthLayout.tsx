// 无侧栏全宽布局占位壳
// TODO: 后续完整实现

import type { ReactNode } from 'react'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

export function FullWidthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col">
      <GlobalBackground />
      <div className="flex-shrink-0 flex items-center px-4 h-[40px]"
        style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xs text-white/50">个人工作台</span>
      </div>
      <main className="flex-1 overflow-auto p-6">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </main>
    </div>
  )
}

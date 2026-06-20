// 初始布局壳 — 保持现有页面结构不变

import { useState, type ReactNode } from 'react'
import { Sidebar } from '../components/layout/Sidebar'
import { TopBar } from '../components/layout/TopBar'
import { GlobalBackground } from '../components/layout/GlobalBackground'
import { StorageWarning } from '../components/common/StorageWarning'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

export function DefaultLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <GlobalBackground />
      <StorageWarning />
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto p-6 snap-y snap-proximity">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

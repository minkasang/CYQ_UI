// 整体布局
// 给 AI 的话：Sidebar + TopBar + 内容区三段式

import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { GlobalBackground } from './GlobalBackground'
import { StorageWarning } from '../common/StorageWarning'
import { ErrorBoundary } from '../common/ErrorBoundary'

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <GlobalBackground />
      <StorageWarning />
      <Sidebar collapsed={collapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar onToggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="flex-1 overflow-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

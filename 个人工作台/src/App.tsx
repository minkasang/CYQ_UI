// 主应用：路由配置 — v2 模块热拔插
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { HomePageBento } from './pages/HomePageBento'
import { DemoPage } from './pages/DemoPage'
import { ThemeDemoPage } from './pages/ThemeDemoPage'
import { AgentsChatPage } from './modules/agents/pages/AgentsChatPage'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { useModuleRoutes } from './hooks/useModuleRoutes'
import { useLayoutRegistry } from './store/useLayoutRegistry'

/** 根据当前布局壳选择首页变体 */
function HomePageSwitch() {
  const activeId = useLayoutRegistry(s => s.activeId)
  return activeId === 'bento' ? <HomePageBento /> : <HomePage />
}

export function App() {
  const moduleRoutes = useModuleRoutes()

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePageSwitch />} />
          {/* 模块热拔插路由 — 由 ModuleManager 动态管理 */}
          {moduleRoutes}
          <Route path="agents" element={<AgentsChatPage />} />
        </Route>
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/theme-demo" element={<ThemeDemoPage />} />
      </Routes>
    </ThemeProvider>
  )
}

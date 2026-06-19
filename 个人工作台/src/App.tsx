// 主应用：路由配置 — v2 模块热拔插
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { DemoPage } from './pages/DemoPage'
import { ThemeDemoPage } from './pages/ThemeDemoPage'
import { ThemeProvider } from './components/layout/ThemeProvider'
import { useModuleRoutes } from './hooks/useModuleRoutes'

export function App() {
  const moduleRoutes = useModuleRoutes()

  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          {/* 模块热拔插路由 — 由 ModuleManager 动态管理 */}
          {moduleRoutes}
        </Route>
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/theme-demo" element={<ThemeDemoPage />} />
      </Routes>
    </ThemeProvider>
  )
}

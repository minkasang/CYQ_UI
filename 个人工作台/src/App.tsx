// 主应用：路由配置
import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { HomePage } from './pages/HomePage'
import { TodoPage } from './pages/TodoPage'
import { DiaryPage } from './pages/DiaryPage'
import { WallpaperPage } from './pages/WallpaperPage'
import { SettingsPage } from './pages/SettingsPage'
import { DemoPage } from './pages/DemoPage'

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="todo" element={<TodoPage />} />
        <Route path="diary" element={<DiaryPage />} />
        <Route path="wallpaper" element={<WallpaperPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="/demo" element={<DemoPage />} />
    </Routes>
  )
}

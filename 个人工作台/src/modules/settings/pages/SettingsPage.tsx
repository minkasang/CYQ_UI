// 设置页面
// 给 AI 的话：引用现有组件，确保不破坏现有功能

import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { useSettingsStore } from '../../../store/useSettingsStore'
import { useEffect } from 'react'

export function SettingsPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadFromFile = useSettingsStore(s => s.loadFromFile)
  const settings = useSettingsStore(s => s.settings)
  const setTheme = useSettingsStore(s => s.setTheme)
  const setLanguage = useSettingsStore(s => s.setLanguage)
  const resetAll = useSettingsStore(s => s.resetAll)

  // 加载设置数据
  useEffect(() => {
    loadFromFile()
  }, [loadFromFile])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">设置</h1>
      <p className="text-sm text-white/60 mb-4">
        管理个人工作台的设置
      </p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5 space-y-4">
        {/* 主题设置 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">主题</h3>
          <select
            value={settings.theme || 'dark'}
            onChange={(e) => setTheme(e.target.value as any)}
            className="w-full px-3 py-2 rounded bg-white/10 text-white"
          >
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>

        {/* 语言设置 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">语言</h3>
          <select
            value={settings.language || 'zh-CN'}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="w-full px-3 py-2 rounded bg-white/10 text-white"
          >
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>

        {/* 数据管理 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">数据管理</h3>
          <button
            onClick={() => resetAll()}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            重置所有设置
          </button>
        </div>

        {/* 关于 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">关于</h3>
          <p className="text-white/60 text-sm">
            个人工作台 v1.0.0
          </p>
          <p className="text-white/40 text-xs mt-1">
            基于 React + TypeScript + Vite 构建
          </p>
        </div>
      </div>
    </div>
  )
}

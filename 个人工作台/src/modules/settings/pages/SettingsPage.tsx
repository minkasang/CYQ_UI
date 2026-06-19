// 设置页面
import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { useSettingsStore } from '../../../store/useSettingsStore'
import { useEffect, useState } from 'react'
import { ALL_MODULE_IDS, MODULE_NAMES, notifyModuleToggleChanged } from '../../../hooks/useModuleRoutes'

const PREFIX = 'module_toggle_'

function readToggle(id: string): boolean {
  return localStorage.getItem(PREFIX + id) !== 'off'
}

function writeToggle(id: string, on: boolean) {
  localStorage.setItem(PREFIX + id, on ? 'on' : 'off')
  notifyModuleToggleChanged()
}

export function SettingsPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadFromFile = useSettingsStore(s => s.loadFromFile)
  const settings = useSettingsStore(s => s.settings)
  const setTheme = useSettingsStore(s => s.setTheme)
  const setLanguage = useSettingsStore(s => s.setLanguage)
  const resetAll = useSettingsStore(s => s.resetAll)

  const [toggles, setToggles] = useState<Record<string, boolean>>({})

  useEffect(() => { loadFromFile() }, [loadFromFile])

  useEffect(() => {
    const t: Record<string, boolean> = {}
    ALL_MODULE_IDS.forEach(id => { t[id] = readToggle(id) })
    setToggles(t)
  }, [])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">设置</h1>
      <p className="text-sm text-white/60 mb-4">管理个人工作台的设置</p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5 space-y-5">
        {/* 模块管理 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-3">模块管理</h3>
          <p className="text-xs text-white/40 mb-2">开启或关闭功能模块，路由会实时生效</p>
          <div className="space-y-2">
            {ALL_MODULE_IDS.map(id => (
              <div key={id} className="flex items-center justify-between py-1.5 px-2 rounded bg-white/5">
                <span className="text-white/80 text-sm">{MODULE_NAMES[id] || id}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={toggles[id] ?? true}
                    disabled={id === 'settings'}
                    onChange={() => {
                      const next = !toggles[id]
                      writeToggle(id, next)
                      setToggles(prev => ({ ...prev, [id]: next }))
                    }}
                  />
                  <div className={`w-9 h-5 rounded-full peer transition-colors
                    ${toggles[id] ? 'bg-blue-500' : 'bg-white/20'}
                    ${id === 'settings' ? 'opacity-50 cursor-not-allowed' : ''}
                    after:content-[''] after:absolute after:top-[2px] after:start-[2px]
                    after:bg-white after:rounded-full after:h-4 after:w-4
                    after:transition-transform ${toggles[id] ? 'after:translate-x-4' : ''}
                  `} />
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10" />

        {/* 主题设置 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">主题</h3>
          <select value={settings.theme || 'dark'} onChange={(e) => setTheme(e.target.value as any)}
            className="w-full px-3 py-2 rounded bg-white/10 text-white">
            <option value="light">浅色</option>
            <option value="dark">深色</option>
            <option value="auto">跟随系统</option>
          </select>
        </div>

        {/* 语言 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">语言</h3>
          <select value={settings.language || 'zh-CN'} onChange={(e) => setLanguage(e.target.value as any)}
            className="w-full px-3 py-2 rounded bg-white/10 text-white">
            <option value="zh-CN">简体中文</option>
            <option value="en-US">English</option>
          </select>
        </div>

        {/* 数据管理 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">数据管理</h3>
          <button onClick={() => resetAll()} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
            重置所有设置
          </button>
        </div>

        {/* 关于 */}
        <div>
          <h3 className="text-sm font-medium text-white/80 mb-2">关于</h3>
          <p className="text-white/60 text-sm">个人工作台 v1.0.0</p>
          <p className="text-white/40 text-xs mt-1">基于 React + TypeScript + Vite 构建</p>
        </div>
      </div>
    </div>
  )
}

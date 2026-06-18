// 壁纸管理页面
// 给 AI 的话：引用现有组件，确保不破坏现有功能

import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { useEffect, useState } from 'react'

export function WallpaperPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadFromFile = useWallpaperStore(s => s.loadFromFile)
  const setCurrent = useWallpaperStore(s => s.setCurrent)
  const history = useWallpaperStore(s => s.history)

  const [inputType, setInputType] = useState<'url' | 'color' | 'gradient'>('url')
  const [urlInput, setUrlInput] = useState('')
  const [colorInput, setColorInput] = useState('#3b82f6')
  const [gradientInput, setGradientInput] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)')

  // 加载壁纸数据
  useEffect(() => {
    loadFromFile()
  }, [loadFromFile])

  const handleSetWallpaper = () => {
    if (inputType === 'url' && urlInput) {
      setCurrent({ id: `custom-${Date.now()}`, type: 'url', value: urlInput, name: '自定义URL', createdAt: Date.now() })
    } else if (inputType === 'color') {
      setCurrent({ id: `custom-${Date.now()}`, type: 'color', value: colorInput, name: '自定义颜色', createdAt: Date.now() })
    } else if (inputType === 'gradient') {
      setCurrent({ id: `custom-${Date.now()}`, type: 'gradient', value: gradientInput, name: '自定义渐变', createdAt: Date.now() })
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">壁纸管理</h1>
      <p className="text-sm text-white/60 mb-4">
        管理个人工作台的壁纸
      </p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5 space-y-4">
        {/* 类型选择 */}
        <div className="flex gap-2">
          <button
            onClick={() => setInputType('url')}
            className={`px-3 py-1 rounded ${inputType === 'url' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}
          >
            URL
          </button>
          <button
            onClick={() => setInputType('color')}
            className={`px-3 py-1 rounded ${inputType === 'color' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}
          >
            纯色
          </button>
          <button
            onClick={() => setInputType('gradient')}
            className={`px-3 py-1 rounded ${inputType === 'gradient' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}`}
          >
            渐变
          </button>
        </div>

        {/* 输入区域 */}
        {inputType === 'url' && (
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="输入壁纸URL"
            className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/40"
          />
        )}
        {inputType === 'color' && (
          <input
            type="color"
            value={colorInput}
            onChange={(e) => setColorInput(e.target.value)}
            className="w-full h-10 rounded bg-white/10"
          />
        )}
        {inputType === 'gradient' && (
          <input
            type="text"
            value={gradientInput}
            onChange={(e) => setGradientInput(e.target.value)}
            placeholder="输入CSS渐变"
            className="w-full px-3 py-2 rounded bg-white/10 text-white placeholder-white/40"
          />
        )}

        {/* 应用按钮 */}
        <button
          onClick={handleSetWallpaper}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          应用壁纸
        </button>

        {/* 历史记录 */}
        {history.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-white/80 mb-2">历史记录</h3>
            <div className="grid grid-cols-4 gap-2">
              {history.slice(0, 8).map((item, index) => (
                <div
                  key={index}
                  onClick={() => setCurrent(item)}
                  className="h-16 rounded cursor-pointer overflow-hidden border-2 border-transparent hover:border-blue-500"
                  style={{
                    background: item.type === 'color' ? item.value :
                               item.type === 'gradient' ? item.value :
                               `url(${item.value}) center/cover`
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

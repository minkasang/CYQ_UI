// 壁纸管理页面
import { WallpaperManager } from '../components/wallpaper/WallpaperManager'
import { useLiquidGlass } from '../hooks/useLiquidGlass'
import { useWallpaperStore } from '../store/useWallpaperStore'

export function WallpaperPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">🖼 壁纸管理</h1>
      <p className="text-sm text-white/60 mb-4">
        自定义你的工作台背景
      </p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5">
        <WallpaperManager />
      </div>
    </div>
  )
}

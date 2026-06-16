// AI 总结页面
import { AISummary } from '../components/ai/AISummary'
import { APIConfig } from '../components/ai/APIConfig'
import { useLiquidGlass } from '../hooks/useLiquidGlass'
import { useWallpaperStore } from '../store/useWallpaperStore'

export function AIPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">✨ AI 总结</h1>
      <p className="text-sm text-white/60 mb-4">
        让 AI 帮你整理日记和长文本
      </p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5 mb-4">
        <AISummary />
      </div>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5">
        <APIConfig />
      </div>
    </div>
  )
}

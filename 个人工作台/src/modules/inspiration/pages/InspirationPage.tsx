// 灵感独立页面
import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { InspirationSection } from './InspirationSection'

export function InspirationPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper?.type === 'url' || wallpaper?.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  return (
    <div className="max-w-[960px] mx-auto px-4 py-8">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6">每日灵感</h2>
      <InspirationSection registerPanel={registerPanel} />
    </div>
  )
}

// 日记页面
import { DiaryList } from '../components/diary/DiaryList'
import { DiaryEditor } from '../components/diary/DiaryEditor'
import { useLiquidGlass } from '../hooks/useLiquidGlass'
import { useWallpaperStore } from '../store/useWallpaperStore'

export function DiaryPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">我的日记</h1>
      <p className="text-sm text-white/60 mb-4">
        记录思考、感悟与生活
      </p>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-180px)]">
        <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="overflow-auto rounded-2xl p-4">
          <DiaryList />
        </div>
        <div ref={(el) => registerPanel(el, { cornerRadius: 16 })} className="overflow-auto rounded-2xl p-5">
          <DiaryEditor />
        </div>
      </div>
    </div>
  )
}

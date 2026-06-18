// 日记页面
// 给 AI 的话：引用现有组件，确保不破坏现有功能

import { DiaryList } from '../../../components/diary/DiaryList'
import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { useDiaryStore } from '../../../store/useDiaryStore'
import { useEffect } from 'react'

export function DiaryPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)
  const loadDiaries = useDiaryStore(s => s.loadDiaries)

  // 加载日记数据
  useEffect(() => {
    loadDiaries()
  }, [loadDiaries])

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">日记</h1>
      <p className="text-sm text-white/60 mb-4">
        记录生活与心情的日记本
      </p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5">
        <DiaryList />
      </div>
    </div>
  )
}

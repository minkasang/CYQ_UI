// AI助手页面
// 给 AI 的话：AI功能页面占位符，待后续实现

import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'

export function AIPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">AI助手</h1>
      <p className="text-sm text-white/60 mb-4">
        多模型AI助手，支持对话、图片生成、视频生成
      </p>
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-5">
        <div className="text-center text-white/60 py-10">
          <p>AI助手功能开发中...</p>
          <p className="text-sm mt-2">敬请期待</p>
        </div>
      </div>
    </div>
  )
}

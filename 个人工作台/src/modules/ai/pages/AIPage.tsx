// AI助手页面
import { useLiquidGlass } from '../../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../../store/useWallpaperStore'
import { ChatPanel } from '../../../components/chat/ChatPanel'
import { AISummary } from '../../../components/ai/AISummary'

export function AIPage() {
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">AI 助手</h1>

      {/* AI 总结 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-4">
        <AISummary />
      </div>

      {/* 聊天 */}
      <div ref={(el) => registerPanel(el, { cornerRadius: 20 })} className="rounded-2xl p-4">
        <ChatPanel />
      </div>
    </div>
  )
}

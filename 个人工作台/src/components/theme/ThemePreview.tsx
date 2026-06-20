// 主题预览组件 — 模拟窗口展示引擎效果
import { useEffect, useRef } from 'react'
import { useLiquidGlass } from '../../hooks/useLiquidGlass'
import { useWallpaperStore } from '../../store/useWallpaperStore'
import type { ThemePreset } from '../../store/useThemePresetStore'

interface ThemePreviewProps {
  preset: ThemePreset | null
}

export function ThemePreview({ preset }: ThemePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const card1Ref = useRef<HTMLDivElement>(null)
  const card2Ref = useRef<HTMLDivElement>(null)

  // 使用当前实际壁纸 URL（不是预设里存的渐变/颜色）
  const currentWallpaper = useWallpaperStore(s => s.current)
  const wallpaperUrl = currentWallpaper?.type === 'url' || currentWallpaper?.type === 'local'
    ? currentWallpaper.value
    : undefined

  const { registerPanel } = useLiquidGlass(wallpaperUrl)

  useEffect(() => {
    if (!preset || preset.engine !== 'liquid-glass') return
    const w = windowRef.current
    const c1 = card1Ref.current
    const c2 = card2Ref.current
    if (w) registerPanel(w, { cornerRadius: (preset.params.cornerRadius as number) || 16 })
    if (c1) registerPanel(c1, { cornerRadius: (preset.params.cornerRadius as number) || 12 })
    if (c2) registerPanel(c2, { cornerRadius: Math.max(((preset.params.cornerRadius as number) || 12) - 4, 4) })
  }, [preset, registerPanel])

  if (!preset) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-[var(--text-tertiary)]">选择一个主题以预览</p>
      </div>
    )
  }

  const isGlass = preset.engine === 'liquid-glass'
  const cr = (preset.params.cornerRadius as number) || 16

  return (
    <div ref={containerRef} className="h-full flex flex-col items-center justify-center p-8 relative">
      {/* 模拟窗口 */}
      <div
        ref={windowRef}
        className="w-full max-w-[320px] rounded-xl overflow-hidden backdrop-blur-sm"
        style={{
          background: isGlass ? 'rgba(0,0,0,0.25)' : 'rgba(22,33,62,0.70)',
          border: isGlass ? 'none' : `${preset.params.borderWidth || 1}px solid rgba(255,255,255,${preset.params.borderOpacity || 0.08})`,
          borderRadius: `${cr}px`,
          boxShadow: isGlass
            ? `0 0 0 0.5px rgba(255,255,255,0.05), 0 ${preset.params.shadowOffsetY || 1}px ${(preset.params.shadowSpread as number) || 10}px rgba(0,0,0,${preset.params.shadowOpacity || 0.3})`
            : `0 ${preset.params.shadowSize || 4}px ${(preset.params.shadowSize as number) * 3 || 12}px rgba(0,0,0,${preset.params.shadowOpacity || 0.08})`,
        }}
      >
        {/* 标题栏 */}
        <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FEBC2E' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
          <span className="text-[10px] text-white/30 ml-2" style={{ fontFamily: preset.fontFamily }}>
            预览窗口
          </span>
        </div>

        {/* 内容区 */}
        <div className="p-4 space-y-3">
          {/* 玻璃卡片1 */}
          <div
            ref={card1Ref}
            className="p-4"
            style={{
              borderRadius: `${cr}px`,
              fontFamily: preset.fontFamily,
              fontSize: `${preset.fontSize}px`,
              background: isGlass ? undefined : 'rgba(255,255,255,0.05)',
            }}
          >
            {isGlass ? (
              <>
                <div className="text-sm font-medium text-white/90 mb-1">示例标题</div>
                <div className="text-xs text-white/50">
                  这是液态玻璃效果预览。圆角 {cr}px · 折射率 {(preset.params.refraction as number)?.toFixed(2)}
                </div>
              </>
            ) : (
              <div className="flat-panel p-3" style={{ borderRadius: `${cr}px` }}>
                <div className="text-sm font-medium text-white/90 mb-1">示例标题</div>
                <div className="text-xs text-white/50">
                  扁平主题 · 边框 {(preset.params.borderWidth as number)}px · 圆角 {cr}px
                </div>
              </div>
            )}
          </div>

          {/* 玻璃卡片2 */}
          <div
            ref={card2Ref}
            className="p-3 flex items-center gap-3"
            style={{
              borderRadius: `${Math.max(cr - 4, 4)}px`,
              fontFamily: preset.fontFamily,
              fontSize: `${preset.fontSize}px`,
              background: isGlass ? undefined : 'rgba(255,255,255,0.03)',
            }}
          >
            {isGlass ? (
              <>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
                  📋
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white/70">待办事项</div>
                  <div className="text-[10px] text-white/40">今日 5 项 · 完成 3 项</div>
                </div>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center text-sm">
                  📋
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white/70">待办事项</div>
                  <div className="text-[10px] text-white/40">今日 5 项 · 完成 3 项</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

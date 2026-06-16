// WebGL 液态玻璃 Demo（看板方案）
import { useState } from 'react'
import { useLiquidGlass } from '../hooks/useLiquidGlass'
import { useWallpaperStore } from '../store/useWallpaperStore'

export function DemoPage() {
  const [count, setCount] = useState(0)
  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined
  const { registerPanel } = useLiquidGlass(bgUrl)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-10 p-10"
      style={{
        backgroundColor: '#0f0c29',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
          radial-gradient(circle at 15% 30%, rgba(255, 50, 100, 0.45) 0%, transparent 55%),
          radial-gradient(circle at 85% 20%, rgba(50, 200, 255, 0.4) 0%, transparent 50%),
          radial-gradient(circle at 70% 75%, rgba(150, 50, 255, 0.4) 0%, transparent 55%),
          radial-gradient(circle at 30% 80%, rgba(255, 200, 50, 0.35) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(0, 255, 180, 0.15) 0%, transparent 60%),
          linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)
        `,
        backgroundSize: '60px 60px, 60px 60px, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%',
      }}
    >
      <h1 className="text-white text-2xl mb-5">WebGL Liquid Glass Demo</h1>

      <div
        ref={(el) => registerPanel(el, { cornerRadius: 999 })}
        className="rounded-full px-8 py-6 cursor-pointer text-white text-center"
        onClick={() => setCount(c => c + 1)}
      >
        点击我 ({count})
      </div>

      <div
        ref={(el) => registerPanel(el, { cornerRadius: 24 })}
        className="rounded-3xl p-8 text-white text-center w-96"
      >
        <h2 className="text-xl mb-2">大卡片</h2>
        <p className="text-sm opacity-80">鼠标放上来试试</p>
      </div>

      <div
        ref={(el) => registerPanel(el, { cornerRadius: 16 })}
        className="rounded-2xl p-4 text-white text-center w-36"
      >
        小卡片
      </div>

      <a href="/" className="text-white opacity-60 mt-10">← 返回工作台</a>
    </div>
  )
}

// 全局背景
// 给 AI 的话：渲染当前壁纸（图片/渐变/纯色）

import { useWallpaperStore } from '../../store/useWallpaperStore'

export function GlobalBackground() {
  const current = useWallpaperStore(s => s.current)

  // 根据壁纸类型生成 CSS 背景
  const getBackground = (): string => {
    switch (current.type) {
      case 'url':
      case 'local':
        return `url(${current.value}) center/cover no-repeat fixed`
      case 'color':
        return current.value
      case 'gradient':
        return current.value
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }

  return (
    <>
      {/* 主背景 */}
      <div
        className="fixed inset-0 -z-10"
        style={{ background: getBackground() }}
      />
      {/* 暗化遮罩（提升文字可读性，Apple 风格） */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%)',
        }}
      />
    </>
  )
}

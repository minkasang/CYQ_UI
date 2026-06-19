// 全局背景
// 给 AI 的话：渲染当前壁纸（图片/渐变/纯色），含可调节暗化遮罩

import { useEffect } from 'react'
import { useWallpaperStore } from '../../store/useWallpaperStore'

export function GlobalBackground() {
  const current = useWallpaperStore(s => s.current)

  // 初始化暗化遮罩值（从 localStorage 恢复）
  useEffect(() => {
    const overlay = localStorage.getItem('pw-overlay-opacity')
    if (overlay) document.documentElement.style.setProperty('--overlay-opacity', overlay)
    const brightness = localStorage.getItem('pw-text-brightness')
    if (brightness) document.documentElement.style.setProperty('--text-brightness', brightness)
    const color = localStorage.getItem('pw-text-color')
    if (color) document.documentElement.style.setProperty('--text-color', color)
  }, [])

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
      {/* 暗化遮罩（提升文字可读性，可调节） */}
      <div
        className="fixed inset-0 -z-10"
        id="global-dark-overlay"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,0,0,var(--overlay-opacity, 0.2)) 0%, rgba(0,0,0,calc(var(--overlay-opacity, 0.2) + 0.3)) 100%)',
        }}
      />
    </>
  )
}

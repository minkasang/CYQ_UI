// 标准玻璃面板
// 给 AI 的话：简化版玻璃效果（不依赖 liquid-glass-react），作为 fallback
// 使用纯 CSS backdrop-filter 实现，兼容性更好

import type { CSSProperties, ReactNode, MouseEventHandler } from 'react'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  onClick?: MouseEventHandler<HTMLDivElement>
  cornerRadius?: number
  blurAmount?: number
  padding?: string
  // 是否显示边框
  bordered?: boolean
}

// 简化版玻璃面板：纯 CSS 实现，无 SVG 滤镜
// 用于液体玻璃不适用时（如 Firefox）的降级方案
export function GlassPanel({
  children,
  className = '',
  style,
  onClick,
  cornerRadius = 16,
  blurAmount = 12,
  padding = '20px',
  bordered = true,
}: GlassPanelProps) {
  const panelStyle: CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: `blur(${blurAmount}px) saturate(140%)`,
    WebkitBackdropFilter: `blur(${blurAmount}px) saturate(140%)`,
    borderRadius: `${cornerRadius}px`,
    border: bordered ? '1px solid rgba(255, 255, 255, 0.15)' : 'none',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
    padding,
    cursor: onClick ? 'pointer' : 'default',
    color: 'rgba(255, 255, 255, 0.95)',
    ...style,
  }

  return (
    <div className={className} style={panelStyle} onClick={onClick}>
      {children}
    </div>
  )
}

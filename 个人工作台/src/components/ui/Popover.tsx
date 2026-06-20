// Popover — 统一下拉弹出组件
// macOS 风格玻璃面板 + 点击外部自动关闭 + 智能方向 + ESC 关闭
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

interface PopoverProps {
  /** 触发器元素 */
  trigger: ReactNode
  /** 弹出内容 */
  children: ReactNode
  /** 受控模式：外部控制开关 */
  open?: boolean
  /** 受控模式：开关回调 */
  onOpenChange?: (open: boolean) => void
  /** 水平对齐：left | right | center，默认 left */
  align?: 'left' | 'right' | 'center'
  /** 最小宽度，默认不设 */
  minWidth?: number | string
  /** 最大高度，默认 320px */
  maxHeight?: number | string
  /** 额外 className */
  className?: string
}

export function Popover({
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  align = 'left',
  minWidth,
  maxHeight = 320,
  className = '',
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen

  const setOpen = useCallback((v: boolean) => {
    if (!isControlled) setInternalOpen(v)
    onOpenChange?.(v)
  }, [isControlled, onOpenChange])

  // 点击外部关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    // 用 mousedown 而非 click，避免与其他事件冲突
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, setOpen])

  // ESC 关闭
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, setOpen])

  // 打开时判断方向
  useEffect(() => {
    if (!open) return
    requestAnimationFrame(() => {
      const container = containerRef.current
      const panel = panelRef.current
      if (!container || !panel) return
      const rect = container.getBoundingClientRect()
      const panelHeight = panel.offsetHeight || 200
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setDropUp(spaceBelow < panelHeight && spaceAbove > spaceBelow)
    })
  }, [open])

  const toggle = () => setOpen(!open)

  const alignClass = align === 'right' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0'

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div onClick={toggle} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          ref={panelRef}
          className={`absolute z-50 rounded-xl border border-white/[0.08] shadow-2xl shadow-black/40 ring-1 ring-white/[0.04] animate-popover ${alignClass} ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{
            background: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            minWidth: minWidth,
            maxHeight: maxHeight,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  )
}

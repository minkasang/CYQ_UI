// 品牌化 Select 下拉组件（智能方向 + 溢出滚动）
import { useState, useRef, useEffect, useCallback } from 'react'
import { CaretDown } from '@phosphor-icons/react'

interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  placeholder?: string
  className?: string
}

export function Select<T extends string>({ value, onChange, options, placeholder, className = '' }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 打开时判断方向
  const toggle = useCallback(() => {
    if (open) { setOpen(false); return }
    setOpen(true)
    // 下一帧测量位置
    requestAnimationFrame(() => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const listHeight = Math.min(options.length * 36 + 8, 260) // 估算列表高度
      setDropUp(spaceBelow < listHeight && rect.top > listHeight)
    })
  }, [open, options.length])

  const current = options.find(o => o.value === value)

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/[0.06] text-sm text-[var(--text-primary)] border border-[var(--border-subtle)] hover:border-[var(--border-hairline)] transition-colors"
      >
        <span className={current ? '' : 'text-[var(--text-tertiary)]'}>
          {current?.label ?? placeholder ?? '请选择'}
        </span>
        <CaretDown size={14} className={`text-[var(--text-tertiary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          ref={listRef}
          className={`absolute z-50 w-full rounded-lg bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 ring-1 ring-white/[0.04] ${
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          <div className="max-h-[260px] overflow-y-auto py-1 rounded-lg">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  opt.value === value
                    ? 'bg-[var(--accent)]/20 text-[var(--accent)]'
                    : 'text-[var(--text-secondary)] hover:bg-white/[0.06]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

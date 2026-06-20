// 基础字号滑块组件（自管理 localStorage）
import { useState } from 'react'

export function FontSizeSlider() {
  const [size, setSize] = useState(() => {
    const s = parseFloat(localStorage.getItem('pw-font-size') || '13')
    return isNaN(s) ? 13 : s
  })

  const apply = (v: number) => {
    setSize(v)
    localStorage.setItem('pw-font-size', String(v))
    document.documentElement.style.fontSize = `${v}px`
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[var(--text-secondary)] tracking-wide">基础字号</span>
        <div className="flex items-center gap-2">
          <button onClick={() => apply(Math.max(10, size - 1))}
            className="text-xs px-2 py-0.5 rounded-md bg-white/[0.06] text-[var(--text-tertiary)] hover:bg-white/[0.10] hover:text-[var(--text-secondary)] transition active:scale-[0.98]">−</button>
          <input type="number" min={10} max={20} value={size}
            onChange={e => { const v = parseFloat(e.target.value); if (!isNaN(v)) apply(Math.min(20, Math.max(10, v))) }}
            className="w-[42px] text-center text-xs text-[var(--text-secondary)] font-mono bg-white/[0.04] border border-[var(--border-subtle)] rounded-md px-1 py-0.5 outline-none focus:border-[var(--accent)]" />
          <button onClick={() => apply(Math.min(20, size + 1))}
            className="text-xs px-2 py-0.5 rounded-md bg-white/[0.06] text-[var(--text-tertiary)] hover:bg-white/[0.10] hover:text-[var(--text-secondary)] transition active:scale-[0.98]">+</button>
          <span className="text-[11px] text-[var(--text-tertiary)]">px</span>
        </div>
      </div>
      <input type="range" min={10} max={20} step={1} value={size}
        onChange={e => apply(Number(e.target.value))}
        className="w-full h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:cursor-pointer" />
      <p className="text-[11px] text-[var(--text-tertiary)] mt-1.5">macOS 默认 13px · 范围 10-20px</p>
    </div>
  )
}

// 初始化字号（在 App 入口调用）
export function initFontSize() {
  const saved = localStorage.getItem('pw-font-size')
  if (saved) document.documentElement.style.fontSize = `${saved}px`
}

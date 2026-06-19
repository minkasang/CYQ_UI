// 文字颜色调节面板 — 预设色 + 自定义

import { useState } from 'react'

// macOS 推荐文字色预设
const PRESETS = [
  { name: '纯白', rgb: '255,255,255' },
  { name: '暖白', rgb: '255,248,240' },
  { name: '奶油', rgb: '255,244,220' },
  { name: '浅金', rgb: '255,235,190' },
  { name: '冰蓝', rgb: '220,240,255' },
  { name: '浅绿', rgb: '220,255,235' },
  { name: '浅紫', rgb: '240,225,255' },
  { name: '浅粉', rgb: '255,225,235' },
  { name: '月光', rgb: '235,240,255' },
  { name: '晨曦', rgb: '255,245,230' },
]

function rgbToHex(rgb: string) {
  return '#' + rgb.split(',').map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
}

function applyColor(rgb: string) {
  localStorage.setItem('pw-text-color', rgb)
  const styleId = 'pw-text-color-style'
  let el = document.getElementById(styleId) as HTMLStyleElement
  if (!el) {
    el = document.createElement('style')
    el.id = styleId
    document.head.appendChild(el)
  }
  el.textContent = `
    .text-white, .text-white\\/90, .text-white\\/80, .text-white\\/70,
    .text-white\\/60, .text-white\\/50, .text-white\\/40, .text-white\\/30,
    .text-white\\/20 {
      color: rgba(${rgb}, var(--tw-text-opacity, 1)) !important;
    }
  `
}

interface Props {
  inline?: boolean
}

export function TextColorPanel({ inline }: Props) {
  const [color, setColor] = useState(() => localStorage.getItem('pw-text-color') || '255,255,255')

  const handleChange = (rgb: string) => {
    setColor(rgb)
    applyColor(rgb)
  }

  const hex = rgbToHex(color)
  const isCustom = !PRESETS.some(p => p.rgb === color)

  return (
    <div className="space-y-3">
      {inline && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/50">选择文字颜色预设或自定义</span>
        </div>
      )}

      {/* 预设色块 */}
      <div className="grid grid-cols-5 gap-1.5">
        {PRESETS.map(p => {
          const active = p.rgb === color
          return (
            <button
              key={p.name}
              onClick={() => handleChange(p.rgb)}
              className="relative flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-colors"
              style={{
                background: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: active ? '2px solid #0A84FF' : '2px solid transparent',
              }}
              title={p.name}
            >
              <span className="w-5 h-5 rounded-full border border-white/20"
                style={{ background: `rgb(${p.rgb})` }} />
              <span className="text-[9px] text-white/50">{p.name}</span>
            </button>
          )
        })}
      </div>

      {/* 自定义色盘 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/40">自定义</span>
        <input
          type="color"
          value={hex}
          onChange={e => {
            const h = e.target.value
            const r = parseInt(h.slice(1, 3), 16)
            const g = parseInt(h.slice(3, 5), 16)
            const b = parseInt(h.slice(5, 7), 16)
            handleChange(`${r},${g},${b}`)
          }}
          className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
        />
        <span className="text-[10px] text-white/40 font-mono">{hex}</span>
        {isCustom && <span className="text-[9px] text-white/30">· 自定义</span>}
      </div>
    </div>
  )
}

// 页面加载时恢复文字颜色
export function initTextColor() {
  const saved = localStorage.getItem('pw-text-color')
  if (saved && saved !== '255,255,255') {
    applyColor(saved)
  }
}

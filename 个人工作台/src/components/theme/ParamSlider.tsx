// 通用参数滑块 — 供主题配置面板使用
import type { ParamDef } from '../../types/theme'

interface ParamSliderProps {
  def: ParamDef
  value: number | boolean
  onChange: (key: string, value: number | boolean) => void
}

export function ParamSlider({ def, value, onChange }: ParamSliderProps) {
  if (def.type === 'toggle') {
    return (
      <div className="flex items-center justify-between py-1.5">
        <span className="text-xs text-[var(--text-secondary)]">{def.label}</span>
        <button
          onClick={() => onChange(def.key, !value)}
          className={`w-8 h-[18px] rounded-full transition-colors duration-150 relative ${
            value ? 'bg-[var(--accent)]' : 'bg-white/[0.12]'
          }`}
        >
          <span
            className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-150 ${
              value ? 'left-[calc(100%-16px)]' : 'left-[2px]'
            }`}
          />
        </button>
      </div>
    )
  }

  const numValue = typeof value === 'number' ? value : def.defaultValue as number
  const min = def.min ?? 0
  const max = def.max ?? 100
  const step = def.step ?? 1
  const pct = ((numValue - min) / (max - min)) * 100

  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--text-secondary)]">{def.label}</span>
        <span className="text-[11px] text-[var(--text-tertiary)] font-mono tabular-nums">
          {step < 1 ? numValue.toFixed(2) : numValue}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={numValue}
        onChange={e => onChange(def.key, parseFloat(e.target.value))}
        className="w-full h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-[var(--accent)] [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-sm"
        style={{
          background: `linear-gradient(to right, var(--accent) 0%, var(--accent) ${pct}%, rgba(255,255,255,0.08) ${pct}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />
    </div>
  )
}

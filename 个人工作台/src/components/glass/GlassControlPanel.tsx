// 玻璃参数调优面板
// 给 AI 的话：参考看板项目的 🎛 调参功能，用户可实时调节

import { useSettingsStore } from '../../store/useSettingsStore'
import { GlassPanel } from './GlassPanel'
import { RotateCcw } from 'lucide-react'
import type { GlassMode } from '../../types'

const MODES: { value: GlassMode; label: string; desc: string }[] = [
  { value: 'standard', label: '标准', desc: '通用，兼容性好' },
  { value: 'polar', label: '极坐标', desc: '圆形，中心扩散' },
  { value: 'prominent', label: '强烈', desc: '凸起明显' },
  { value: 'shader', label: '动态', desc: '着色器计算' },
]

interface GlassControlPanelProps {
  onClose?: () => void
}

export function GlassControlPanel({ onClose }: GlassControlPanelProps) {
  const glass = useSettingsStore(s => s.settings.glass)
  const setGlass = useSettingsStore(s => s.setGlass)
  const resetGlass = useSettingsStore(s => s.resetGlass)

  return (
    <GlassPanel
      cornerRadius={20}
      blurAmount={20}
      padding="20px"
      style={{
        position: 'fixed',
        top: 80,
        right: 20,
        width: 320,
        maxHeight: 'calc(100vh - 100px)',
        overflow: 'auto',
        zIndex: 100,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">🎛 玻璃调参</h3>
        <div className="flex gap-2">
          <button
            onClick={resetGlass}
            className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80"
            title="重置为默认"
          >
            <RotateCcw size={12} className="inline mr-1" />重置
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 模式选择 */}
      <div className="mb-4">
        <label className="text-xs text-white/70 mb-1.5 block">变形模式</label>
        <div className="grid grid-cols-4 gap-1.5">
          {MODES.map(m => (
            <button
              key={m.value}
              onClick={() => setGlass({ mode: m.value })}
              className={`text-xs py-1.5 px-1 rounded transition ${
                glass.mode === m.value
                  ? 'bg-blue-500/40 text-white border border-blue-400/50'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 border border-transparent'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* 滑块参数 */}
      <div className="space-y-3">
        <ParamSlider
          label="变形强度"
          value={glass.displacementScale}
          min={0}
          max={200}
          step={1}
          onChange={v => setGlass({ displacementScale: v })}
        />
        <ParamSlider
          label="模糊程度"
          value={glass.blurAmount}
          min={0}
          max={2}
          step={0.05}
          onChange={v => setGlass({ blurAmount: v })}
        />
        <ParamSlider
          label="饱和度"
          value={glass.saturation}
          min={0}
          max={300}
          step={5}
          onChange={v => setGlass({ saturation: v })}
        />
        <ParamSlider
          label="色差强度"
          value={glass.aberrationIntensity}
          min={0}
          max={10}
          step={0.5}
          onChange={v => setGlass({ aberrationIntensity: v })}
        />
        <ParamSlider
          label="弹性系数"
          value={glass.elasticity}
          min={0}
          max={1}
          step={0.05}
          onChange={v => setGlass({ elasticity: v })}
        />
        <ParamSlider
          label="圆角半径"
          value={glass.cornerRadius}
          min={0}
          max={50}
          step={1}
          onChange={v => setGlass({ cornerRadius: v })}
        />
      </div>

      <p className="text-xs text-white/50 mt-4 leading-relaxed">
        💡 提示：参数自动保存到本地。Safari/Firefox 下位移效果不可见，自动降级为毛玻璃。
      </p>
    </GlassPanel>
  )
}

interface ParamSliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

function ParamSlider({ label, value, min, max, step, onChange }: ParamSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/80">{label}</span>
        <span className="text-xs text-white/60 font-mono">{value.toFixed(step < 1 ? 2 : 0)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-3
          [&::-webkit-slider-thumb]:h-3
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-400
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-moz-range-thumb]:w-3
          [&::-moz-range-thumb]:h-3
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-blue-400
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer"
      />
    </div>
  )
}

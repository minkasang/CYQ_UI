// 液态玻璃参数调优面板
// 给 AI 的话：实时调节液态玻璃的所有参数，参考 liquid-glass.ts 中的 DEFAULTS

import { useSettingsStore } from '../../store/useSettingsStore'
import { RotateCcw } from 'lucide-react'
import type { LiquidGlass } from '../../lib/liquid-glass'

interface GlassControlPanelProps {
  onClose?: () => void
}

// 获取全局 LiquidGlass 实例
function getLG(): LiquidGlass | undefined {
  return (window as any).__lg
}

export function GlassControlPanel({ onClose }: GlassControlPanelProps) {
  const glass = useSettingsStore(s => s.settings.glass)
  const setGlass = useSettingsStore(s => s.setGlass)
  const resetGlass = useSettingsStore(s => s.resetGlass)

  // 更新参数并实时应用到玻璃面板
  const updateParam = (key: string, value: number) => {
    setGlass({ [key]: value } as any)
    // 立即应用到所有面板
    const lg = getLG()
    if (lg) {
      lg.updateConfig({ [key]: value } as any)
    }
  }

  // 重置参数
  const handleReset = () => {
    resetGlass()
    // 立即应用到所有面板
    const lg = getLG()
    if (lg) {
      lg.updateConfig(useSettingsStore.getState().settings.glass)
    }
  }

  return (
    <div
      className="fixed top-20 right-4 w-80 max-h-[calc(100vh-120px)] overflow-auto rounded-2xl p-5 z-50"
      style={{
        background: 'rgba(30, 30, 40, 0.85)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-white">🎛 液态玻璃调参</h3>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
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

      {/* 核心光学参数 */}
      <div className="mb-4">
        <h4 className="text-xs text-white/50 mb-2 uppercase tracking-wider">核心光学</h4>
        <div className="space-y-2">
          <ParamSlider label="折射强度" value={glass.refraction} min={0} max={2} step={0.01} onChange={v => updateParam('refraction', v)} />
          <ParamSlider label="色散 (色差)" value={glass.chromAberration} min={0} max={0.5} step={0.01} onChange={v => updateParam('chromAberration', v)} />
          <ParamSlider label="菲涅尔 (边缘反光)" value={glass.fresnel} min={0} max={3} step={0.01} onChange={v => updateParam('fresnel', v)} />
          <ParamSlider label="高光强度" value={glass.specular} min={0} max={2} step={0.01} onChange={v => updateParam('specular', v)} />
        </div>
      </div>

      {/* 外观参数 */}
      <div className="mb-4">
        <h4 className="text-xs text-white/50 mb-2 uppercase tracking-wider">外观</h4>
        <div className="space-y-2">
          <ParamSlider label="圆角半径" value={glass.cornerRadius} min={0} max={100} step={1} onChange={v => updateParam('cornerRadius', v)} />
          <ParamSlider label="Z轴厚度 (立体感)" value={glass.zRadius} min={0} max={100} step={1} onChange={v => updateParam('zRadius', v)} />
          <ParamSlider label="不透明度" value={glass.opacity} min={0} max={1} step={0.01} onChange={v => updateParam('opacity', v)} />
        </div>
      </div>

      {/* 颜色调整 */}
      <div className="mb-4">
        <h4 className="text-xs text-white/50 mb-2 uppercase tracking-wider">颜色</h4>
        <div className="space-y-2">
          <ParamSlider label="饱和度" value={glass.saturation} min={-1} max={1} step={0.01} onChange={v => updateParam('saturation', v)} />
          <ParamSlider label="亮度" value={glass.brightness} min={-1} max={1} step={0.01} onChange={v => updateParam('brightness', v)} />
          <ParamSlider label="色调强度" value={glass.tintStrength} min={0} max={1} step={0.01} onChange={v => updateParam('tintStrength', v)} />
        </div>
      </div>

      {/* 阴影参数 */}
      <div className="mb-4">
        <h4 className="text-xs text-white/50 mb-2 uppercase tracking-wider">阴影</h4>
        <div className="space-y-2">
          <ParamSlider label="阴影透明度" value={glass.shadowOpacity} min={0} max={1} step={0.01} onChange={v => updateParam('shadowOpacity', v)} />
          <ParamSlider label="阴影扩散" value={glass.shadowSpread} min={0} max={40} step={1} onChange={v => updateParam('shadowSpread', v)} />
          <ParamSlider label="阴影垂直偏移" value={glass.shadowOffsetY} min={-20} max={20} step={1} onChange={v => updateParam('shadowOffsetY', v)} />
        </div>
      </div>

      {/* 其他效果 */}
      <div className="mb-4">
        <h4 className="text-xs text-white/50 mb-2 uppercase tracking-wider">其他</h4>
        <div className="space-y-2">
          <ParamSlider label="背景模糊" value={glass.blurAmount} min={0} max={30} step={0.5} onChange={v => updateParam('blurAmount', v)} />
          <ParamSlider label="扭曲/噪点" value={glass.distortion} min={0} max={1} step={0.01} onChange={v => updateParam('distortion', v)} />
          <ParamSlider label="边缘高亮" value={glass.edgeHighlight} min={0} max={1} step={0.01} onChange={v => updateParam('edgeHighlight', v)} />
        </div>
      </div>

      <p className="text-xs text-white/50 mt-4 leading-relaxed">
        💡 提示：拖动滑块实时预览效果，参数自动保存。
      </p>
    </div>
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
  const decimals = step < 1 ? 2 : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-white/80">{label}</span>
        <span className="text-xs text-white/60 font-mono">{value.toFixed(decimals)}</span>
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

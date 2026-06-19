// 液态玻璃参数调优面板
// inline 模式：设置页内嵌；弹窗模式：TopBar 触发

import { useSettingsStore } from '../../store/useSettingsStore'
import { getGlobalLG } from '../../hooks/useLiquidGlass'
import { RotateCcw, X } from 'lucide-react'
import { GlassPanel } from './GlassPanel'

interface Props {
  onClose?: () => void
  inline?: boolean
}

export function GlassControlPanel({ onClose, inline }: Props) {
  const glass = useSettingsStore(s => s.settings.glass)
  const setGlass = useSettingsStore(s => s.setGlass)
  const resetGlass = useSettingsStore(s => s.resetGlass)

  const updateParam = (key: string, value: number) => {
    setGlass({ [key]: value } as any)
    getGlobalLG()?.updateConfig({ [key]: value } as any)
  }
  const handleReset = () => {
    resetGlass()
    getGlobalLG()?.updateConfig(useSettingsStore.getState().settings.glass)
  }

  // 内嵌模式 — 设置页直接显示
  if (inline) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/50">实时调节，参数自动保存</span>
          <button onClick={handleReset}
            className="text-[11px] px-2 py-1 rounded transition-colors"
            style={{ color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.06)' }}>
            <RotateCcw size={11} className="inline mr-1" />重置
          </button>
        </div>
        <SliderGroups glass={glass} updateParam={updateParam} />
      </div>
    )
  }

  // 弹窗模式
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <GlassPanel cornerRadius={16} padding="20px" className="relative w-80 max-h-[calc(100vh-120px)] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">🎛 液态玻璃调参</h3>
          <div className="flex gap-2">
            <button onClick={handleReset} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80">
              <RotateCcw size={12} className="inline mr-1" />重置
            </button>
            {onClose && <button onClick={onClose} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-white/80"><X size={12} /></button>}
          </div>
        </div>
        <SliderGroups glass={glass} updateParam={updateParam} />
        <p className="text-xs text-white/50 mt-4">💡 拖动滑块实时预览，参数自动保存。</p>
      </GlassPanel>
    </div>
  )
}

// 滑块组
function SliderGroups({ glass, updateParam }: { glass: any; updateParam: (k: string, v: number) => void }) {
  return (
    <>
      <SliderSection title="核心光学">
        <ParamSlider label="折射强度" value={glass.refraction} min={0} max={2} step={0.01} onChange={v => updateParam('refraction', v)} />
        <ParamSlider label="色散" value={glass.chromAberration} min={0} max={0.5} step={0.01} onChange={v => updateParam('chromAberration', v)} />
        <ParamSlider label="菲涅尔" value={glass.fresnel} min={0} max={3} step={0.01} onChange={v => updateParam('fresnel', v)} />
        <ParamSlider label="高光强度" value={glass.specular} min={0} max={2} step={0.01} onChange={v => updateParam('specular', v)} />
      </SliderSection>
      <SliderSection title="外观">
        <ParamSlider label="圆角半径" value={glass.cornerRadius} min={0} max={100} step={1} onChange={v => updateParam('cornerRadius', v)} />
        <ParamSlider label="Z轴厚度" value={glass.zRadius} min={0} max={100} step={1} onChange={v => updateParam('zRadius', v)} />
        <ParamSlider label="不透明度" value={glass.opacity} min={0} max={1} step={0.01} onChange={v => updateParam('opacity', v)} />
      </SliderSection>
      <SliderSection title="颜色">
        <ParamSlider label="饱和度" value={glass.saturation} min={-1} max={1} step={0.01} onChange={v => updateParam('saturation', v)} />
        <ParamSlider label="亮度" value={glass.brightness} min={-1} max={1} step={0.01} onChange={v => updateParam('brightness', v)} />
        <ParamSlider label="色调强度" value={glass.tintStrength} min={0} max={1} step={0.01} onChange={v => updateParam('tintStrength', v)} />
      </SliderSection>
      <SliderSection title="阴影">
        <ParamSlider label="透明度" value={glass.shadowOpacity} min={0} max={1} step={0.01} onChange={v => updateParam('shadowOpacity', v)} />
        <ParamSlider label="扩散" value={glass.shadowSpread} min={0} max={40} step={1} onChange={v => updateParam('shadowSpread', v)} />
        <ParamSlider label="垂直偏移" value={glass.shadowOffsetY} min={-20} max={20} step={1} onChange={v => updateParam('shadowOffsetY', v)} />
      </SliderSection>
      <SliderSection title="其他">
        <ParamSlider label="模糊" value={glass.blurAmount} min={0} max={10} step={0.1} onChange={v => updateParam('blurAmount', v)} />
        <ParamSlider label="扭曲" value={glass.distortion} min={0} max={1} step={0.01} onChange={v => updateParam('distortion', v)} />
        <ParamSlider label="边缘高亮" value={glass.edgeHighlight} min={0} max={1} step={0.01} onChange={v => updateParam('edgeHighlight', v)} />
      </SliderSection>
    </>
  )
}

function SliderSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <h4 className="text-[10px] text-white/40 mb-1.5 uppercase tracking-wider">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function ParamSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void
}) {
  const d = step < 1 ? 2 : 0
  return (
    <div>
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[11px] text-white/70">{label}</span>
        <span className="text-[10px] text-white/40 font-mono">{value.toFixed(d)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
          [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:cursor-pointer" />
    </div>
  )
}

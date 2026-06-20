// 右侧配置面板 — 引擎参数 + 字体 + 壁纸 + 保存
import { useState, useMemo } from 'react'
import { Save, Download } from 'lucide-react'
import { ParamSlider } from './ParamSlider'
import { FontConfig } from './FontConfig'
import type { ThemePreset } from '../../store/useThemePresetStore'
import { LiquidGlassEngine } from '../../themes/engines/LiquidGlassEngine'
import { FlatThemeEngine } from '../../themes/engines/FlatThemeEngine'
import type { ParamDef } from '../../types/theme'

// 引擎实例缓存（只读参数定义，不需要初始化）
const engineRegistry: Record<string, () => ParamDef[]> = {
  'liquid-glass': () => new LiquidGlassEngine().getParamDefs(),
  'flat': () => new FlatThemeEngine().getParamDefs(),
}

interface ThemeConfigProps {
  preset: ThemePreset | null
  onParamChange: (key: string, value: number | boolean) => void
  onFontChange: (patch: { fontFamily?: string; fontSize?: number }) => void
  onSaveAsNew: () => void
  onExport: () => void
}

export function ThemeConfig({ preset, onParamChange, onFontChange, onSaveAsNew, onExport }: ThemeConfigProps) {
  const [saveName, setSaveName] = useState('')
  const [showSaveInput, setShowSaveInput] = useState(false)

  const paramDefs = useMemo(() => {
    if (!preset) return []
    const getter = engineRegistry[preset.engine]
    return getter ? getter() : []
  }, [preset?.engine])

  if (!preset) {
    return (
      <div className="p-6 text-center text-[var(--text-tertiary)] text-sm">
        选择一个主题以编辑参数
      </div>
    )
  }

  return (
    <div className="p-5 space-y-5 overflow-y-auto h-full">
      {/* 引擎信息 */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-1">引擎</div>
        <div className="text-sm text-[var(--text-primary)] font-medium">
          {preset.engine === 'liquid-glass' ? '液态玻璃' : '暗黑扁平'}
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)]" />

      {/* 引擎参数 */}
      <div>
        <h4 className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-2">引擎参数</h4>
        <div className="space-y-0.5">
          {paramDefs.map(def => (
            <ParamSlider
              key={def.key}
              def={def}
              value={preset.params[def.key] ?? def.defaultValue}
              onChange={onParamChange}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)]" />

      {/* 字体 */}
      <FontConfig
        family={preset.fontFamily}
        size={preset.fontSize}
        onChange={onFontChange}
      />

      <div className="border-t border-[var(--border-subtle)]" />

      {/* 壁纸简要 */}
      <div>
        <h4 className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)] mb-1">壁纸</h4>
        <div className="text-xs text-[var(--text-secondary)] truncate">
          {preset.wallpaper.type}: {preset.wallpaper.value.slice(0, 40)}
        </div>
      </div>

      <div className="border-t border-[var(--border-subtle)]" />

      {/* 操作按钮 */}
      <div className="space-y-2">
        {showSaveInput ? (
          <div className="flex gap-2">
            <input
              autoFocus
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="主题名称..."
              className="flex-1 text-xs bg-white/[0.06] border border-[var(--border-subtle)] rounded-md px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
              onKeyDown={e => {
                if (e.key === 'Enter' && saveName.trim()) {
                  onSaveAsNew()
                  setSaveName('')
                  setShowSaveInput(false)
                }
                if (e.key === 'Escape') {
                  setShowSaveInput(false)
                  setSaveName('')
                }
              }}
            />
            <button
              onClick={() => {
                if (saveName.trim()) {
                  onSaveAsNew()
                  setSaveName('')
                  setShowSaveInput(false)
                }
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition"
            >
              保存
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveInput(true)}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-md bg-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.10] hover:text-[var(--text-primary)] transition border border-[var(--border-subtle)]"
          >
            <Save size={13} /> 保存为新主题
          </button>
        )}

        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 text-xs py-2 rounded-md bg-white/[0.04] text-[var(--text-tertiary)] hover:bg-white/[0.08] hover:text-[var(--text-secondary)] transition"
        >
          <Download size={13} /> 导出 JSON
        </button>
      </div>
    </div>
  )
}

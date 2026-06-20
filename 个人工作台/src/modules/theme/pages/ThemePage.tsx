// 主题管理页面 — 简洁版
// 引擎卡片 + 实时预览 + 预设快捷切换

import { useEffect, useState, useCallback } from 'react'
import { Plus, Check, Trash2 } from 'lucide-react'
import { useThemePresetStore, type ThemePreset } from '../../../store/useThemePresetStore'
import { ThemePreview } from '../../../components/theme/ThemePreview'

type EngineKey = 'liquid-glass' | 'flat'

const ENGINE_INFO: Record<EngineKey, { name: string; icon: string; desc: string }> = {
  'liquid-glass': { name: '液态玻璃', icon: '🪟', desc: 'WebGL 流体玻璃效果，支持折射、模糊、色差等参数' },
  'flat': { name: '暗黑扁平', icon: '📄', desc: '简洁扁平化风格，轻量高性能' },
}

export function ThemePage() {
  const {
    presets, activeId, loaded,
    loadFromFile, addPreset, removePreset,
    setActive, applyPreset,
  } = useThemePresetStore()

  const [selectedEngine, setSelectedEngine] = useState<EngineKey>('liquid-glass')

  useEffect(() => { loadFromFile() }, [loadFromFile])

  const activePreset = presets.find(p => p.id === activeId) || null

  // 选中预设 → 应用
  const handleSelect = useCallback((preset: ThemePreset) => {
    setActive(preset.id)
    applyPreset(preset.id)
    setSelectedEngine(preset.engine as EngineKey)
  }, [setActive, applyPreset])

  // 新建预设（基于当前引擎 + 默认参数）
  const handleCreate = useCallback(() => {
    const builtin = presets.find(p => p.engine === selectedEngine && p.isBuiltin)
    const base = builtin || presets.find(p => p.engine === selectedEngine)
    const name = `自定义${presets.filter(p => p.engine === selectedEngine && !p.isBuiltin).length + 1}`
    const p = addPreset({
      name,
      engine: selectedEngine,
      params: { ...(base?.params || {}) },
      fontFamily: base?.fontFamily || '-apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: base?.fontSize || 13,
      wallpaper: base?.wallpaper || { type: 'color', value: '#0a0a0a' },
    })
    setActive(p.id)
    applyPreset(p.id)
  }, [selectedEngine, presets, addPreset, setActive, applyPreset])

  // 删除预设
  const handleDelete = useCallback((id: string) => {
    const p = presets.find(pr => pr.id === id)
    if (!p || p.isBuiltin) return
    if (confirm(`删除「${p.name}」？`)) removePreset(id)
  }, [presets, removePreset])

  // 按引擎分组
  const enginePresets = (engine: EngineKey) =>
    presets.filter(p => p.engine === engine)

  if (!loaded) {
    return <div className="flex items-center justify-center h-full"><p className="text-sm text-[var(--text-tertiary)]">加载中...</p></div>
  }

  return (
    <div className="max-w-[720px] mx-auto p-6 space-y-8 min-h-full bg-transparent">
      {/* 标题 */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)]">主题</h2>
        <p className="text-sm text-[var(--text-tertiary)] mt-1">选择渲染引擎，切换预设效果</p>
      </div>

      {/* 引擎列表 */}
      {(Object.keys(ENGINE_INFO) as EngineKey[]).map(engine => {
        const info = ENGINE_INFO[engine]
        const enginePresetList = enginePresets(engine)
        const isActive = selectedEngine === engine

        return (
          <div key={engine}>
            {/* 引擎卡片头部 */}
            <button
              onClick={() => setSelectedEngine(engine)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-150 ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent-muted)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-[var(--border-hairline)]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--text-primary)]">{info.name}</div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{info.desc}</div>
                </div>
                {isActive && <Check size={16} className="text-[var(--accent)]" />}
              </div>
            </button>

            {/* 展开后的预览 + 预设列表 */}
            {isActive && (
              <div className="mt-3 ml-2 pl-4 border-l-2 border-[var(--border-subtle)] space-y-3">
                {/* 实时预览 */}
                <div className="rounded-xl overflow-hidden bg-transparent" style={{ height: 200 }}>
                  <ThemePreview preset={activePreset?.engine === engine ? activePreset : enginePresetList[0] || null} />
                </div>

                {/* 预设列表 */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">预设</span>
                    <button
                      onClick={handleCreate}
                      className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:text-[var(--accent-hover)] transition-colors"
                    >
                      <Plus size={12} /> 新建
                    </button>
                  </div>
                  {enginePresetList.map(p => (
                    <div
                      key={p.id}
                      onClick={() => handleSelect(p)}
                      className={`group flex items-center gap-2.5 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
                        activeId === p.id
                          ? 'bg-[var(--accent-muted)] ring-1 ring-[var(--accent)]'
                          : 'hover:bg-white/[0.04]'
                      }`}
                    >
                      <span className="text-sm">
                        {p.isBuiltin ? '📌' : '💾'}
                      </span>
                      <span className="text-xs text-[var(--text-primary)] flex-1 truncate">{p.name}</span>
                      {!p.isBuiltin && (
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(p.id) }}
                          className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  {enginePresetList.length === 0 && (
                    <p className="text-[11px] text-[var(--text-tertiary)] px-3 py-2">暂无预设，点「新建」创建一个</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

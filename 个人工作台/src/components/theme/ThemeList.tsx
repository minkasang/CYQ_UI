// 左侧主题列表 — 内置 + 自定义主题
import { Plus, Trash2, Upload, Lock } from 'lucide-react'
import type { ThemePreset } from '../../store/useThemePresetStore'

interface ThemeListProps {
  presets: ThemePreset[]
  activeId: string | null
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onImport: () => void
  onCreateNew: () => void
}

export function ThemeList({ presets, activeId, onSelect, onDelete, onImport, onCreateNew }: ThemeListProps) {
  const builtins = presets.filter(p => p.isBuiltin)
  const customs = presets.filter(p => !p.isBuiltin)

  return (
    <div className="flex flex-col h-full">
      {/* 标题 */}
      <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
        <h3 className="text-sm font-medium text-[var(--text-primary)]">主题</h3>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{presets.length} 个主题</p>
      </div>

      {/* 列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* 内置 */}
        <div className="px-3 mb-1">
          <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] px-2">内置</span>
        </div>
        {builtins.map(p => (
          <ThemeListItem
            key={p.id}
            preset={p}
            isActive={activeId === p.id}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}

        {/* 自定义 */}
        {customs.length > 0 && (
          <>
            <div className="px-3 mt-3 mb-1">
              <span className="text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)] px-2">自定义</span>
            </div>
            {customs.map(p => (
              <ThemeListItem
                key={p.id}
                preset={p}
                isActive={activeId === p.id}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </>
        )}
      </div>

      {/* 底部操作 */}
      <div className="px-3 py-3 border-t border-[var(--border-subtle)] space-y-1.5">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center gap-2 text-xs py-1.5 px-3 rounded-md bg-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.10] hover:text-[var(--text-primary)] transition"
        >
          <Plus size={13} /> 新建主题
        </button>
        <button
          onClick={onImport}
          className="w-full flex items-center gap-2 text-xs py-1.5 px-3 rounded-md bg-white/[0.04] text-[var(--text-tertiary)] hover:bg-white/[0.08] hover:text-[var(--text-secondary)] transition"
        >
          <Upload size={13} /> 导入 JSON
        </button>
      </div>
    </div>
  )
}

function ThemeListItem({ preset, isActive, onSelect, onDelete }: {
  preset: ThemePreset
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      onClick={() => onSelect(preset.id)}
      className={`group flex items-center gap-2.5 mx-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-[var(--accent-muted)] border-l-[3px] border-l-[var(--accent)]'
          : 'border-l-[3px] border-l-transparent hover:bg-white/[0.04]'
      }`}
    >
      {/* 引擎图标 */}
      <span className="text-sm flex-shrink-0">
        {preset.engine === 'liquid-glass' ? '🪟' : '📄'}
      </span>

      {/* 名称 + 引擎 */}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--text-primary)] truncate">{preset.name}</div>
        <div className="text-[10px] text-[var(--text-tertiary)]">
          {preset.engine === 'liquid-glass' ? '液态玻璃' : '扁平'}
        </div>
      </div>

      {/* 操作 */}
      {preset.isBuiltin ? (
        <Lock size={11} className="text-[var(--text-quaternary)] flex-shrink-0" />
      ) : (
        <button
          onClick={e => { e.stopPropagation(); onDelete(preset.id) }}
          className="opacity-0 group-hover:opacity-100 text-[var(--text-tertiary)] hover:text-red-400 transition-all"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  )
}

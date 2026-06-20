// 字体配置组件
const FONT_OPTIONS = [
  { value: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "PingFang SC", "Microsoft YaHei", sans-serif', label: '系统默认 (SF Pro)' },
  { value: '"Geist", "Geist Fallback", -apple-system, BlinkMacSystemFont, sans-serif', label: 'Geist' },
  { value: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif', label: 'Inter' },
  { value: '"JetBrains Mono", "SF Mono", "Menlo", monospace', label: 'JetBrains Mono' },
]

interface FontConfigProps {
  family: string
  size: number
  onChange: (patch: { fontFamily?: string; fontSize?: number }) => void
}

export function FontConfig({ family, size, onChange }: FontConfigProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-[11px] uppercase tracking-[0.1em] text-[var(--text-tertiary)]">字体</h4>

      {/* Font Family */}
      <div>
        <label className="text-xs text-[var(--text-secondary)] block mb-1">字体栈</label>
        <select
          value={family}
          onChange={e => onChange({ fontFamily: e.target.value })}
          className="w-full text-xs bg-white/[0.04] border border-[var(--border-subtle)] rounded-md px-2 py-1.5 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] appearance-none cursor-pointer"
        >
          {FONT_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Font Size */}
      <div>
        <label className="text-xs text-[var(--text-secondary)] block mb-1">基础字号</label>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange({ fontSize: Math.max(10, size - 1) })}
            className="text-xs w-6 h-6 rounded-md bg-white/[0.06] text-[var(--text-tertiary)] hover:bg-white/[0.10] hover:text-[var(--text-secondary)] transition active:scale-[0.98] flex items-center justify-center"
          >−</button>
          <span className="text-xs text-[var(--text-secondary)] font-mono w-8 text-center">{size}px</span>
          <button
            onClick={() => onChange({ fontSize: Math.min(20, size + 1) })}
            className="text-xs w-6 h-6 rounded-md bg-white/[0.06] text-[var(--text-tertiary)] hover:bg-white/[0.10] hover:text-[var(--text-secondary)] transition active:scale-[0.98] flex items-center justify-center"
          >+</button>
        </div>
      </div>
    </div>
  )
}

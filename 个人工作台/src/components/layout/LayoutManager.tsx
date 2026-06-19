// 布局管理器 — 壳切换 + 导入/导出

import { Layout as LayoutIcon, Upload, Check } from 'lucide-react'
import { useLayoutRegistry } from '../../store/useLayoutRegistry'

export function LayoutManager() {
  const layouts = useLayoutRegistry(s => s.layouts)
  const activeId = useLayoutRegistry(s => s.activeId)
  const setActive = useLayoutRegistry(s => s.setActive)

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-white flex items-center gap-2">
        <LayoutIcon size={16} /> 页面布局
      </h3>
      <p className="text-xs text-white/50">选择页面骨架风格。导入/导出功能后续开放</p>

      {/* 布局网格 */}
      <div className="grid grid-cols-2 gap-2">
        {layouts.map(l => {
          const isActive = l.id === activeId
          return (
            <button
              key={l.id}
              onClick={() => setActive(l.id)}
              className={`text-left rounded-xl p-3 border-2 transition ${
                isActive ? 'border-blue-400 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{l.icon}</span>
                <span className="text-sm text-white">{l.name}</span>
                {isActive && <Check size={14} className="ml-auto text-blue-400" />}
              </div>
              <div className="text-[10px] text-white/40 mt-1">{l.description}</div>
            </button>
          )
        })}
      </div>

      {/* 导入（占位） */}
      <button
        disabled
        className="w-full py-2 rounded-lg border border-dashed border-white/10 text-white/30 transition flex items-center justify-center gap-2 text-sm cursor-not-allowed"
      >
        <Upload size={14} /> 导入布局 (JSON) — 即将开放
      </button>
    </div>
  )
}

// 布局管理器 — 壳切换 + 导入/导出 JSON + 删除自定义布局

import { useState } from 'react'
import { Layout as LayoutIcon, Upload, Download, Check, Trash2 } from 'lucide-react'
import { useLayoutRegistry, type LayoutInfo } from '../../store/useLayoutRegistry'

export function LayoutManager() {
  const layouts = useLayoutRegistry(s => s.layouts)
  const activeId = useLayoutRegistry(s => s.activeId)
  const setActive = useLayoutRegistry(s => s.setActive)
  const register = useLayoutRegistry(s => s.register)
  const remove = useLayoutRegistry(s => s.remove)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  // 导出当前布局
  const handleExport = () => {
    const layout = layouts.find(l => l.id === activeId)
    if (!layout) return
    const json = JSON.stringify({ version: '1', layout }, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `layout-${layout.id}.json`; a.click()
    URL.revokeObjectURL(url)
    showToast('✓ 布局已导出')
  }

  // 导入布局
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        const info = data.layout as LayoutInfo
        if (!info?.id || !info?.name) throw new Error('格式无效：缺少 id 或 name')
        // 避免 id 冲突
        let id = info.id
        if (layouts.some(l => l.id === id)) id = `${id}-${Date.now()}`
        register({ ...info, id, isBuiltin: false })
        showToast(`✓ 已导入「${info.name}」`)
      } catch (err) {
        showToast('✗ 导入失败：' + (err instanceof Error ? err.message : '格式错误'))
      }
    }
    input.click()
  }

  // 删除自定义布局
  const handleRemove = (id: string) => {
    const info = layouts.find(l => l.id === id)
    if (!info || info.isBuiltin) return
    remove(id)
    showToast(`✓ 已删除「${info.name}」`)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-base font-semibold text-white flex items-center gap-2">
        <LayoutIcon size={16} /> 页面布局
      </h3>
      <p className="text-xs text-white/50">
        选择页面骨架风格。可导出当前布局为 JSON，分享或备份后导入。
      </p>

      {/* 布局网格 */}
      <div className="grid grid-cols-2 gap-2">
        {layouts.map(l => {
          const isActive = l.id === activeId
          return (
            <div key={l.id} className="relative group">
              <button
                onClick={() => setActive(l.id)}
                className={`w-full text-left rounded-xl p-3 border-2 transition ${
                  isActive ? 'border-blue-400 bg-white/10' : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{l.icon}</span>
                  <span className="text-sm text-white">{l.name}</span>
                  {isActive && <Check size={14} className="ml-auto text-blue-400" />}
                </div>
                <div className="text-xs text-white/40 mt-1">{l.description}</div>
              </button>
              {/* 删除按钮 — 仅自定义布局显示 */}
              {!l.isBuiltin && !isActive && (
                <button
                  onClick={() => handleRemove(l.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="删除"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="flex-1 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition flex items-center justify-center gap-2 text-sm"
        >
          <Download size={14} /> 导出当前
        </button>
        <button
          onClick={handleImport}
          className="flex-1 py-2 rounded-lg border border-dashed border-white/10 text-white/70 hover:bg-white/5 hover:text-white transition flex items-center justify-center gap-2 text-sm"
        >
          <Upload size={14} /> 导入 JSON
        </button>
      </div>

      {/* 轻量提示 */}
      {toast && (
        <div className="text-xs text-white/50 text-center animate-fade-in">{toast}</div>
      )}
    </div>
  )
}

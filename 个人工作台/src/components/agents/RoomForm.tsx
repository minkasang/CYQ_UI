// RoomForm — 新建 / 编辑聊天室
// 多选 Agent 成员

import { useState } from 'react'
import { X, Check } from 'lucide-react'
import type { AgentConfig, RoomConfig } from '../../types/agent'

interface RoomFormProps {
  allAgents: AgentConfig[]
  initial?: RoomConfig
  onSave: (name: string, agentIds: string[]) => void
  onCancel: () => void
}

export function RoomForm({ allAgents, initial, onSave, onCancel }: RoomFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [selectedIds, setSelectedIds] = useState<string[]>(initial?.agentIds || [])

  const toggleAgent = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    if (!name.trim()) return
    onSave(name.trim(), selectedIds)
  }

  const isValid = name.trim().length > 0

  return (
    <div className="rounded-2xl bg-white/[0.06] backdrop-blur-[10px] border border-white/10 shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <span className="text-xs font-medium text-white/60">
          {initial ? '编辑聊天室' : '新建聊天室'}
        </span>
        <button onClick={onCancel} className="p-1 rounded text-white/25 hover:text-white/60 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* 名称 */}
        <div>
          <label className="block text-xs text-white/30 mb-1">房间名称</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="给聊天室起个名字"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-white/15 outline-none focus:border-[#0A84FF] transition-colors"
          />
        </div>

        {/* 选择 Agent */}
        <div>
          <label className="block text-xs text-white/30 mb-2">
            选择 Agent 成员 ({selectedIds.length})
          </label>
          {allAgents.length === 0 ? (
            <p className="text-xs text-white/20 py-3 text-center">
              还没有 Agent，请先去创建
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
              {allAgents.map(agent => {
                const selected = selectedIds.includes(agent.id)
                return (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      selected
                        ? 'bg-[#0A84FF]/15 text-white border border-[#0A84FF]/30'
                        : 'bg-white/[0.03] text-white/40 hover:bg-white/[0.06] hover:text-white/60 border border-transparent'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                      selected
                        ? 'bg-[#0A84FF] border-[#0A84FF]'
                        : 'border-white/[0.15]'
                    }`}>
                      {selected && <Check size={10} className="text-white" />}
                    </span>
                    <div className="min-w-0">
                      <span className="truncate block">{agent.name}</span>
                      <span className="text-[11px] text-white/20">{agent.provider}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 px-5 py-3 border-t border-white/[0.06]">
        <button
          onClick={onCancel}
          className="px-4 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="px-5 py-1.5 rounded-lg bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {initial ? '保存' : '创建'}
        </button>
      </div>
    </div>
  )
}

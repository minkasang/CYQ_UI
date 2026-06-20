// AgentCard — Agent 卡片展示
// macOS 暗色玻璃风格，hover 显示操作按钮

import { Pencil, Trash2, Bot } from 'lucide-react'
import { getModelName } from '../../store/useAIConfigStore'
import type { AgentConfig } from '../../types/agent'

interface AgentCardProps {
  agent: AgentConfig
  onEdit: () => void
  onDelete: () => void
}

export function AgentCard({ agent, onEdit, onDelete }: AgentCardProps) {
  const modelName = getModelName(agent.provider, agent.model)

  return (
    <div className="group rounded-xl bg-white/[0.04] border border-white/[0.06] hover:border-white/[0.10] transition-all duration-200 overflow-hidden">
      <div className="px-4 py-3">
        {/* 顶部：名称 + 操作 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Bot size={14} className="text-white/40 flex-shrink-0" />
            <span className="text-sm font-medium text-white/80 truncate">{agent.name}</span>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={onEdit}
              className="p-1 rounded text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              title="编辑"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 rounded text-white/25 hover:text-red-400 hover:bg-red-400/5 transition-colors"
              title="删除"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* 模型信息 */}
        <p className="text-[11px] text-white/30 mt-1">{modelName}</p>

        {/* 人设摘要 */}
        {agent.systemPrompt && (
          <p className="text-[10px] text-white/20 mt-1.5 line-clamp-2 leading-relaxed">
            {agent.systemPrompt}
          </p>
        )}

        {/* 底部属性 */}
        <div className="flex items-center gap-3 mt-2.5 text-[10px] text-white/25">
          <span>概率 {Math.round(agent.replyProbability * 100)}%</span>
          <span>冷却 {Math.round(agent.cooldownMin / 1000)}~{Math.round(agent.cooldownMax / 1000)}s</span>
        </div>
      </div>
    </div>
  )
}

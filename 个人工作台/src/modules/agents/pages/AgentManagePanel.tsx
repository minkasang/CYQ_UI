// AgentManagePanel — Agent 列表 + 新建/编辑
// 首页 Section 内使用，完整 CRUD

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useAgentStore } from '../../../store/useAgentStore'
import { useRoomStore } from '../../../store/useRoomStore'
import { AgentCard } from '../../../components/agents/AgentCard'
import { AgentForm } from '../../../components/agents/AgentForm'
import type { AgentConfig, AgentFormData } from '../../../types/agent'

export function AgentManagePanel() {
  const agents = useAgentStore(s => s.agents)
  const loadAgents = useAgentStore(s => s.load)
  const addAgent = useAgentStore(s => s.add)
  const updateAgent = useAgentStore(s => s.update)
  const removeAgent = useAgentStore(s => s.remove)
  const removeAgentFromAllRooms = useRoomStore(s => s.removeAgentFromAllRooms)

  const [showForm, setShowForm] = useState(false)
  const [editingAgent, setEditingAgent] = useState<AgentConfig | undefined>(undefined)

  useEffect(() => { loadAgents() }, [loadAgents])

  const handleSave = (data: AgentFormData) => {
    if (editingAgent) {
      updateAgent(editingAgent.id, data)
    } else {
      const result = addAgent(data)
      if (!result) {
        alert('Agent 名称已存在')
        return
      }
    }
    setShowForm(false)
    setEditingAgent(undefined)
  }

  const handleDelete = (agent: AgentConfig) => {
    const roomCount = useRoomStore.getState().rooms.filter(r => r.agentIds.includes(agent.id)).length
    const msg = roomCount > 0
      ? `确定删除「${agent.name}」？将从 ${roomCount} 个聊天室中移除。`
      : `确定删除「${agent.name}」？`
    if (confirm(msg)) {
      removeAgentFromAllRooms(agent.id)
      removeAgent(agent.id)
    }
  }

  // 空状态
  if (agents.length === 0 && !showForm) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-white/50 mb-1">还没有 AI 智能体</p>
        <p className="text-xs text-white/25 mb-4">创建你的第一个 Agent，赋予它名字和性格</p>
        <button
          onClick={() => { setEditingAgent(undefined); setShowForm(true) }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          创建 Agent
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 新建按钮 */}
      {!showForm && (
        <button
          onClick={() => { setEditingAgent(undefined); setShowForm(true) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/60 hover:bg-white/[0.10] hover:text-white/80 transition-colors"
        >
          <Plus size={13} />
          新建 Agent
        </button>
      )}

      {/* 表单 */}
      {showForm && (
        <AgentForm
          initial={editingAgent}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditingAgent(undefined) }}
        />
      )}

      {/* Agent 列表 */}
      {agents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onEdit={() => { setEditingAgent(agent); setShowForm(true) }}
              onDelete={() => handleDelete(agent)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

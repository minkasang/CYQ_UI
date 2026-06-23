// AgentSection — 首页智能体群聊 Section 入口
// 包含统计卡片 + Agent 管理面板 + Room 管理面板

import { useState, useEffect } from 'react'
import { Bot, MessageSquare } from 'lucide-react'
import { useAgentStore } from '../../../store/useAgentStore'
import { useRoomStore } from '../../../store/useRoomStore'
import { AgentManagePanel } from './AgentManagePanel'
import { RoomManagePanel } from './RoomManagePanel'

export function AgentSection() {
  const agents = useAgentStore(s => s.agents)
  const rooms = useRoomStore(s => s.rooms)
  const loadAgents = useAgentStore(s => s.load)
  const loadRooms = useRoomStore(s => s.load)

  const [tab, setTab] = useState<'agents' | 'rooms'>('agents')

  useEffect(() => { loadAgents(); loadRooms() }, [loadAgents, loadRooms])

  const activeRoomCount = rooms.filter(r => r.isActive).length

  return (
    <div className="space-y-4">
      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <Bot size={14} className="text-white/40" />
            <span className="text-xs text-white/30">Agent</span>
          </div>
          <span className="text-xl font-bold text-white/80">{agents.length}</span>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare size={14} className="text-white/40" />
            <span className="text-xs text-white/30">聊天室</span>
          </div>
          <span className="text-xl font-bold text-white/80">{rooms.length}</span>
        </div>
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#30D158]" />
            <span className="text-xs text-white/30">运行中</span>
          </div>
          <span className="text-xl font-bold text-white/80">{activeRoomCount}</span>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setTab('agents')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            tab === 'agents'
              ? 'bg-white/[0.08] text-white'
              : 'text-white/35 hover:text-white/55'
          }`}
        >
          Agent 管理
        </button>
        <button
          onClick={() => setTab('rooms')}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
            tab === 'rooms'
              ? 'bg-white/[0.08] text-white'
              : 'text-white/35 hover:text-white/55'
          }`}
        >
          聊天室管理
        </button>
      </div>

      {/* 内容 */}
      {tab === 'agents' ? <AgentManagePanel /> : <RoomManagePanel />}
    </div>
  )
}

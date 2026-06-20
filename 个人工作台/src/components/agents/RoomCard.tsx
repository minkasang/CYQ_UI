// RoomCard — 聊天室卡片展示
// 显示名称、开关状态、成员数

import { Trash2, Settings, Power, PowerOff } from 'lucide-react'
import type { RoomConfig, AgentConfig } from '../../types/agent'

interface RoomCardProps {
  room: RoomConfig
  agents: AgentConfig[]       // 用于显示成员名
  onToggleActive: () => void
  onManage: () => void
  onDelete: () => void
}

export function RoomCard({ room, agents, onToggleActive, onManage, onDelete }: RoomCardProps) {
  const memberNames = room.agentIds
    .map(id => agents.find(a => a.id === id)?.name)
    .filter(Boolean) as string[]

  return (
    <div className={`group rounded-xl border transition-all duration-200 overflow-hidden ${
      room.isActive
        ? 'bg-white/[0.06] border-[#30D158]/20'
        : 'bg-white/[0.03] border-white/[0.05] hover:border-white/[0.08]'
    }`}>
      <div className="px-4 py-3">
        {/* 顶部 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* 开关指示灯 */}
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              room.isActive ? 'bg-[#30D158]' : 'bg-white/[0.15]'
            }`} />
            <span className="text-sm font-medium text-white/70 truncate">{room.name}</span>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button
              onClick={onManage}
              className="p-1 rounded text-white/25 hover:text-white/60 hover:bg-white/[0.06] transition-colors"
              title="管理成员"
            >
              <Settings size={12} />
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

        {/* 成员信息 */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-white/25">
            {memberNames.length + 1} 人
          </span>
          {memberNames.length > 0 && (
            <span className="text-[10px] text-white/15 truncate">
              {memberNames.join('、')}
            </span>
          )}
          {memberNames.length === 0 && (
            <span className="text-[10px] text-white/12">暂无 AI 成员</span>
          )}
        </div>

        {/* 开关按钮 */}
        <button
          onClick={onToggleActive}
          className={`mt-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] transition-colors ${
            room.isActive
              ? 'bg-[#30D158]/15 text-[#30D158] hover:bg-[#30D158]/25'
              : 'bg-white/[0.04] text-white/30 hover:bg-white/[0.08] hover:text-white/50'
          }`}
        >
          {room.isActive ? <Power size={10} /> : <PowerOff size={10} />}
          {room.isActive ? '运行中' : '已关闭'}
        </button>
      </div>
    </div>
  )
}

// RoomManagePanel — 聊天室列表 + 新建/管理
// 首页 Section 内使用

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { useRoomStore } from '../../../store/useRoomStore'
import { useAgentStore } from '../../../store/useAgentStore'
import { RoomCard } from '../../../components/agents/RoomCard'
import { RoomForm } from '../../../components/agents/RoomForm'
import type { RoomConfig } from '../../../types/agent'

export function RoomManagePanel() {
  const rooms = useRoomStore(s => s.rooms)
  const loadRooms = useRoomStore(s => s.load)
  const createRoom = useRoomStore(s => s.create)
  const deleteRoom = useRoomStore(s => s.delete)
  const toggleActive = useRoomStore(s => s.toggleActive)
  const addMember = useRoomStore(s => s.addMember)
  const removeMember = useRoomStore(s => s.removeMember)

  const agents = useAgentStore(s => s.agents)
  const loadAgents = useAgentStore(s => s.load)

  const [showForm, setShowForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomConfig | undefined>(undefined)

  useEffect(() => { loadRooms(); loadAgents() }, [loadRooms, loadAgents])

  const handleCreate = (name: string, agentIds: string[]) => {
    const result = createRoom(name, agentIds)
    if (!result) {
      alert('房间名称已存在或为空')
      return
    }
    setShowForm(false)
  }

  const handleManageSave = (_name: string, agentIds: string[]) => {
    if (!editingRoom) return

    // 移除不在新列表中的 Agent
    editingRoom.agentIds.forEach(id => {
      if (!agentIds.includes(id)) removeMember(editingRoom.id, id)
    })
    // 添加新选中的 Agent
    agentIds.forEach(id => {
      if (!editingRoom.agentIds.includes(id)) addMember(editingRoom.id, id)
    })

    setShowForm(false)
    setEditingRoom(undefined)
  }

  const handleDelete = (room: RoomConfig) => {
    if (confirm(`确定删除聊天室「${room.name}」？`)) {
      deleteRoom(room.id)
    }
  }

  // 空状态
  if (rooms.length === 0 && !showForm) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-white/50 mb-1">还没有聊天室</p>
        <p className="text-xs text-white/25 mb-4">创建一个聊天室，把 Agent 拉进来</p>
        <button
          onClick={() => { setEditingRoom(undefined); setShowForm(true) }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0A84FF] hover:bg-[#0077ED] text-white text-xs font-medium transition-colors"
        >
          <Plus size={14} />
          创建聊天室
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 新建按钮 */}
      {!showForm && (
        <button
          onClick={() => { setEditingRoom(undefined); setShowForm(true) }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-xs text-white/60 hover:bg-white/[0.10] hover:text-white/80 transition-colors"
        >
          <Plus size={13} />
          新建聊天室
        </button>
      )}

      {/* 表单 */}
      {showForm && (
        <RoomForm
          allAgents={agents}
          initial={editingRoom}
          onSave={editingRoom ? handleManageSave : handleCreate}
          onCancel={() => { setShowForm(false); setEditingRoom(undefined) }}
        />
      )}

      {/* Room 列表 */}
      {rooms.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              agents={agents}
              onToggleActive={() => toggleActive(room.id)}
              onManage={() => { setEditingRoom(room); setShowForm(true) }}
              onDelete={() => handleDelete(room)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

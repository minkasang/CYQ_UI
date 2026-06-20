// Room Store — 聊天室的 CRUD + 成员管理 + 持久化
// 深度模块：小接口（7个方法）隐藏成员关系、级联清理、文件读写

import { create } from 'zustand'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'
import type { RoomConfig } from '../types/agent'

interface RoomState {
  rooms: RoomConfig[]
  loaded: boolean

  load: () => Promise<void>
  create: (name: string, agentIds: string[]) => RoomConfig | null
  delete: (id: string) => void
  toggleActive: (id: string) => void
  addMember: (roomId: string, agentId: string) => boolean
  removeMember: (roomId: string, agentId: string) => void
  /** 从所有 Room 中移除指定 Agent（级联清理） */
  removeAgentFromAllRooms: (agentId: string) => void
}

function genId(): string {
  return crypto.randomUUID()
}

export const useRoomStore = create<RoomState>((set, get) => ({
  rooms: [],
  loaded: false,

  load: async () => {
    if (get().loaded) return
    try {
      const data = await loadFromFile<{ rooms: RoomConfig[] }>(FILE_KEYS.CHATROOMS, { rooms: [] })
      set({ rooms: data.rooms || [], loaded: true })
    } catch {
      set({ rooms: [], loaded: true })
    }
  },

  create: (name, agentIds) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    // 重名校验
    if (get().rooms.some(r => r.name === trimmed)) return null

    const room: RoomConfig = {
      id: genId(),
      name: trimmed,
      agentIds: [...new Set(agentIds)], // 去重
      isActive: false,
      createdAt: Date.now(),
    }

    const rooms = [...get().rooms, room]
    set({ rooms })
    saveToFile(FILE_KEYS.CHATROOMS, { rooms })
    return room
  },

  delete: (id) => {
    const rooms = get().rooms.filter(r => r.id !== id)
    set({ rooms })
    saveToFile(FILE_KEYS.CHATROOMS, { rooms })
  },

  toggleActive: (id) => {
    const rooms = get().rooms.map(r =>
      r.id === id ? { ...r, isActive: !r.isActive } : r
    )
    set({ rooms })
    saveToFile(FILE_KEYS.CHATROOMS, { rooms })
  },

  addMember: (roomId, agentId) => {
    const room = get().rooms.find(r => r.id === roomId)
    if (!room || room.agentIds.includes(agentId)) return false

    const rooms = get().rooms.map(r =>
      r.id === roomId ? { ...r, agentIds: [...r.agentIds, agentId] } : r
    )
    set({ rooms })
    saveToFile(FILE_KEYS.CHATROOMS, { rooms })
    return true
  },

  removeMember: (roomId, agentId) => {
    const rooms = get().rooms.map(r =>
      r.id === roomId ? { ...r, agentIds: r.agentIds.filter(id => id !== agentId) } : r
    )
    set({ rooms })
    saveToFile(FILE_KEYS.CHATROOMS, { rooms })
  },

  removeAgentFromAllRooms: (agentId) => {
    const rooms = get().rooms.map(r => ({
      ...r,
      agentIds: r.agentIds.filter(id => id !== agentId),
    }))
    set({ rooms })
    saveToFile(FILE_KEYS.CHATROOMS, { rooms })
  },
}))

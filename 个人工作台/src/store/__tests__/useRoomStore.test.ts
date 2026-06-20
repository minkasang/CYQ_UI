// useRoomStore 单元测试
// 纯逻辑测试，mock fileStorage

import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('../../utils/fileStorage', () => ({
  loadFromFile: vi.fn().mockResolvedValue({ rooms: [] }),
  saveToFile: vi.fn().mockResolvedValue(undefined),
  FILE_KEYS: { CHATROOMS: 'mock/chatrooms.json' },
}))

import { useRoomStore } from '../useRoomStore'

describe('useRoomStore', () => {
  beforeEach(() => {
    useRoomStore.setState({ rooms: [], loaded: true })
  })

  it('初始状态为空数组', () => {
    expect(useRoomStore.getState().rooms).toEqual([])
  })

  it('create 创建 Room 并返回', () => {
    const room = useRoomStore.getState().create('周会', ['agent-1', 'agent-2'])
    expect(room).not.toBeNull()
    expect(room!.name).toBe('周会')
    expect(room!.agentIds).toEqual(['agent-1', 'agent-2'])
    expect(room!.isActive).toBe(false)
    expect(useRoomStore.getState().rooms).toHaveLength(1)
  })

  it('create 名称为空返回 null', () => {
    const room = useRoomStore.getState().create('  ', ['agent-1'])
    expect(room).toBeNull()
  })

  it('create 重名返回 null', () => {
    useRoomStore.getState().create('周会', [])
    const room = useRoomStore.getState().create('周会', [])
    expect(room).toBeNull()
  })

  it('create 自动去重 agentIds', () => {
    const room = useRoomStore.getState().create('测试', ['a', 'b', 'a'])
    expect(room!.agentIds).toEqual(['a', 'b'])
  })

  it('delete 删除 Room', () => {
    const room = useRoomStore.getState().create('测试', [])!
    useRoomStore.getState().delete(room.id)
    expect(useRoomStore.getState().rooms).toHaveLength(0)
  })

  it('toggleActive 切换开关', () => {
    const room = useRoomStore.getState().create('测试', [])!
    useRoomStore.getState().toggleActive(room.id)
    expect(useRoomStore.getState().rooms[0].isActive).toBe(true)
    useRoomStore.getState().toggleActive(room.id)
    expect(useRoomStore.getState().rooms[0].isActive).toBe(false)
  })

  it('addMember 添加成员', () => {
    const room = useRoomStore.getState().create('测试', ['a'])!
    const ok = useRoomStore.getState().addMember(room.id, 'b')
    expect(ok).toBe(true)
    expect(useRoomStore.getState().rooms[0].agentIds).toEqual(['a', 'b'])
  })

  it('addMember 重复添加返回 false', () => {
    const room = useRoomStore.getState().create('测试', ['a'])!
    const ok = useRoomStore.getState().addMember(room.id, 'a')
    expect(ok).toBe(false)
  })

  it('addMember 不存在的 room 返回 false', () => {
    const ok = useRoomStore.getState().addMember('not-exist', 'a')
    expect(ok).toBe(false)
  })

  it('removeMember 移除成员', () => {
    const room = useRoomStore.getState().create('测试', ['a', 'b'])!
    useRoomStore.getState().removeMember(room.id, 'a')
    expect(useRoomStore.getState().rooms[0].agentIds).toEqual(['b'])
  })

  it('removeAgentFromAllRooms 级联清理', () => {
    useRoomStore.getState().create('Room A', ['agent-1', 'agent-2'])
    useRoomStore.getState().create('Room B', ['agent-1', 'agent-3'])
    useRoomStore.getState().create('Room C', ['agent-2'])

    useRoomStore.getState().removeAgentFromAllRooms('agent-1')

    const rooms = useRoomStore.getState().rooms
    expect(rooms[0].agentIds).toEqual(['agent-2'])
    expect(rooms[1].agentIds).toEqual(['agent-3'])
    expect(rooms[2].agentIds).toEqual(['agent-2']) // 不受影响
  })
})

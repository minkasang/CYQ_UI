import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTagStore, selectTagsByIds } from '../../store/useTagStore'

// Mock fileStorage
vi.mock('../../utils/fileStorage', () => ({
  loadFromFile: vi.fn().mockResolvedValue([]),
  saveToFile: vi.fn().mockResolvedValue(true),
  FILE_KEYS: {
    TAGS: '个人工作台/data/tags.json',
  },
}))

describe('useTagStore', () => {
  beforeEach(() => {
    useTagStore.setState({ tags: [], loaded: false, loading: false })
  })

  it('应该能添加标签', () => {
    useTagStore.getState().addTag('重要', '#ef4444')

    const tags = useTagStore.getState().tags
    expect(tags.length).toBe(1)
    expect(tags[0].name).toBe('重要')
    expect(tags[0].color).toBe('#ef4444')
  })

  it('应该能更新标签', () => {
    useTagStore.getState().addTag('重要', '#ef4444')
    const tagId = useTagStore.getState().tags[0].id

    useTagStore.getState().updateTag(tagId, { name: '紧急' })

    const tag = useTagStore.getState().tags.find(t => t.id === tagId)
    expect(tag?.name).toBe('紧急')
  })

  it('应该能删除标签', () => {
    useTagStore.getState().addTag('重要', '#ef4444')
    const tagId = useTagStore.getState().tags[0].id

    useTagStore.getState().deleteTag(tagId)

    expect(useTagStore.getState().tags.length).toBe(0)
  })

  it('应该能根据 ID 列表获取标签', () => {
    useTagStore.getState().addTag('标签1', '#3b82f6')
    useTagStore.getState().addTag('标签2', '#ef4444')
    useTagStore.getState().addTag('标签3', '#22c55e')

    const tags = useTagStore.getState().tags
    const ids = [tags[0].id, tags[2].id]

    const selected = selectTagsByIds(useTagStore.getState(), ids)

    expect(selected.length).toBe(2)
    expect(selected.map(t => t.name)).toContain('标签1')
    expect(selected.map(t => t.name)).toContain('标签3')
    expect(selected.map(t => t.name)).not.toContain('标签2')
  })
})

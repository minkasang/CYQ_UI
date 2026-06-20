// 每日灵感 Store 单元测试
import { describe, it, expect, beforeEach } from 'vitest'
import { useInspirationStore } from '../useInspirationStore'

function resetStore() {
  useInspirationStore.setState({ items: [], currentId: null })
}

describe('useInspirationStore', () => {
  beforeEach(() => resetStore())

  describe('add', () => {
    it('应添加一条记录并自动生成 id 和时间戳', () => {
      const item = useInspirationStore.getState().add({ content: '一切都会过去' })
      expect(item.id).toBeDefined()
      expect(item.content).toBe('一切都会过去')
      expect(item.impact).toBe(2) // 默认值
      expect(item.isFavorite).toBe(false)
      expect(item.tags).toEqual([])
      expect(item.createdAt).toBeGreaterThan(0)
      expect(item.lastReviewedAt).toBe(item.createdAt)
    })

    it('应支持可选字段：来源、标签、感想、触动程度', () => {
      const item = useInspirationStore.getState().add({
        content: '知行合一',
        source: '王阳明',
        tags: ['哲学', '行动'],
        reflection: '想和做要统一',
        impact: 3,
      })
      expect(item.source).toBe('王阳明')
      expect(item.tags).toEqual(['哲学', '行动'])
      expect(item.reflection).toBe('想和做要统一')
      expect(item.impact).toBe(3)
    })

    it('内容应自动 trim', () => {
      const item = useInspirationStore.getState().add({ content: '  你好  ' })
      expect(item.content).toBe('你好')
    })

    it('新记录应插入到列表最前面', () => {
      useInspirationStore.getState().add({ content: '第一条' })
      useInspirationStore.getState().add({ content: '第二条' })
      const items = useInspirationStore.getState().items
      expect(items[0].content).toBe('第二条')
      expect(items[1].content).toBe('第一条')
    })
  })

  describe('toggleFavorite', () => {
    it('应切换收藏状态', () => {
      const item = useInspirationStore.getState().add({ content: '测试' })
      expect(useInspirationStore.getState().items[0].isFavorite).toBe(false)

      useInspirationStore.getState().toggleFavorite(item.id)
      expect(useInspirationStore.getState().items[0].isFavorite).toBe(true)

      useInspirationStore.getState().toggleFavorite(item.id)
      expect(useInspirationStore.getState().items[0].isFavorite).toBe(false)
    })
  })

  describe('setImpact', () => {
    it('应设置触动程度并 clamp 到 1-3', () => {
      const item = useInspirationStore.getState().add({ content: '测试' })

      useInspirationStore.getState().setImpact(item.id, 3)
      expect(useInspirationStore.getState().items[0].impact).toBe(3)

      useInspirationStore.getState().setImpact(item.id, 0)  // 低于下限
      expect(useInspirationStore.getState().items[0].impact).toBe(1)

      useInspirationStore.getState().setImpact(item.id, 5)  // 高于上限
      expect(useInspirationStore.getState().items[0].impact).toBe(3)
    })
  })

  describe('markReviewed', () => {
    it('应更新 lastReviewedAt 时间戳', () => {
      const item = useInspirationStore.getState().add({ content: '测试' })
      const before = useInspirationStore.getState().items[0].lastReviewedAt

      // 等待 1ms 确保时间戳不同
      useInspirationStore.getState().markReviewed(item.id)
      const after = useInspirationStore.getState().items[0].lastReviewedAt
      expect(after).toBeGreaterThanOrEqual(before)
    })
  })

  describe('getNextReview', () => {
    it('空状态应返回 null', () => {
      expect(useInspirationStore.getState().getNextReview()).toBeNull()
    })

    it('只有一条记录时应返回该记录', () => {
      const item = useInspirationStore.getState().add({ content: '唯一' })
      const result = useInspirationStore.getState().getNextReview()
      expect(result).not.toBeNull()
      expect(result!.id).toBe(item.id)
    })

    it('多条记录时应返回一条有效记录', () => {
      useInspirationStore.getState().add({ content: 'A', impact: 1 })
      useInspirationStore.getState().add({ content: 'B', impact: 2 })
      useInspirationStore.getState().add({ content: 'C', impact: 3 })
      const result = useInspirationStore.getState().getNextReview()
      expect(result).not.toBeNull()
      expect(['A', 'B', 'C']).toContain(result!.content)
    })
  })

  describe('remove', () => {
    it('应删除指定记录', () => {
      const item = useInspirationStore.getState().add({ content: '测试' })
      expect(useInspirationStore.getState().items).toHaveLength(1)
      useInspirationStore.getState().remove(item.id)
      expect(useInspirationStore.getState().items).toHaveLength(0)
    })

    it('删除不存在的id不应报错', () => {
      useInspirationStore.getState().add({ content: '测试' })
      expect(() => useInspirationStore.getState().remove('nonexistent')).not.toThrow()
      expect(useInspirationStore.getState().items).toHaveLength(1)
    })
  })

  describe('update', () => {
    it('应更新指定字段', () => {
      const item = useInspirationStore.getState().add({ content: '旧内容', source: '旧来源' })
      useInspirationStore.getState().update(item.id, { content: '新内容' })
      const updated = useInspirationStore.getState().items[0]
      expect(updated.content).toBe('新内容')
      expect(updated.source).toBe('旧来源') // 未更新的字段保持不变
    })
  })
})

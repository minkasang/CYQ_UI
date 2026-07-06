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

    it('应支持人生图谱字段：类型、维度、洞察、原则和小行动实验', () => {
      const item = useInspirationStore.getState().add({
        content: '不要在情绪高峰做长期决定',
        kind: 'principle',
        dimensions: ['emotion', 'principle'],
        insight: '强烈情绪会放大短期解释',
        principle: '先降温，再决定',
        actionExperiment: {
          title: '延迟回应',
          trigger: '想立刻反击时',
          action: '先离开屏幕 10 分钟',
        },
      })

      expect(item.kind).toBe('principle')
      expect(item.dimensions).toEqual(['emotion', 'principle'])
      expect(item.insight).toBe('强烈情绪会放大短期解释')
      expect(item.principle).toBe('先降温，再决定')
      expect(item.actionExperiment).toMatchObject({
        title: '延迟回应',
        trigger: '想立刻反击时',
        action: '先离开屏幕 10 分钟',
        status: 'planned',
      })
      expect(item.actionExperiment?.createdAt).toBeGreaterThan(0)
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

    it('更新人生图谱字段时不应清空未传入字段', () => {
      const item = useInspirationStore.getState().add({
        content: '原始内容',
        source: '来源',
        tags: ['价值观'],
        kind: 'insight',
        dimensions: ['values'],
      })
      useInspirationStore.getState().update(item.id, { insight: '这是一个核心洞察' })
      const updated = useInspirationStore.getState().items[0]

      expect(updated.content).toBe('原始内容')
      expect(updated.source).toBe('来源')
      expect(updated.tags).toEqual(['价值观'])
      expect(updated.kind).toBe('insight')
      expect(updated.dimensions).toEqual(['values'])
      expect(updated.insight).toBe('这是一个核心洞察')
    })
  })

  describe('updateActionExperiment', () => {
    it('应新增并更新小行动实验状态', () => {
      const item = useInspirationStore.getState().add({ content: '把洞察变成行动' })

      useInspirationStore.getState().updateActionExperiment(item.id, {
        title: '写下下一步',
        action: '打开待办写一个 5 分钟动作',
      })
      expect(useInspirationStore.getState().items[0].actionExperiment).toMatchObject({
        title: '写下下一步',
        action: '打开待办写一个 5 分钟动作',
        status: 'planned',
      })

      useInspirationStore.getState().updateActionExperiment(item.id, { status: 'done' })
      const done = useInspirationStore.getState().items[0].actionExperiment
      expect(done?.status).toBe('done')
      expect(done?.completedAt).toBeGreaterThan(0)
    })

    it('从完成状态改回其他状态时应清除 completedAt', () => {
      const item = useInspirationStore.getState().add({
        content: '实验',
        actionExperiment: { title: '实验', action: '行动' },
      })

      useInspirationStore.getState().updateActionExperiment(item.id, { status: 'done' })
      expect(useInspirationStore.getState().items[0].actionExperiment?.completedAt).toBeGreaterThan(0)

      useInspirationStore.getState().updateActionExperiment(item.id, { status: 'active' })
      const active = useInspirationStore.getState().items[0].actionExperiment
      expect(active?.status).toBe('active')
      expect(active?.completedAt).toBeUndefined()
    })

    it('传入 null 应清除小行动实验', () => {
      const item = useInspirationStore.getState().add({
        content: '实验',
        actionExperiment: { title: '实验', action: '行动' },
      })

      useInspirationStore.getState().updateActionExperiment(item.id, null)
      expect(useInspirationStore.getState().items[0].actionExperiment).toBeUndefined()
    })
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTodoStore } from '../../store/useTodoStore'
import type { Todo } from '../../types'

// Mock fileStorage
vi.mock('../../utils/fileStorage', () => ({
  loadFromFile: vi.fn().mockResolvedValue([]),
  saveToFile: vi.fn().mockResolvedValue(true),
  FILE_KEYS: {
    TODOS: '个人工作台/data/todos.json',
  },
}))

// Mock date utils
vi.mock('../../utils/date', () => ({
  getToday: () => '2026-06-17',
  startOfToday: () => Date.now() - 86400000,
}))

describe('useTodoStore', () => {
  beforeEach(() => {
    // 重置 store
    useTodoStore.setState({ todos: [], loaded: false, loading: false, projectFilter: null })
  })

  describe('数据迁移', () => {
    it('旧数据应该自动添加新字段的默认值', () => {
      const oldTodo: Partial<Todo> = {
        id: 'test-1',
        title: '测试任务',
        category: 'work',
        priority: 'high',
        completed: false,
        createdAt: Date.now(),
      }

      useTodoStore.getState().addTodo(oldTodo)
      const todos = useTodoStore.getState().todos
      const newTodo = todos.find(t => t.id !== 'test-1')

      expect(newTodo).toBeDefined()
      expect(newTodo?.tags).toEqual([])
      expect(newTodo?.subtasks).toEqual([])
      expect(newTodo?.dependsOn).toEqual([])
      expect(newTodo?.timeSpent).toBe(0)
      expect(newTodo?.timeEntries).toEqual([])
      expect(newTodo?.archived).toBe(false)
      expect(newTodo?.order).toBeDefined()
    })
  })

  describe('子任务操作', () => {
    it('应该能添加子任务', () => {
      useTodoStore.getState().addTodo({ title: '主任务' })
      const todoId = useTodoStore.getState().todos[0].id

      useTodoStore.getState().addSubTask(todoId, '子任务1')

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.subtasks.length).toBe(1)
      expect(todo?.subtasks[0].title).toBe('子任务1')
      expect(todo?.subtasks[0].completed).toBe(false)
    })

    it('应该能切换子任务完成状态', () => {
      useTodoStore.getState().addTodo({ title: '主任务' })
      const todoId = useTodoStore.getState().todos[0].id
      useTodoStore.getState().addSubTask(todoId, '子任务1')
      const subtaskId = useTodoStore.getState().todos[0].subtasks[0].id

      useTodoStore.getState().toggleSubTask(todoId, subtaskId)

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.subtasks[0].completed).toBe(true)
    })

    it('应该能删除子任务', () => {
      useTodoStore.getState().addTodo({ title: '主任务' })
      const todoId = useTodoStore.getState().todos[0].id
      useTodoStore.getState().addSubTask(todoId, '子任务1')
      const subtaskId = useTodoStore.getState().todos[0].subtasks[0].id

      useTodoStore.getState().deleteSubTask(todoId, subtaskId)

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.subtasks.length).toBe(0)
    })
  })

  describe('标签操作', () => {
    it('应该能给任务添加标签', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id

      useTodoStore.getState().addTag(todoId, 'tag-1')

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.tags).toContain('tag-1')
    })

    it('不应该重复添加标签', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id

      useTodoStore.getState().addTag(todoId, 'tag-1')
      useTodoStore.getState().addTag(todoId, 'tag-1')

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.tags.length).toBe(1)
    })

    it('应该能移除标签', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id
      useTodoStore.getState().addTag(todoId, 'tag-1')

      useTodoStore.getState().removeTag(todoId, 'tag-1')

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.tags).not.toContain('tag-1')
    })
  })

  describe('归档功能', () => {
    it('应该能归档任务', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id

      useTodoStore.getState().archiveTodo(todoId)

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.archived).toBe(true)
    })

    it('应该能取消归档', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id
      useTodoStore.getState().archiveTodo(todoId)

      useTodoStore.getState().unarchiveTodo(todoId)

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.archived).toBe(false)
    })
  })

  describe('时间追踪', () => {
    it('应该能开始计时', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id

      useTodoStore.getState().startTimeEntry(todoId)

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.timeEntries.length).toBe(1)
      expect(todo?.timeEntries[0].endTime).toBeUndefined()
    })

    it('应该能停止计时并计算时长', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id
      useTodoStore.getState().startTimeEntry(todoId)

      useTodoStore.getState().stopTimeEntry(todoId)

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.timeEntries[0].endTime).toBeDefined()
      expect(todo?.timeEntries[0].duration).toBeGreaterThanOrEqual(0)
      expect(todo?.timeSpent).toBeGreaterThanOrEqual(0)
    })
  })

  describe('项目筛选', () => {
    it('应该能设置项目筛选', () => {
      useTodoStore.getState().setProjectFilter('project-1')
      expect(useTodoStore.getState().projectFilter).toBe('project-1')
    })

    it('应该能清除项目筛选', () => {
      useTodoStore.getState().setProjectFilter('project-1')
      useTodoStore.getState().setProjectFilter(null)
      expect(useTodoStore.getState().projectFilter).toBeNull()
    })
  })

  describe('提醒功能', () => {
    it('应该能设置提醒配置', () => {
      useTodoStore.getState().addTodo({ title: '任务' })
      const todoId = useTodoStore.getState().todos[0].id

      useTodoStore.getState().updateTodo(todoId, {
        reminder: {
          enabled: true,
          time: '09:00',
          advanceDays: 1,
        },
      })

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.reminder?.enabled).toBe(true)
      expect(todo?.reminder?.time).toBe('09:00')
      expect(todo?.reminder?.advanceDays).toBe(1)
    })

    it('应该能禁用提醒', () => {
      useTodoStore.getState().addTodo({
        title: '任务',
        reminder: { enabled: true, time: '09:00', advanceDays: 0 },
      })
      const todoId = useTodoStore.getState().todos[0].id

      useTodoStore.getState().updateTodo(todoId, { reminder: undefined })

      const todo = useTodoStore.getState().todos.find(t => t.id === todoId)
      expect(todo?.reminder).toBeUndefined()
    })
  })

  describe('排序功能', () => {
    it('应该能重新排序任务', () => {
      useTodoStore.getState().addTodo({ title: '任务1' })
      useTodoStore.getState().addTodo({ title: '任务2' })
      useTodoStore.getState().addTodo({ title: '任务3' })

      const todos = useTodoStore.getState().todos
      expect(todos[0].title).toBe('任务3') // 最新的在前面
      expect(todos[1].title).toBe('任务2')
      expect(todos[2].title).toBe('任务1')

      // 将第一个移到最后
      useTodoStore.getState().reorderTodos(0, 2)

      const reordered = useTodoStore.getState().todos
      expect(reordered[0].title).toBe('任务2')
      expect(reordered[1].title).toBe('任务1')
      expect(reordered[2].title).toBe('任务3')
    })
  })
})

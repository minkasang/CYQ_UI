// 待办 Store
// 使用文件存储实现数据持久化，调用 server.py API 读写本地文件

import { create } from 'zustand'
import type { Todo, TodoCategory, TodoPriority, SubTask, TimeEntry } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'
import { getToday, startOfToday } from '../utils/date'

interface TodoState {
  todos: Todo[]
  filter: 'all' | 'today' | 'pending' | 'completed' | 'archived'
  projectFilter: string | null // 项目筛选
  loading: boolean
  loaded: boolean
  loadTodos: () => Promise<void>
  addTodo: (data: Partial<Omit<Todo, 'id' | 'createdAt' | 'completed'>>) => void
  updateTodo: (id: string, patch: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
  setFilter: (filter: TodoState['filter']) => void
  setProjectFilter: (projectId: string | null) => void
  clearCompleted: () => void
  // 子任务操作
  addSubTask: (todoId: string, title: string) => void
  updateSubTask: (todoId: string, subtaskId: string, patch: Partial<SubTask>) => void
  deleteSubTask: (todoId: string, subtaskId: string) => void
  toggleSubTask: (todoId: string, subtaskId: string) => void
  // 标签操作
  addTag: (todoId: string, tagId: string) => void
  removeTag: (todoId: string, tagId: string) => void
  // 时间追踪
  startTimeEntry: (todoId: string) => void
  stopTimeEntry: (todoId: string) => void
  // 归档
  archiveTodo: (id: string) => void
  unarchiveTodo: (id: string) => void
  // 排序
  reorderTodos: (fromIndex: number, toIndex: number) => void
}

// 生成简单唯一 ID
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 保存数据并处理错误
async function persistTodos(todos: Todo[]): Promise<void> {
  const ok = await saveToFile(FILE_KEYS.TODOS, todos)
  if (!ok) console.warn('[TodoStore] 保存失败，数据可能未持久化')
}

// 数据迁移：确保旧数据有新字段的默认值
function migrateTodo(todo: Partial<Todo>): Todo {
  return {
    id: todo.id || genId(),
    title: todo.title || '',
    content: todo.content,
    category: todo.category || 'other',
    priority: todo.priority || 'medium',
    completed: todo.completed || false,
    createdAt: todo.createdAt || Date.now(),
    completedAt: todo.completedAt,
    dueDate: todo.dueDate,
    // 新字段默认值
    tags: todo.tags || [],
    subtasks: todo.subtasks || [],
    projectId: todo.projectId,
    repeat: todo.repeat,
    reminder: todo.reminder,
    dependsOn: todo.dependsOn || [],
    timeSpent: todo.timeSpent || 0,
    timeEntries: todo.timeEntries || [],
    archived: todo.archived || false,
    order: todo.order ?? Date.now(),
  }
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  filter: 'today',
  projectFilter: null,
  loading: false,
  loaded: false,

  // 从文件加载待办数据（自动迁移）
  loadTodos: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const rawTodos = await loadFromFile<Partial<Todo>[]>(FILE_KEYS.TODOS, [])
      // 迁移数据
      const todos = rawTodos.map(migrateTodo)
      set({ todos, loading: false, loaded: true })
    } catch (err) {
      console.error('[TodoStore] 加载失败:', err)
      set({ loading: false, loaded: true })
    }
  },

  addTodo: (data) => {
    const todo = migrateTodo({
      ...data,
      id: genId(),
      createdAt: Date.now(),
      completed: false,
    })
    const newTodos = [todo, ...get().todos]
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  updateTodo: (id, patch) => {
    const newTodos = get().todos.map(t => t.id === id ? { ...t, ...patch } : t)
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  deleteTodo: (id) => {
    const newTodos = get().todos.filter(t => t.id !== id)
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  toggleComplete: (id) => {
    const newTodos = get().todos.map(t => {
      if (t.id !== id) return t
      const completed = !t.completed
      return {
        ...t,
        completed,
        completedAt: completed ? Date.now() : undefined,
      }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  setFilter: (filter) => set({ filter }),

  setProjectFilter: (projectId) => set({ projectFilter: projectId }),

  clearCompleted: () => {
    const newTodos = get().todos.filter(t => !t.completed)
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  // ===== 子任务操作 =====
  addSubTask: (todoId, title) => {
    const subtask: SubTask = {
      id: genId(),
      title,
      completed: false,
    }
    const newTodos = get().todos.map(t =>
      t.id === todoId ? { ...t, subtasks: [...t.subtasks, subtask] } : t
    )
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  updateSubTask: (todoId, subtaskId, patch) => {
    const newTodos = get().todos.map(t => {
      if (t.id !== todoId) return t
      return {
        ...t,
        subtasks: t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, ...patch } : st
        ),
      }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  deleteSubTask: (todoId, subtaskId) => {
    const newTodos = get().todos.map(t => {
      if (t.id !== todoId) return t
      return {
        ...t,
        subtasks: t.subtasks.filter(st => st.id !== subtaskId),
      }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  toggleSubTask: (todoId, subtaskId) => {
    const newTodos = get().todos.map(t => {
      if (t.id !== todoId) return t
      return {
        ...t,
        subtasks: t.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        ),
      }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  // ===== 标签操作 =====
  addTag: (todoId, tagId) => {
    const newTodos = get().todos.map(t => {
      if (t.id !== todoId || t.tags.includes(tagId)) return t
      return { ...t, tags: [...t.tags, tagId] }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  removeTag: (todoId, tagId) => {
    const newTodos = get().todos.map(t => {
      if (t.id !== todoId) return t
      return { ...t, tags: t.tags.filter(id => id !== tagId) }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  // ===== 时间追踪 =====
  startTimeEntry: (todoId) => {
    const entry: TimeEntry = {
      id: genId(),
      startTime: Date.now(),
      duration: 0,
    }
    const newTodos = get().todos.map(t => {
      if (t.id !== todoId) return t
      return { ...t, timeEntries: [...t.timeEntries, entry] }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  stopTimeEntry: (todoId) => {
    const now = Date.now()
    const newTodos = get().todos.map(t => {
      if (t.id !== todoId) return t
      const entries = t.timeEntries.map(e => {
        if (e.endTime) return e
        const duration = Math.round((now - e.startTime) / 60000) // 分钟
        return { ...e, endTime: now, duration }
      })
      const timeSpent = entries.reduce((sum, e) => sum + e.duration, 0)
      return { ...t, timeEntries: entries, timeSpent }
    })
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  // ===== 归档 =====
  archiveTodo: (id) => {
    const newTodos = get().todos.map(t =>
      t.id === id ? { ...t, archived: true } : t
    )
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  unarchiveTodo: (id) => {
    const newTodos = get().todos.map(t =>
      t.id === id ? { ...t, archived: false } : t
    )
    set({ todos: newTodos })
    persistTodos(newTodos)
  },

  // ===== 排序 =====
  reorderTodos: (fromIndex, toIndex) => {
    const todos = [...get().todos]
    const [removed] = todos.splice(fromIndex, 1)
    todos.splice(toIndex, 0, removed)
    // 更新 order 字段
    const updatedTodos = todos.map((t, i) => ({ ...t, order: i }))
    set({ todos: updatedTodos })
    persistTodos(updatedTodos)
  },
}))

// 派生选择器
export const selectFilteredTodos = (state: TodoState): Todo[] => {
  const today = getToday()
  const todayStart = startOfToday()

  // 先过滤归档
  let filtered = state.filter === 'archived'
    ? state.todos.filter(t => t.archived)
    : state.todos.filter(t => !t.archived)

  // 项目筛选
  if (state.projectFilter) {
    filtered = filtered.filter(t => t.projectId === state.projectFilter)
  }

  switch (state.filter) {
    case 'today':
      return filtered.filter(t =>
        t.dueDate === today ||
        (t.createdAt >= todayStart && !t.dueDate)
      )
    case 'pending':
      return filtered.filter(t => !t.completed)
    case 'completed':
      return filtered.filter(t => t.completed)
    case 'archived':
      return filtered
    default:
      return filtered
  }
}

export const selectTodoStats = (state: TodoState) => {
  const activeTodos = state.todos.filter(t => !t.archived)
  const total = activeTodos.length
  const completed = activeTodos.filter(t => t.completed).length
  const today = activeTodos.filter(t => t.dueDate === getToday() && !t.completed).length
  const archived = state.todos.filter(t => t.archived).length
  return { total, completed, today, pending: total - completed, archived }
}

// 分类显示名
export const CATEGORY_LABELS: Record<TodoCategory, string> = {
  work: '工作',
  life: '生活',
  study: '学习',
  other: '其他',
}

export const PRIORITY_LABELS: Record<TodoPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
}
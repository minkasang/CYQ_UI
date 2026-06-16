// 待办 Store
// 使用文件存储实现数据持久化，调用 server.py API 读写本地文件

import { create } from 'zustand'
import type { Todo, TodoCategory, TodoPriority } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'
import { getToday, startOfToday } from '../utils/date'

interface TodoState {
  todos: Todo[]
  filter: 'all' | 'today' | 'pending' | 'completed'
  loading: boolean
  loaded: boolean
  loadTodos: () => Promise<void>
  addTodo: (data: Omit<Todo, 'id' | 'createdAt' | 'completed'>) => void
  updateTodo: (id: string, patch: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleComplete: (id: string) => void
  setFilter: (filter: TodoState['filter']) => void
  clearCompleted: () => void
}

// 生成简单唯一 ID
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],
  filter: 'today',
  loading: false,
  loaded: false,

  // 从文件加载待办数据
  loadTodos: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const todos = await loadFromFile<Todo[]>(FILE_KEYS.TODOS, [])
      set({ todos, loading: false, loaded: true })
    } catch (err) {
      console.error('[TodoStore] 加载失败:', err)
      set({ loading: false, loaded: true })
    }
  },

  addTodo: (data) => {
    const todo: Todo = {
      ...data,
      id: genId(),
      createdAt: Date.now(),
      completed: false,
    }
    const newTodos = [todo, ...get().todos]
    set({ todos: newTodos })
    saveToFile(FILE_KEYS.TODOS, newTodos)
  },

  updateTodo: (id, patch) => {
    const newTodos = get().todos.map(t => t.id === id ? { ...t, ...patch } : t)
    set({ todos: newTodos })
    saveToFile(FILE_KEYS.TODOS, newTodos)
  },

  deleteTodo: (id) => {
    const newTodos = get().todos.filter(t => t.id !== id)
    set({ todos: newTodos })
    saveToFile(FILE_KEYS.TODOS, newTodos)
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
    saveToFile(FILE_KEYS.TODOS, newTodos)
  },

  setFilter: (filter) => set({ filter }),

  clearCompleted: () => {
    const newTodos = get().todos.filter(t => !t.completed)
    set({ todos: newTodos })
    saveToFile(FILE_KEYS.TODOS, newTodos)
  },
}))

// 派生选择器
export const selectFilteredTodos = (state: TodoState): Todo[] => {
  const today = getToday()
  const todayStart = startOfToday()

  switch (state.filter) {
    case 'today':
      return state.todos.filter(t =>
        t.dueDate === today ||
        (t.createdAt >= todayStart && !t.dueDate)
      )
    case 'pending':
      return state.todos.filter(t => !t.completed)
    case 'completed':
      return state.todos.filter(t => t.completed)
    default:
      return state.todos
  }
}

export const selectTodoStats = (state: TodoState) => {
  const total = state.todos.length
  const completed = state.todos.filter(t => t.completed).length
  const today = state.todos.filter(t => t.dueDate === getToday() && !t.completed).length
  return { total, completed, today, pending: total - completed }
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
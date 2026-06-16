// 待办 Store
// 给 AI 的话：使用 Zustand 管理待办状态，自动持久化到 localStorage

import { create } from 'zustand'
import type { Todo, TodoCategory, TodoPriority } from '../types'
import { loadFromStorage, saveToStorage, STORAGE_KEYS } from '../utils/storage'
import { getToday, startOfToday } from '../utils/date'

interface TodoState {
  todos: Todo[]
  filter: 'all' | 'today' | 'pending' | 'completed'
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
  todos: loadFromStorage<Todo[]>(STORAGE_KEYS.TODOS, []),
  filter: 'today',

  addTodo: (data) => {
    const todo: Todo = {
      ...data,
      id: genId(),
      createdAt: Date.now(),
      completed: false,
    }
    const newTodos = [todo, ...get().todos]
    set({ todos: newTodos })
    saveToStorage(STORAGE_KEYS.TODOS, newTodos)
  },

  updateTodo: (id, patch) => {
    const newTodos = get().todos.map(t => t.id === id ? { ...t, ...patch } : t)
    set({ todos: newTodos })
    saveToStorage(STORAGE_KEYS.TODOS, newTodos)
  },

  deleteTodo: (id) => {
    const newTodos = get().todos.filter(t => t.id !== id)
    set({ todos: newTodos })
    saveToStorage(STORAGE_KEYS.TODOS, newTodos)
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
    saveToStorage(STORAGE_KEYS.TODOS, newTodos)
  },

  setFilter: (filter) => set({ filter }),

  clearCompleted: () => {
    const newTodos = get().todos.filter(t => !t.completed)
    set({ todos: newTodos })
    saveToStorage(STORAGE_KEYS.TODOS, newTodos)
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

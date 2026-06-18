// 项目 Store
// 管理待办任务的分组项目

import { create } from 'zustand'
import type { Project } from '../types'
import { loadFromFile, saveToFile, FILE_KEYS } from '../utils/fileStorage'

interface ProjectState {
  projects: Project[]
  loading: boolean
  loaded: boolean
  loadProjects: () => Promise<void>
  addProject: (name: string, color: string) => void
  updateProject: (id: string, patch: Partial<Project>) => void
  deleteProject: (id: string) => void
  reorderProjects: (fromIndex: number, toIndex: number) => void
}

// 生成简单唯一 ID
function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// 预设颜色
export const PROJECT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  loading: false,
  loaded: false,

  loadProjects: async () => {
    if (get().loaded || get().loading) return
    set({ loading: true })
    try {
      const projects = await loadFromFile<Project[]>(FILE_KEYS.PROJECTS, [])
      set({ projects, loading: false, loaded: true })
    } catch (err) {
      console.error('[ProjectStore] 加载失败:', err)
      set({ loading: false, loaded: true })
    }
  },

  addProject: (name, color) => {
    const project: Project = {
      id: genId(),
      name,
      color,
      order: Date.now(),
      createdAt: Date.now(),
    }
    const newProjects = [...get().projects, project]
    set({ projects: newProjects })
    saveToFile(FILE_KEYS.PROJECTS, newProjects)
  },

  updateProject: (id, patch) => {
    const newProjects = get().projects.map(p =>
      p.id === id ? { ...p, ...patch } : p
    )
    set({ projects: newProjects })
    saveToFile(FILE_KEYS.PROJECTS, newProjects)
  },

  deleteProject: (id) => {
    const newProjects = get().projects.filter(p => p.id !== id)
    set({ projects: newProjects })
    saveToFile(FILE_KEYS.PROJECTS, newProjects)
  },

  reorderProjects: (fromIndex, toIndex) => {
    const projects = [...get().projects]
    const [removed] = projects.splice(fromIndex, 1)
    projects.splice(toIndex, 0, removed)
    const updatedProjects = projects.map((p, i) => ({ ...p, order: i }))
    set({ projects: updatedProjects })
    saveToFile(FILE_KEYS.PROJECTS, updatedProjects)
  },
}))

// 选择器：按顺序获取项目
export const selectOrderedProjects = (state: ProjectState): Project[] => {
  return [...state.projects].sort((a, b) => a.order - b.order)
}

// 待办模块
// 给 AI 的话：包装现有待办功能，确保不破坏现有功能

import type { Module, ModuleContext } from '../../types/module'
import { TodoPage } from './pages/TodoPage'
import { useTodoStore } from '../../store/useTodoStore'
import { useProjectStore } from '../../store/useProjectStore'
import { useTagStore } from '../../store/useTagStore'
import { useAchievementStore } from '../../store/useAchievementStore'

/**
 * 待办模块
 * 遵循单一职责原则（SRP）：只负责待办管理
 */
export const TodoModule: Module = {
  // ========== 元数据 ==========
  metadata: {
    id: 'todo',
    name: '待办管理',
    version: '1.0.0',
    description: '管理工作与生活的任务清单',
    author: 'Personal Workbench Team',
    dependencies: ['settings', 'wallpaper'],
    tags: ['todo', 'task', 'management'],
    icon: 'check-square'
  },

  // ========== 能力 ==========
  capabilities: {
    routes: true,
    stores: true,
    components: false,
    services: false,
    api: true
  },

  // ========== 路由 ==========
  routes: [
    {
      path: 'todo',
      element: TodoPage,
      meta: {
        title: '每日待办',
        icon: 'check-square'
      }
    }
  ],

  // ========== Store ==========
  stores: [
    {
      name: 'todo',
      store: useTodoStore,
      persist: true,
      persistKey: 'pw_todos'
    },
    {
      name: 'project',
      store: useProjectStore,
      persist: true,
      persistKey: 'pw_projects'
    },
    {
      name: 'tag',
      store: useTagStore,
      persist: true,
      persistKey: 'pw_tags'
    },
    {
      name: 'achievement',
      store: useAchievementStore,
      persist: true,
      persistKey: 'pw_achievements'
    }
  ],

  // ========== 公共API ==========
  api: {
    // 待办操作
    addTodo: (data: any) => useTodoStore.getState().addTodo(data),
    updateTodo: (id: string, patch: any) => useTodoStore.getState().updateTodo(id, patch),
    deleteTodo: (id: string) => useTodoStore.getState().deleteTodo(id),
    toggleComplete: (id: string) => useTodoStore.getState().toggleComplete(id),
    getTodos: () => useTodoStore.getState().todos,

    // 子任务操作
    addSubTask: (todoId: string, title: string) => useTodoStore.getState().addSubTask(todoId, title),
    updateSubTask: (todoId: string, subtaskId: string, patch: any) => useTodoStore.getState().updateSubTask(todoId, subtaskId, patch),
    deleteSubTask: (todoId: string, subtaskId: string) => useTodoStore.getState().deleteSubTask(todoId, subtaskId),
    toggleSubTask: (todoId: string, subtaskId: string) => useTodoStore.getState().toggleSubTask(todoId, subtaskId),

    // 标签操作
    addTag: (todoId: string, tagId: string) => useTodoStore.getState().addTag(todoId, tagId),
    removeTag: (todoId: string, tagId: string) => useTodoStore.getState().removeTag(todoId, tagId),

    // 时间追踪
    startTimeEntry: (todoId: string) => useTodoStore.getState().startTimeEntry(todoId),
    stopTimeEntry: (todoId: string) => useTodoStore.getState().stopTimeEntry(todoId),

    // 归档
    archiveTodo: (id: string) => useTodoStore.getState().archiveTodo(id),
    unarchiveTodo: (id: string) => useTodoStore.getState().unarchiveTodo(id),

    // 项目操作
    addProject: (name: string, color: string) => useProjectStore.getState().addProject(name, color),
    updateProject: (id: string, patch: any) => useProjectStore.getState().updateProject(id, patch),
    deleteProject: (id: string) => useProjectStore.getState().deleteProject(id),
    getProjects: () => useProjectStore.getState().projects,

    // 标签管理
    getTags: () => useTagStore.getState().tags,

    // 成就系统
    getUnlockedAchievements: () => useAchievementStore.getState().unlockedIds,
    getStats: () => useAchievementStore.getState().stats
  },

  // ========== 生命周期 ==========
  async install(_context: ModuleContext): Promise<void> {
    console.log('[TodoModule] 安装开始')

    // 加载数据
    await useTodoStore.getState().loadTodos()
    await useProjectStore.getState().loadProjects()
    await useTagStore.getState().loadTags()
    await useAchievementStore.getState().loadAchievements()

    console.log('[TodoModule] 安装完成')
  },

  async uninstall(): Promise<void> {
    console.log('[TodoModule] 卸载开始')

    // 清理资源
    // 注意：不清理数据，数据持久化在文件中

    console.log('[TodoModule] 卸载完成')
  },

  async enable(): Promise<void> {
    console.log('[TodoModule] 启用')
  },

  async disable(): Promise<void> {
    console.log('[TodoModule] 禁用')
  }
}

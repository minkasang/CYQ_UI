// 日记模块
// 给 AI 的话：包装现有日记功能，确保不破坏现有功能

import type { Module, ModuleContext } from '../../types/module'
import { DiaryPage } from './pages/DiaryPage'
import { useDiaryStore } from '../../store/useDiaryStore'

/**
 * 日记模块
 * 遵循单一职责原则（SRP）：只负责日记管理
 */
export const DiaryModule: Module = {
  // ========== 元数据 ==========
  metadata: {
    id: 'diary',
    name: '日记',
    version: '1.0.0',
    description: '记录生活与心情的日记本',
    author: 'Personal Workbench Team',
    dependencies: ['settings', 'wallpaper'],
    tags: ['diary', 'journal', 'notes'],
    icon: 'book'
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
      path: 'diary',
      element: DiaryPage,
      meta: {
        title: '日记',
        icon: 'book'
      }
    }
  ],

  // ========== Store ==========
  stores: [
    {
      name: 'diary',
      store: useDiaryStore,
      persist: true,
      persistKey: 'pw_diaries'
    }
  ],

  // ========== 公共API ==========
  api: {
    // 日记操作
    createDiary: (date?: string) => useDiaryStore.getState().createDiary(date),
    updateDiary: (id: string, patch: any) => useDiaryStore.getState().updateDiary(id, patch),
    deleteDiary: (id: string) => useDiaryStore.getState().deleteDiary(id),
    getDiaries: () => useDiaryStore.getState().diaries,
    getDiary: (id: string) => useDiaryStore.getState().diaries.find(d => d.id === id),
    getDiaryByDate: (date: string) => useDiaryStore.getState().getDiaryByDate(date),

    // 搜索
    searchDiaries: (keyword: string) => useDiaryStore.getState().diaries.filter(
      d => d.title.includes(keyword) || d.content.includes(keyword)
    ),

    // 按日期获取
    getDiariesByDate: (date: string) => useDiaryStore.getState().diaries.filter(
      d => d.date === date
    ),

    // 按标签获取
    getDiariesByTag: (tag: string) => useDiaryStore.getState().diaries.filter(
      d => d.tags && d.tags.includes(tag)
    ),

    // 标签管理
    getAllTags: () => {
      const tags = new Set<string>()
      useDiaryStore.getState().diaries.forEach(d => {
        if (d.tags) {
          d.tags.forEach(t => tags.add(t))
        }
      })
      return Array.from(tags)
    }
  },

  // ========== 生命周期 ==========
  async install(_context: ModuleContext): Promise<void> {
    console.log('[DiaryModule] 安装开始')

    // 加载数据
    await useDiaryStore.getState().loadDiaries()

    console.log('[DiaryModule] 安装完成')
  },

  async uninstall(): Promise<void> {
    console.log('[DiaryModule] 卸载开始')

    // 清理资源
    // 注意：不清理数据，数据持久化在文件中

    console.log('[DiaryModule] 卸载完成')
  },

  async enable(): Promise<void> {
    console.log('[DiaryModule] 启用')
  },

  async disable(): Promise<void> {
    console.log('[DiaryModule] 禁用')
  }
}

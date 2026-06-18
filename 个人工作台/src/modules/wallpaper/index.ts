// 壁纸模块
// 给 AI 的话：包装现有壁纸功能，确保不破坏现有功能

import type { Module, ModuleContext } from '../../types/module'
import { WallpaperPage } from './pages/WallpaperPage'
import { useWallpaperStore } from '../../store/useWallpaperStore'

/**
 * 壁纸模块
 * 遵循单一职责原则（SRP）：只负责壁纸管理
 */
export const WallpaperModule: Module = {
  // ========== 元数据 ==========
  metadata: {
    id: 'wallpaper',
    name: '壁纸管理',
    version: '1.0.0',
    description: '管理个人工作台的壁纸',
    author: 'Personal Workbench Team',
    dependencies: [],
    tags: ['wallpaper', 'background', 'theme'],
    icon: 'image'
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
      path: 'wallpaper',
      element: WallpaperPage,
      meta: {
        title: '壁纸管理',
        icon: 'image'
      }
    }
  ],

  // ========== Store ==========
  stores: [
    {
      name: 'wallpaper',
      store: useWallpaperStore,
      persist: true,
      persistKey: 'pw_wallpaper'
    }
  ],

  // ========== 公共API ==========
  api: {
    // 壁纸操作
    getCurrentWallpaper: () => useWallpaperStore.getState().current,
    setWallpaper: (wallpaper: any) => useWallpaperStore.getState().setCurrent(wallpaper),
    getWallpaperHistory: () => useWallpaperStore.getState().history,
    addToHistory: (wallpaper: any) => useWallpaperStore.getState().addToHistory(wallpaper),
    removeFromHistory: (id: string) => useWallpaperStore.getState().removeFromHistory(id),
    getPresets: () => useWallpaperStore.getState().presets,
    addCustom: (type: any, value: string, name?: string) => useWallpaperStore.getState().addCustom(type, value, name),

    // 壁纸类型
    isUrlWallpaper: (wallpaper: any) => wallpaper.type === 'url',
    isLocalWallpaper: (wallpaper: any) => wallpaper.type === 'local',
    isColorWallpaper: (wallpaper: any) => wallpaper.type === 'color',
    isGradientWallpaper: (wallpaper: any) => wallpaper.type === 'gradient'
  },

  // ========== 生命周期 ==========
  async install(_context: ModuleContext): Promise<void> {
    console.log('[WallpaperModule] 安装开始')

    // 加载数据
    await useWallpaperStore.getState().loadFromFile()

    console.log('[WallpaperModule] 安装完成')
  },

  async uninstall(): Promise<void> {
    console.log('[WallpaperModule] 卸载开始')

    // 清理资源
    // 注意：不清理数据，数据持久化在文件中

    console.log('[WallpaperModule] 卸载完成')
  },

  async enable(): Promise<void> {
    console.log('[WallpaperModule] 启用')
  },

  async disable(): Promise<void> {
    console.log('[WallpaperModule] 禁用')
  }
}

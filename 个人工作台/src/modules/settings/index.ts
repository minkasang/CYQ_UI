// 设置模块
// 给 AI 的话：包装现有设置功能，确保不破坏现有功能

import type { Module, ModuleContext } from '../../types/module'
import { SettingsPage } from './pages/SettingsPage'
import { useSettingsStore } from '../../store/useSettingsStore'

/**
 * 设置模块
 * 遵循单一职责原则（SRP）：只负责设置管理
 */
export const SettingsModule: Module = {
  // ========== 元数据 ==========
  metadata: {
    id: 'settings',
    name: '设置',
    version: '1.0.0',
    description: '管理个人工作台的设置',
    author: 'Personal Workbench Team',
    dependencies: [],
    tags: ['settings', 'config', 'preferences'],
    icon: 'settings'
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
      path: 'settings',
      element: SettingsPage,
      meta: {
        title: '设置',
        icon: 'settings'
      }
    }
  ],

  // ========== Store ==========
  stores: [
    {
      name: 'settings',
      store: useSettingsStore,
      persist: true,
      persistKey: 'pw_settings'
    }
  ],

  // ========== 公共API ==========
  api: {
    // 设置操作
    getSettings: () => useSettingsStore.getState().settings,
    resetAll: () => useSettingsStore.getState().resetAll(),

    // 玻璃设置
    getGlassConfig: () => useSettingsStore.getState().settings.glass,
    setGlass: (patch: any) => useSettingsStore.getState().setGlass(patch),
    resetGlass: () => useSettingsStore.getState().resetGlass(),

    // 主题设置
    getTheme: () => useSettingsStore.getState().settings.theme,
    setTheme: (theme: any) => useSettingsStore.getState().setTheme(theme),

    // 语言设置
    getLanguage: () => useSettingsStore.getState().settings.language,
    setLanguage: (language: any) => useSettingsStore.getState().setLanguage(language),

    // 日记设置
    getDiarySettings: () => useSettingsStore.getState().settings.diary,
    setDiarySettings: (patch: any) => useSettingsStore.getState().setDiarySettings(patch)
  },

  // ========== 生命周期 ==========
  async install(_context: ModuleContext): Promise<void> {
    console.log('[SettingsModule] 安装开始')

    // 加载数据
    await useSettingsStore.getState().loadFromFile()

    console.log('[SettingsModule] 安装完成')
  },

  async uninstall(): Promise<void> {
    console.log('[SettingsModule] 卸载开始')

    // 清理资源
    // 注意：不清理数据，数据持久化在文件中

    console.log('[SettingsModule] 卸载完成')
  },

  async enable(): Promise<void> {
    console.log('[SettingsModule] 启用')
  },

  async disable(): Promise<void> {
    console.log('[SettingsModule] 禁用')
  }
}

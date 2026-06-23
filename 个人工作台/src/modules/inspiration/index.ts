// 每日灵感模块 — 仅首页 Section，无独立路由
import type { Module, ModuleContext } from '../../types/module'
import { useInspirationStore } from '../../store/useInspirationStore'
import { InspirationPage } from './pages/InspirationPage'

export const InspirationModule: Module = {
  metadata: {
    id: 'inspiration',
    name: '每日灵感',
    version: '1.0.0',
    description: '个人数字 Commonplace Book — 捕获触动自己的名言与哲理',
    author: 'Personal Workbench Team',
    dependencies: [],
    tags: ['inspiration', 'quotes', 'commonplace', 'memo'],
    icon: 'lightbulb',
  },

  capabilities: {
    routes: true,
    stores: true,
    components: false,
    services: false,
    api: false,
  },

  routes: [
    {
      path: 'inspiration',
      element: InspirationPage,
      meta: { title: '每日灵感', icon: 'lightbulb' },
    },
  ],

  stores: [
    {
      name: 'inspiration',
      store: useInspirationStore,
      persist: true,
      persistKey: 'pw-inspiration',
    },
  ],

  async install(_context: ModuleContext): Promise<void> {
    console.log('[InspirationModule] 安装完成')
  },

  async uninstall(): Promise<void> {
    console.log('[InspirationModule] 卸载')
  },

  async enable(): Promise<void> {
    console.log('[InspirationModule] 启用')
  },

  async disable(): Promise<void> {
    console.log('[InspirationModule] 禁用')
  },
}

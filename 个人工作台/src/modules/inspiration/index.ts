// 人生图谱模块 — 从每日灵感升级，保留 inspiration 路由与持久化 key
import type { Module, ModuleContext } from '../../types/module'
import { useInspirationStore } from '../../store/useInspirationStore'
import { InspirationPage } from './pages/InspirationPage'

export const InspirationModule: Module = {
  metadata: {
    id: 'inspiration',
    name: '人生图谱',
    version: '1.0.0',
    description: '记录、理解并转化那些会慢慢改变自己的东西',
    author: 'Personal Workbench Team',
    dependencies: [],
    tags: ['inspiration', 'life-atlas', 'commonplace', 'reflection'],
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
      meta: { title: '人生图谱', icon: 'lightbulb' },
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

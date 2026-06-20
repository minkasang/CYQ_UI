// 主题模块 — 模块系统注册
import type { Module } from '../../types/module'
import { ThemePage } from './pages/ThemePage'

export const ThemeModule: Module = {
  metadata: {
    id: 'theme',
    name: '主题管理',
    version: '1.0.0',
    description: '浏览、创建、切换主题',
    icon: '🎨',
  },
  capabilities: {
    routes: true,
    stores: false,
    components: false,
    services: false,
    api: false,
  },
  routes: [
    {
      path: '/theme',
      element: ThemePage,
    },
  ],
  install: async () => { /* no-op */ },
  uninstall: async () => { /* no-op */ },
  stores: [],
}

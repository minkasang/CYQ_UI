// 多 Agent 群聊模块
// 独立路由 /agents

import type { Module, ModuleContext } from '../../types/module'
import { useAgentStore } from '../../store/useAgentStore'
import { AgentsChatPage } from './pages/AgentsChatPage'

export const AgentsModule: Module = {
  metadata: {
    id: 'agents',
    name: '多 Agent 群聊',
    version: '1.0.0',
    description: '创建多个 AI Agent，让它们在群聊中自主互动',
    author: 'Personal Workbench Team',
    dependencies: [],
    tags: ['agents', 'multi-agent', 'group-chat'],
    icon: 'users',
  },

  capabilities: {
    routes: true,
    stores: true,
    components: false,
    services: false,
    api: false,
  },

  routes: [
    { path: 'agents', element: AgentsChatPage },
  ],

  stores: [
    {
      name: 'agent',
      store: useAgentStore,
      persist: true,
      persistKey: 'pw-agents',
    },
  ],

  async install(_context: ModuleContext): Promise<void> {
    console.log('[AgentsModule] 安装完成')
  },

  async uninstall(): Promise<void> {
    console.log('[AgentsModule] 卸载')
  },

  async enable(): Promise<void> {
    console.log('[AgentsModule] 启用')
  },

  async disable(): Promise<void> {
    console.log('[AgentsModule] 禁用')
  },
}

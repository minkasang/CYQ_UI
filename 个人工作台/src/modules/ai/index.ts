// AI模块
// 给 AI 的话：包装现有AI功能，确保不破坏现有功能

import type { Module, ModuleContext } from '../../types/module'
import { AIPage } from './pages/AIPage'
import { useAIConfigStore } from '../../store/useAIConfigStore'
import { useAPIKeysStore } from '../../store/useAPIKeysStore'
import { useChatStore } from '../../store/useChatStore'

/**
 * AI模块
 * 遵循单一职责原则（SRP）：只负责AI功能
 */
export const AIModule: Module = {
  // ========== 元数据 ==========
  metadata: {
    id: 'ai',
    name: 'AI助手',
    version: '1.0.0',
    description: '多模型AI助手，支持对话、图片生成、视频生成',
    author: 'Personal Workbench Team',
    dependencies: ['settings'],
    tags: ['ai', 'chat', 'assistant'],
    icon: 'bot'
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
      path: 'ai',
      element: AIPage,
      meta: {
        title: 'AI助手',
        icon: 'bot'
      }
    }
  ],

  // ========== Store ==========
  stores: [
    {
      name: 'aiConfig',
      store: useAIConfigStore,
      persist: true,
      persistKey: 'pw_ai_config'
    },
    {
      name: 'apiKeys',
      store: useAPIKeysStore,
      persist: true,
      persistKey: 'pw_api_keys'
    },
    {
      name: 'chat',
      store: useChatStore,
      persist: true,
      persistKey: 'pw_chats'
    }
  ],

  // ========== 公共API ==========
  api: {
    // AI配置
    getAIConfig: () => useAIConfigStore.getState().config,
    setConfig: (config: any) => useAIConfigStore.getState().setConfig(config),
    setProvider: (provider: any) => useAIConfigStore.getState().setProvider(provider),
    setModel: (model: string) => useAIConfigStore.getState().setModel(model),

    // API密钥管理
    getAPIKeys: () => useAPIKeysStore.getState().keys,
    hasKey: (provider: any) => useAPIKeysStore.getState().hasKey(provider),

    // 聊天管理
    getChats: () => useChatStore.getState().chats,
    createChat: (provider: any, model: string) => useChatStore.getState().createChat(provider, model),
    deleteChat: (id: string) => useChatStore.getState().deleteChat(id),

    // 消息管理
    addMessage: (chatId: string, role: 'user' | 'assistant', content: string) => useChatStore.getState().addMessage(chatId, role, content),
    clearMessages: (chatId: string) => useChatStore.getState().clearMessages(chatId)
  },

  // ========== 生命周期 ==========
  async install(_context: ModuleContext): Promise<void> {
    console.log('[AIModule] 安装开始')

    // 加载数据
    await useAIConfigStore.getState().loadFromFile()
    await useAPIKeysStore.getState().loadFromFile()
    await useChatStore.getState().loadChats()

    console.log('[AIModule] 安装完成')
  },

  async uninstall(): Promise<void> {
    console.log('[AIModule] 卸载开始')

    // 清理资源
    // 注意：不清理数据，数据持久化在文件中

    console.log('[AIModule] 卸载完成')
  },

  async enable(): Promise<void> {
    console.log('[AIModule] 启用')
  },

  async disable(): Promise<void> {
    console.log('[AIModule] 禁用')
  }
}

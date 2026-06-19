// 模块注册中心 — 全局单例
// 提供 ModuleManager，供 useModuleRoutes 使用
import { ModuleManager } from './ModuleManager'
import { EventBus, Logger } from './ModuleContext'
import type { Module, ModuleContext } from '../types/module'

let _manager: ModuleManager | null = null

function createContext(): ModuleContext {
  return {
    eventBus: new EventBus(),
    logger: new Logger('ModuleRegistry'),
    config: {},
    router: null,
    storeManager: null,
    moduleManager: null
  }
}

export function getModuleManager(): ModuleManager {
  if (!_manager) {
    const context = createContext()
    _manager = new ModuleManager(context)
  }
  return _manager
}

export async function installModule(module: Module): Promise<void> {
  const mgr = getModuleManager()
  if (!mgr.getModule(module.metadata.id)) {
    mgr.registerModule(module)
  }
  await mgr.installModule(module.metadata.id)
}

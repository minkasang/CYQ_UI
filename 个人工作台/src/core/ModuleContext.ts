// 模块上下文
// 给 AI 的话：提供模块所需的共享资源，确保不破坏现有功能

import type { ModuleContext } from '../types/module'

/**
 * 事件总线
 * 遵循单一职责原则（SRP）：只负责事件通信
 */
export class EventBus {
  private listeners: Map<string, Set<Function>> = new Map()

  /**
   * 订阅事件
   */
  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  /**
   * 取消订阅
   */
  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 触发事件
   */
  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`[EventBus] 事件处理错误: ${event}`, error)
        }
      })
    }
  }

  /**
   * 清空所有监听器
   */
  clear(): void {
    this.listeners.clear()
  }
}

/**
 * 日志工具
 * 遵循单一职责原则（SRP）：只负责日志记录
 */
export class Logger {
  private prefix: string

  constructor(prefix: string = 'App') {
    this.prefix = prefix
  }

  /**
   * 信息日志
   */
  info(message: string, ...args: any[]): void {
    console.log(`[${this.prefix}] ${message}`, ...args)
  }

  /**
   * 警告日志
   */
  warn(message: string, ...args: any[]): void {
    console.warn(`[${this.prefix}] ${message}`, ...args)
  }

  /**
   * 错误日志
   */
  error(message: string, ...args: any[]): void {
    console.error(`[${this.prefix}] ${message}`, ...args)
  }

  /**
   * 调试日志
   */
  debug(message: string, ...args: any[]): void {
    // 调试日志只在开发时使用，生产环境会被移除
    console.debug(`[${this.prefix}] ${message}`, ...args)
  }
}

/**
 * 配置管理
 * 遵循单一职责原则（SRP）：只负责配置管理
 */
export class ConfigManager {
  private config: Map<string, any> = new Map()

  /**
   * 设置配置
   */
  set(key: string, value: any): void {
    this.config.set(key, value)
  }

  /**
   * 获取配置
   */
  get<T = any>(key: string, defaultValue?: T): T | undefined {
    return this.config.has(key) ? this.config.get(key) : defaultValue
  }

  /**
   * 删除配置
   */
  delete(key: string): boolean {
    return this.config.delete(key)
  }

  /**
   * 清空配置
   */
  clear(): void {
    this.config.clear()
  }
}

/**
 * Store 管理器
 * 遵循单一职责原则（SRP）：只负责 Store 管理
 */
export class StoreManager {
  private stores: Map<string, any> = new Map()

  /**
   * 注册 Store
   */
  register(name: string, store: any): void {
    if (this.stores.has(name)) {
      console.warn(`[StoreManager] Store 已存在: ${name}`)
      return
    }
    this.stores.set(name, store)
    console.log(`[StoreManager] Store 已注册: ${name}`)
  }

  /**
   * 注销 Store
   */
  unregister(name: string): void {
    this.stores.delete(name)
    console.log(`[StoreManager] Store 已注销: ${name}`)
  }

  /**
   * 获取 Store
   */
  get<T = any>(name: string): T | undefined {
    return this.stores.get(name)
  }

  /**
   * 获取所有 Store
   */
  getAll(): Map<string, any> {
    return new Map(this.stores)
  }

  /**
   * 清空所有 Store
   */
  clear(): void {
    this.stores.clear()
  }
}

/**
 * 路由管理器
 * 遵循单一职责原则（SRP）：只负责路由管理
 */
export class RouterManager {
  private routes: any[] = []

  /**
   * 添加路由
   */
  addRoutes(routes: any[]): void {
    this.routes.push(...routes)
    console.log(`[RouterManager] 添加路由: ${routes.length} 个`)
  }

  /**
   * 移除路由
   */
  removeRoutes(routes: any[]): void {
    // TODO: 实现路由移除逻辑
    console.log(`[RouterManager] 移除路由: ${routes.length} 个`)
  }

  /**
   * 获取所有路由
   */
  getRoutes(): any[] {
    return [...this.routes]
  }

  /**
   * 清空所有路由
   */
  clear(): void {
    this.routes = []
  }
}

/**
 * 创建模块上下文
 */
export function createModuleContext(moduleManager: any): ModuleContext {
  return {
    router: new RouterManager(),
    storeManager: new StoreManager(),
    eventBus: new EventBus(),
    logger: new Logger('Module'),
    config: new ConfigManager(),
    moduleManager
  }
}

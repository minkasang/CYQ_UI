// 模块系统类型定义
// 给 AI 的话：这是模块系统的核心接口定义，遵循 SOLID 原则

import type { ComponentType } from 'react'

// ========== 模块元数据 ==========

/**
 * 模块元数据
 * 遵循接口隔离原则（ISP）：只包含必要信息
 */
export interface ModuleMetadata {
  id: string                    // 模块唯一标识
  name: string                  // 模块显示名称
  version: string               // 模块版本
  description?: string          // 模块描述
  author?: string               // 作者
  dependencies?: string[]       // 依赖的其他模块ID
  tags?: string[]               // 标签
  icon?: string                 // 图标
  preview?: string              // 预览图
}

// ========== 模块能力 ==========

/**
 * 模块能力标记
 * 遵循接口隔离原则（ISP）：小接口优于大接口
 */
export interface ModuleCapabilities {
  routes: boolean               // 是否提供路由
  stores: boolean               // 是否提供状态管理
  components: boolean           // 是否提供组件
  services: boolean             // 是否提供服务
  api: boolean                  // 是否提供API
}

// ========== 路由配置 ==========

/**
 * 路由元数据
 */
export interface RouteMeta {
  title?: string                // 页面标题
  icon?: string                 // 图标
  hidden?: boolean              // 是否隐藏
  auth?: boolean                // 是否需要认证
}

/**
 * 路由配置
 * 遵循单一职责原则（SRP）：只负责路由配置
 */
export interface RouteConfig {
  path: string                  // 路由路径
  element: ComponentType        // 路由组件
  children?: RouteConfig[]      // 子路由
  meta?: RouteMeta              // 路由元数据
}

// ========== Store 配置 ==========

/**
 * Store 配置
 * 遵循单一职责原则（SRP）：只负责 Store 配置
 */
export interface StoreConfig {
  name: string                  // Store名称
  store: any                    // Store实例
  persist?: boolean             // 是否持久化
  persistKey?: string           // 持久化key
}

// ========== 组件配置 ==========

/**
 * 组件配置
 * 遵循单一职责原则（SRP）：只负责组件配置
 */
export interface ComponentConfig {
  name: string                  // 组件名称
  component: ComponentType      // 组件类型
  description?: string          // 组件描述
  props?: Record<string, any>   // 默认props
}

// ========== 服务配置 ==========

/**
 * 服务配置
 * 遵循单一职责原则（SRP）：只负责服务配置
 */
export interface ServiceConfig {
  name: string                  // 服务名称
  service: any                  // 服务实例
  description?: string          // 服务描述
  singleton?: boolean           // 是否单例
}

// ========== 模块上下文 ==========

/**
 * 模块上下文
 * 遵循依赖反转原则（DIP）：模块依赖抽象接口
 */
export interface ModuleContext {
  router: any                   // 路由管理器
  storeManager: any             // Store管理器
  eventBus: any                 // 事件总线
  logger: any                   // 日志工具
  config: any                   // 配置管理
  moduleManager: any            // 模块管理器
}

// ========== 模块生命周期 ==========

/**
 * 模块生命周期
 * 遵循接口隔离原则（ISP）：接口小而精
 */
export interface ModuleLifecycle {
  /**
   * 模块安装
   * @param context 模块上下文
   * @throws ModuleInstallError 安装失败时抛出
   */
  install(context: ModuleContext): Promise<void>

  /**
   * 模块卸载
   */
  uninstall(): Promise<void>

  /**
   * 模块启用
   */
  enable?(): Promise<void>

  /**
   * 模块禁用
   */
  disable?(): Promise<void>

  /**
   * 模块更新
   * @param oldVersion 旧版本
   * @param newVersion 新版本
   */
  update?(oldVersion: string, newVersion: string): Promise<void>
}

// ========== 模块接口 ==========

/**
 * 模块接口
 * 遵循接口隔离原则（ISP）：组合多个小接口
 * 遵循开闭原则（OCP）：扩展功能不修改接口
 */
export interface Module extends ModuleLifecycle {
  // ========== 元数据 ==========
  metadata: ModuleMetadata

  // ========== 能力 ==========
  capabilities: ModuleCapabilities

  // ========== 路由 ==========
  routes?: RouteConfig[]

  // ========== Store ==========
  stores?: StoreConfig[]

  // ========== 组件 ==========
  components?: ComponentConfig[]

  // ========== 服务 ==========
  services?: ServiceConfig[]

  // ========== 公共API ==========
  api?: Record<string, any>
}

// ========== 模块状态 ==========

/**
 * 模块状态
 */
export enum ModuleState {
  REGISTERED = 'registered',     // 已注册
  INSTALLED = 'installed',       // 已安装
  ENABLED = 'enabled',           // 已启用
  DISABLED = 'disabled',         // 已禁用
  ERROR = 'error'                // 错误状态
}

// ========== 模块信息 ==========

/**
 * 模块信息（包含状态）
 */
export interface ModuleInfo {
  module: Module                 // 模块实例
  state: ModuleState             // 模块状态
  installedAt?: number           // 安装时间
  enabledAt?: number             // 启用时间
  error?: Error                  // 错误信息
}

// ========== 模块错误类型 ==========

/**
 * 模块错误基类
 * 遵循业务异常与技术异常分离原则
 */
export class ModuleError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ModuleError'
  }
}

// 业务异常
export class ModuleNotFoundError extends ModuleError {
  constructor(moduleId: string) {
    super(`模块未找到: ${moduleId}`, 'MODULE_NOT_FOUND')
  }
}

export class ModuleInstallError extends ModuleError {
  constructor(moduleId: string, reason: string) {
    super(`模块安装失败: ${moduleId}, 原因: ${reason}`, 'MODULE_INSTALL_FAILED')
  }
}

export class ModuleUninstallError extends ModuleError {
  constructor(moduleId: string, reason: string) {
    super(`模块卸载失败: ${moduleId}, 原因: ${reason}`, 'MODULE_UNINSTALL_FAILED')
  }
}

export class ModuleDependencyError extends ModuleError {
  constructor(moduleId: string, dependencyId: string) {
    super(
      `模块依赖错误: ${moduleId} 依赖 ${dependencyId}`,
      'MODULE_DEPENDENCY_ERROR'
    )
  }
}

export class ModuleVersionError extends ModuleError {
  constructor(moduleId: string, version: string, requiredVersion: string) {
    super(
      `模块版本错误: ${moduleId} 版本 ${version} 不满足要求 ${requiredVersion}`,
      'MODULE_VERSION_ERROR'
    )
  }
}

// 技术异常
export class ModuleStateError extends ModuleError {
  constructor(moduleId: string, currentState: ModuleState, expectedState: ModuleState) {
    super(
      `模块状态错误: ${moduleId} 当前状态 ${currentState}，期望状态 ${expectedState}`,
      'MODULE_STATE_ERROR'
    )
  }
}

// ========== 模块管理器接口 ==========

/**
 * 模块管理器接口
 * 遵循接口隔离原则（ISP）：接口小而精
 */
export interface ModuleManagerInterface {
  // ========== 模块注册 ==========
  /**
   * 注册模块
   * @param module 模块实例
   * @throws ModuleDependencyError 依赖未满足时抛出
   */
  registerModule(module: Module): void

  /**
   * 注销模块
   * @param moduleId 模块ID
   */
  unregisterModule(moduleId: string): void

  // ========== 模块安装 ==========
  /**
   * 安装模块
   * @param moduleId 模块ID
   * @throws ModuleNotFoundError 模块未找到时抛出
   * @throws ModuleInstallError 安装失败时抛出
   */
  installModule(moduleId: string): Promise<void>

  /**
   * 卸载模块
   * @param moduleId 模块ID
   * @throws ModuleUninstallError 卸载失败时抛出
   */
  uninstallModule(moduleId: string): Promise<void>

  // ========== 模块查询 ==========
  /**
   * 获取模块
   * @param moduleId 模块ID
   */
  getModule(moduleId: string): Module | null

  /**
   * 获取所有模块
   */
  getAllModules(): Module[]

  /**
   * 获取已安装的模块
   */
  getInstalledModules(): Module[]

  /**
   * 检查模块是否已安装
   * @param moduleId 模块ID
   */
  isModuleInstalled(moduleId: string): boolean

  // ========== 模块状态 ==========
  /**
   * 启用模块
   * @param moduleId 模块ID
   */
  enableModule(moduleId: string): Promise<void>

  /**
   * 禁用模块
   * @param moduleId 模块ID
   */
  disableModule(moduleId: string): Promise<void>

  /**
   * 检查模块是否已启用
   * @param moduleId 模块ID
   */
  isModuleEnabled(moduleId: string): boolean

  /**
   * 获取模块状态
   * @param moduleId 模块ID
   */
  getModuleState(moduleId: string): ModuleState | null
}

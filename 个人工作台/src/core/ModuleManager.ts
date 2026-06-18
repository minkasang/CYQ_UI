// 模块管理器
// 给 AI 的话：管理模块的注册、安装、卸载、查询等操作，确保不破坏现有功能

import type {
  Module,
  ModuleInfo,
  ModuleContext,
  ModuleManagerInterface
} from '../types/module'
import {
  ModuleState,
  ModuleNotFoundError,
  ModuleInstallError,
  ModuleUninstallError,
  ModuleDependencyError,
  ModuleStateError
} from '../types/module'

/**
 * 模块管理器
 * 遵循单一职责原则（SRP）：只负责模块管理
 */
export class ModuleManager implements ModuleManagerInterface {
  private modules: Map<string, ModuleInfo> = new Map()
  private context: ModuleContext

  constructor(context: ModuleContext) {
    this.context = context
  }

  // ========== 模块注册 ==========

  /**
   * 注册模块
   */
  registerModule(module: Module): void {
    try {
      // 验证模块元数据
      this.validateModuleMetadata(module.metadata)

      // 检查依赖
      this.checkDependencies(module.metadata.dependencies || [])

      // 注册模块
      const moduleInfo: ModuleInfo = {
        module,
        state: ModuleState.REGISTERED
      }

      this.modules.set(module.metadata.id, moduleInfo)
      console.log(`[ModuleManager] 模块已注册: ${module.metadata.name} (${module.metadata.id})`)
    } catch (error) {
      throw new ModuleInstallError(
        module.metadata.id,
        `注册失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 注销模块
   */
  unregisterModule(moduleId: string): void {
    const moduleInfo = this.modules.get(moduleId)
    if (!moduleInfo) {
      console.warn(`[ModuleManager] 模块未找到: ${moduleId}`)
      return
    }

    // 如果模块已安装，先卸载
    if (moduleInfo.state === ModuleState.INSTALLED ||
        moduleInfo.state === ModuleState.ENABLED) {
      this.uninstallModule(moduleId)
    }

    this.modules.delete(moduleId)
    console.log(`[ModuleManager] 模块已注销: ${moduleId}`)
  }

  // ========== 模块安装 ==========

  /**
   * 安装模块
   */
  async installModule(moduleId: string): Promise<void> {
    const moduleInfo = this.modules.get(moduleId)
    if (!moduleInfo) {
      throw new ModuleNotFoundError(moduleId)
    }

    // 检查模块状态
    if (moduleInfo.state !== ModuleState.REGISTERED) {
      throw new ModuleStateError(
        moduleId,
        moduleInfo.state,
        ModuleState.REGISTERED
      )
    }

    try {
      // 安装依赖
      const dependencies = moduleInfo.module.metadata.dependencies || []
      for (const depId of dependencies) {
        if (!this.isModuleInstalled(depId)) {
          await this.installModule(depId)
        }
      }

      // 执行模块安装
      await moduleInfo.module.install(this.context)

      // 注册路由
      if (moduleInfo.module.routes) {
        this.registerRoutes(moduleInfo.module.routes)
      }

      // 注册 Store
      if (moduleInfo.module.stores) {
        this.registerStores(moduleInfo.module.stores)
      }

      // 更新模块状态
      moduleInfo.state = ModuleState.INSTALLED
      moduleInfo.installedAt = Date.now()

      console.log(`[ModuleManager] 模块已安装: ${moduleInfo.module.metadata.name}`)
    } catch (error) {
      moduleInfo.state = ModuleState.ERROR
      moduleInfo.error = error instanceof Error ? error : new Error(String(error))
      throw new ModuleInstallError(
        moduleId,
        `安装失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 卸载模块
   */
  async uninstallModule(moduleId: string): Promise<void> {
    const moduleInfo = this.modules.get(moduleId)
    if (!moduleInfo) {
      throw new ModuleNotFoundError(moduleId)
    }

    // 检查模块状态
    if (moduleInfo.state !== ModuleState.INSTALLED &&
        moduleInfo.state !== ModuleState.ENABLED &&
        moduleInfo.state !== ModuleState.DISABLED) {
      throw new ModuleStateError(
        moduleId,
        moduleInfo.state,
        ModuleState.INSTALLED
      )
    }

    try {
      // 禁用模块（如果已启用）
      if (moduleInfo.state === ModuleState.ENABLED) {
        await this.disableModule(moduleId)
      }

      // 执行模块卸载
      await moduleInfo.module.uninstall()

      // 移除路由
      if (moduleInfo.module.routes) {
        this.unregisterRoutes(moduleInfo.module.routes)
      }

      // 移除 Store
      if (moduleInfo.module.stores) {
        this.unregisterStores(moduleInfo.module.stores)
      }

      // 更新模块状态
      moduleInfo.state = ModuleState.REGISTERED
      moduleInfo.installedAt = undefined
      moduleInfo.enabledAt = undefined

      console.log(`[ModuleManager] 模块已卸载: ${moduleInfo.module.metadata.name}`)
    } catch (error) {
      moduleInfo.state = ModuleState.ERROR
      moduleInfo.error = error instanceof Error ? error : new Error(String(error))
      throw new ModuleUninstallError(
        moduleId,
        `卸载失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // ========== 模块查询 ==========

  /**
   * 获取模块
   */
  getModule(moduleId: string): Module | null {
    const moduleInfo = this.modules.get(moduleId)
    return moduleInfo ? moduleInfo.module : null
  }

  /**
   * 获取所有模块
   */
  getAllModules(): Module[] {
    return Array.from(this.modules.values()).map(info => info.module)
  }

  /**
   * 获取已安装的模块
   */
  getInstalledModules(): Module[] {
    return Array.from(this.modules.values())
      .filter(info => info.state === ModuleState.INSTALLED ||
                      info.state === ModuleState.ENABLED ||
                      info.state === ModuleState.DISABLED)
      .map(info => info.module)
  }

  /**
   * 检查模块是否已安装
   */
  isModuleInstalled(moduleId: string): boolean {
    const moduleInfo = this.modules.get(moduleId)
    if (!moduleInfo) return false

    return moduleInfo.state === ModuleState.INSTALLED ||
           moduleInfo.state === ModuleState.ENABLED ||
           moduleInfo.state === ModuleState.DISABLED
  }

  // ========== 模块状态 ==========

  /**
   * 启用模块
   */
  async enableModule(moduleId: string): Promise<void> {
    const moduleInfo = this.modules.get(moduleId)
    if (!moduleInfo) {
      throw new ModuleNotFoundError(moduleId)
    }

    // 检查模块状态
    if (moduleInfo.state !== ModuleState.INSTALLED &&
        moduleInfo.state !== ModuleState.DISABLED) {
      throw new ModuleStateError(
        moduleId,
        moduleInfo.state,
        ModuleState.INSTALLED
      )
    }

    try {
      // 执行模块启用
      if (moduleInfo.module.enable) {
        await moduleInfo.module.enable()
      }

      // 更新模块状态
      moduleInfo.state = ModuleState.ENABLED
      moduleInfo.enabledAt = Date.now()

      console.log(`[ModuleManager] 模块已启用: ${moduleInfo.module.metadata.name}`)
    } catch (error) {
      moduleInfo.state = ModuleState.ERROR
      moduleInfo.error = error instanceof Error ? error : new Error(String(error))
      throw new ModuleInstallError(
        moduleId,
        `启用失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 禁用模块
   */
  async disableModule(moduleId: string): Promise<void> {
    const moduleInfo = this.modules.get(moduleId)
    if (!moduleInfo) {
      throw new ModuleNotFoundError(moduleId)
    }

    // 检查模块状态
    if (moduleInfo.state !== ModuleState.ENABLED) {
      throw new ModuleStateError(
        moduleId,
        moduleInfo.state,
        ModuleState.ENABLED
      )
    }

    try {
      // 执行模块禁用
      if (moduleInfo.module.disable) {
        await moduleInfo.module.disable()
      }

      // 更新模块状态
      moduleInfo.state = ModuleState.DISABLED
      moduleInfo.enabledAt = undefined

      console.log(`[ModuleManager] 模块已禁用: ${moduleInfo.module.metadata.name}`)
    } catch (error) {
      moduleInfo.state = ModuleState.ERROR
      moduleInfo.error = error instanceof Error ? error : new Error(String(error))
      throw new ModuleUninstallError(
        moduleId,
        `禁用失败: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  /**
   * 检查模块是否已启用
   */
  isModuleEnabled(moduleId: string): boolean {
    const moduleInfo = this.modules.get(moduleId)
    return moduleInfo ? moduleInfo.state === ModuleState.ENABLED : false
  }

  /**
   * 获取模块状态
   */
  getModuleState(moduleId: string): ModuleState | null {
    const moduleInfo = this.modules.get(moduleId)
    return moduleInfo ? moduleInfo.state : null
  }

  // ========== 私有方法 ==========

  /**
   * 验证模块元数据
   */
  private validateModuleMetadata(metadata: any): void {
    if (!metadata.id) {
      throw new Error('模块缺少 ID')
    }
    if (!metadata.name) {
      throw new Error('模块缺少名称')
    }
    if (!metadata.version) {
      throw new Error('模块缺少版本')
    }
  }

  /**
   * 检查依赖
   */
  private checkDependencies(dependencies: string[]): void {
    for (const depId of dependencies) {
      if (!this.modules.has(depId)) {
        throw new ModuleDependencyError('', depId)
      }
    }
  }

  /**
   * 注册路由
   */
  private registerRoutes(routes: any[]): void {
    // TODO: 实现路由注册
    console.log(`[ModuleManager] 注册路由: ${routes.length} 个`)
  }

  /**
   * 注销路由
   */
  private unregisterRoutes(routes: any[]): void {
    // TODO: 实现路由注销
    console.log(`[ModuleManager] 注销路由: ${routes.length} 个`)
  }

  /**
   * 注册 Store
   */
  private registerStores(stores: any[]): void {
    // TODO: 实现 Store 注册
    console.log(`[ModuleManager] 注册 Store: ${stores.length} 个`)
  }

  /**
   * 注销 Store
   */
  private unregisterStores(stores: any[]): void {
    // TODO: 实现 Store 注销
    console.log(`[ModuleManager] 注销 Store: ${stores.length} 个`)
  }
}

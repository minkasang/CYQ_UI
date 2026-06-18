// 主题加载器 - 支持动态加载/卸载主题包（热拔插）
// 给 AI 的话：实现主题的热拔插机制，不破坏现有功能

import type { ThemePackage, ThemePackageExtended, ThemeLifecycleHooks } from '../types/theme'
import { ThemeNotFoundError, ThemeDependencyError } from '../types/theme'

/**
 * 主题加载器
 * 支持动态加载/卸载主题包
 */
export class ThemeLoader {
  private loadedThemes: Map<string, ThemePackage> = new Map()
  private preloadedThemes: Map<string, Promise<ThemePackage>> = new Map()
  private hooks: ThemeLifecycleHooks = {}
  private dependencyGraph: Map<string, string[]> = new Map()

  /**
   * 设置生命周期钩子
   */
  setHooks(hooks: ThemeLifecycleHooks): void {
    this.hooks = hooks
  }

  /**
   * 加载主题包
   * @param source 主题包来源（已注册的主题包对象）
   */
  async loadTheme(source: ThemePackage): Promise<ThemePackage> {
    const themeId = source.metadata.id

    // 检查是否已加载
    if (this.loadedThemes.has(themeId)) {
      console.log(`[ThemeLoader] 主题已加载: ${themeId}`)
      return this.loadedThemes.get(themeId)!
    }

    // 执行加载前钩子
    if (this.hooks.beforeLoad) {
      await this.hooks.beforeLoad(themeId)
    }

    // 检查依赖（如果是扩展主题包）
    const extendedSource = source as ThemePackageExtended
    if (extendedSource.dependencies && extendedSource.dependencies.length > 0) {
      await this.loadDependencies(extendedSource)
    }

    // 加载主题
    this.loadedThemes.set(themeId, source)
    console.log(`[ThemeLoader] 主题已加载: ${source.metadata.name} (${themeId})`)

    // 执行加载后钩子
    if (this.hooks.afterLoad) {
      await this.hooks.afterLoad(source)
    }

    return source
  }

  /**
   * 卸载主题包
   */
  async unloadTheme(themeId: string): Promise<void> {
    const theme = this.loadedThemes.get(themeId)
    if (!theme) {
      console.warn(`[ThemeLoader] 主题未找到: ${themeId}`)
      return
    }

    // 执行卸载前钩子
    if (this.hooks.beforeUnload) {
      await this.hooks.beforeUnload(themeId)
    }

    // 检查是否有其他主题依赖此主题
    const dependents = this.getDependents(themeId)
    if (dependents.length > 0) {
      console.warn(`[ThemeLoader] 主题 ${themeId} 被以下主题依赖: ${dependents.join(', ')}`)
      // 先卸载依赖此主题的主题
      for (const dependentId of dependents) {
        await this.unloadTheme(dependentId)
      }
    }

    // 销毁主题引擎
    theme.engine.destroy()

    // 移除加载记录
    this.loadedThemes.delete(themeId)
    this.preloadedThemes.delete(themeId)
    this.dependencyGraph.delete(themeId)

    console.log(`[ThemeLoader] 主题已卸载: ${themeId}`)

    // 执行卸载后钩子
    if (this.hooks.afterUnload) {
      await this.hooks.afterUnload(themeId)
    }
  }

  /**
   * 热更新主题包
   * 不销毁引擎，只更新配置和资源
   */
  async hotReload(themeId: string, newPackage: ThemePackage): Promise<void> {
    const oldTheme = this.loadedThemes.get(themeId)
    if (!oldTheme) {
      throw new ThemeNotFoundError(themeId)
    }

    // 执行热更新前钩子
    if (this.hooks.beforeHotReload) {
      await this.hooks.beforeHotReload(themeId)
    }

    // 更新配置（不销毁引擎）
    oldTheme.engine.update(newPackage.config)

    // 更新加载记录
    this.loadedThemes.set(themeId, {
      ...oldTheme,
      config: newPackage.config,
      assets: newPackage.assets
    })

    console.log(`[ThemeLoader] 主题已热更新: ${themeId}`)

    // 执行热更新后钩子
    if (this.hooks.afterHotReload) {
      await this.hooks.afterHotReload(newPackage)
    }
  }

  /**
   * 预加载主题包
   * 在后台加载，不立即激活
   */
  async preloadTheme(source: ThemePackage): Promise<void> {
    const themeId = source.metadata.id

    // 检查是否已预加载或已加载
    if (this.preloadedThemes.has(themeId) || this.loadedThemes.has(themeId)) {
      return
    }

    // 创建预加载 Promise
    const loadPromise = this.loadTheme(source)
    this.preloadedThemes.set(themeId, loadPromise)

    // 等待预加载完成
    await loadPromise
    console.log(`[ThemeLoader] 主题已预加载: ${themeId}`)
  }

  /**
   * 获取已加载主题列表
   */
  getLoadedThemes(): string[] {
    return Array.from(this.loadedThemes.keys())
  }

  /**
   * 检查主题是否已加载
   */
  isLoaded(themeId: string): boolean {
    return this.loadedThemes.has(themeId)
  }

  /**
   * 获取已加载的主题包
   */
  getTheme(themeId: string): ThemePackage | null {
    return this.loadedThemes.get(themeId) || null
  }

  /**
   * 加载依赖主题
   */
  private async loadDependencies(theme: ThemePackageExtended): Promise<void> {
    if (!theme.dependencies) return

    for (const dep of theme.dependencies) {
      // 检查依赖是否已加载
      if (!this.loadedThemes.has(dep.themeId)) {
        if (dep.optional) {
          console.warn(`[ThemeLoader] 可选依赖未加载: ${dep.themeId}`)
          continue
        }
        throw new ThemeDependencyError(
          theme.metadata.id,
          `缺少依赖: ${dep.themeId}`
        )
      }

      // 记录依赖关系
      const currentDeps = this.dependencyGraph.get(theme.metadata.id) || []
      currentDeps.push(dep.themeId)
      this.dependencyGraph.set(theme.metadata.id, currentDeps)
    }
  }

  /**
   * 获取依赖此主题的主题列表
   */
  private getDependents(themeId: string): string[] {
    const dependents: string[] = []
    for (const [id, deps] of this.dependencyGraph.entries()) {
      if (deps.includes(themeId)) {
        dependents.push(id)
      }
    }
    return dependents
  }

  /**
   * 检测循环依赖
   */
  detectCircularDependency(themeId: string): boolean {
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (id: string): boolean => {
      visited.add(id)
      recursionStack.add(id)

      const deps = this.dependencyGraph.get(id) || []
      for (const dep of deps) {
        if (!visited.has(dep)) {
          if (dfs(dep)) return true
        } else if (recursionStack.has(dep)) {
          return true // 发现循环
        }
      }

      recursionStack.delete(id)
      return false
    }

    return dfs(themeId)
  }

  /**
   * 获取依赖图
   */
  getDependencyGraph(): Map<string, string[]> {
    return new Map(this.dependencyGraph)
  }

  /**
   * 清除所有已加载主题
   */
  async clearAll(): Promise<void> {
    for (const themeId of this.loadedThemes.keys()) {
      await this.unloadTheme(themeId)
    }
    this.preloadedThemes.clear()
    this.dependencyGraph.clear()
    console.log('[ThemeLoader] 所有主题已清除')
  }

  /**
   * 获取已加载主题数量
   */
  getLoadedCount(): number {
    return this.loadedThemes.size
  }
}
// 模块系统测试
// 给 AI 的话：测试模块注册、安装、卸载功能，确保不破坏现有功能

import { ModuleManager } from '../ModuleManager'
import { createModuleContext } from '../ModuleContext'
import { TodoModule } from '../../modules/todo'
import { DiaryModule } from '../../modules/diary'
import { AIModule } from '../../modules/ai'
import { WallpaperModule } from '../../modules/wallpaper'
import { SettingsModule } from '../../modules/settings'

/**
 * 测试结果接口
 */
interface TestResult {
  name: string
  passed: boolean
  message: string
  duration?: number
}

/**
 * 测试套件
 */
class TestSuite {
  private results: TestResult[] = []

  /**
   * 运行测试
   */
  async runTest(name: string, testFn: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now()
    try {
      await testFn()
      const result: TestResult = {
        name,
        passed: true,
        message: '测试通过',
        duration: Date.now() - startTime
      }
      this.results.push(result)
      return result
    } catch (error) {
      const result: TestResult = {
        name,
        passed: false,
        message: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      }
      this.results.push(result)
      return result
    }
  }

  /**
   * 获取所有结果
   */
  getResults(): TestResult[] {
    return this.results
  }

  /**
   * 获取通过率
   */
  getPassRate(): number {
    const passed = this.results.filter(r => r.passed).length
    return (passed / this.results.length) * 100
  }
}

/**
 * 模块注册测试
 */
export async function testModuleRegistration(): Promise<TestSuite> {
  const suite = new TestSuite()

  // 创建模块管理器
  const context = createModuleContext(null as any)
  const manager = new ModuleManager(context)

  // 测试1：注册待办模块
  await suite.runTest('注册待办模块', async () => {
    manager.registerModule(TodoModule)
    const module = manager.getModule('todo')
    if (!module) throw new Error('待办模块注册失败')
    if (module.metadata.id !== 'todo') throw new Error('模块ID不匹配')
  })

  // 测试2：注册日记模块
  await suite.runTest('注册日记模块', async () => {
    manager.registerModule(DiaryModule)
    const module = manager.getModule('diary')
    if (!module) throw new Error('日记模块注册失败')
    if (module.metadata.id !== 'diary') throw new Error('模块ID不匹配')
  })

  // 测试3：注册AI模块
  await suite.runTest('注册AI模块', async () => {
    manager.registerModule(AIModule)
    const module = manager.getModule('ai')
    if (!module) throw new Error('AI模块注册失败')
    if (module.metadata.id !== 'ai') throw new Error('模块ID不匹配')
  })

  // 测试4：注册壁纸模块
  await suite.runTest('注册壁纸模块', async () => {
    manager.registerModule(WallpaperModule)
    const module = manager.getModule('wallpaper')
    if (!module) throw new Error('壁纸模块注册失败')
    if (module.metadata.id !== 'wallpaper') throw new Error('模块ID不匹配')
  })

  // 测试5：注册设置模块
  await suite.runTest('注册设置模块', async () => {
    manager.registerModule(SettingsModule)
    const module = manager.getModule('settings')
    if (!module) throw new Error('设置模块注册失败')
    if (module.metadata.id !== 'settings') throw new Error('模块ID不匹配')
  })

  // 测试6：获取所有模块
  await suite.runTest('获取所有模块', async () => {
    const modules = manager.getAllModules()
    if (modules.length !== 5) throw new Error(`模块数量不正确：期望5，实际${modules.length}`)
  })

  // 测试7：检查模块状态
  await suite.runTest('检查模块状态', async () => {
    const state = manager.getModuleState('todo')
    if (state !== 'registered') throw new Error(`模块状态不正确：期望registered，实际${state}`)
  })

  return suite
}

/**
 * 模块安装测试
 */
export async function testModuleInstallation(): Promise<TestSuite> {
  const suite = new TestSuite()

  // 创建模块管理器
  const context = createModuleContext(null as any)
  const manager = new ModuleManager(context)

  // 注册所有模块
  manager.registerModule(TodoModule)
  manager.registerModule(DiaryModule)
  manager.registerModule(AIModule)
  manager.registerModule(WallpaperModule)
  manager.registerModule(SettingsModule)

  // 测试1：安装待办模块
  await suite.runTest('安装待办模块', async () => {
    await manager.installModule('todo')
    if (!manager.isModuleInstalled('todo')) throw new Error('待办模块安装失败')
  })

  // 测试2：安装日记模块
  await suite.runTest('安装日记模块', async () => {
    await manager.installModule('diary')
    if (!manager.isModuleInstalled('diary')) throw new Error('日记模块安装失败')
  })

  // 测试3：安装AI模块
  await suite.runTest('安装AI模块', async () => {
    await manager.installModule('ai')
    if (!manager.isModuleInstalled('ai')) throw new Error('AI模块安装失败')
  })

  // 测试4：安装壁纸模块
  await suite.runTest('安装壁纸模块', async () => {
    await manager.installModule('wallpaper')
    if (!manager.isModuleInstalled('wallpaper')) throw new Error('壁纸模块安装失败')
  })

  // 测试5：安装设置模块
  await suite.runTest('安装设置模块', async () => {
    await manager.installModule('settings')
    if (!manager.isModuleInstalled('settings')) throw new Error('设置模块安装失败')
  })

  // 测试6：获取已安装模块
  await suite.runTest('获取已安装模块', async () => {
    const modules = manager.getInstalledModules()
    if (modules.length !== 5) throw new Error(`已安装模块数量不正确：期望5，实际${modules.length}`)
  })

  return suite
}

/**
 * 模块卸载测试
 */
export async function testModuleUninstallation(): Promise<TestSuite> {
  const suite = new TestSuite()

  // 创建模块管理器
  const context = createModuleContext(null as any)
  const manager = new ModuleManager(context)

  // 注册并安装所有模块
  manager.registerModule(TodoModule)
  manager.registerModule(DiaryModule)
  manager.registerModule(AIModule)
  manager.registerModule(WallpaperModule)
  manager.registerModule(SettingsModule)

  await manager.installModule('todo')
  await manager.installModule('diary')
  await manager.installModule('ai')
  await manager.installModule('wallpaper')
  await manager.installModule('settings')

  // 测试1：卸载待办模块
  await suite.runTest('卸载待办模块', async () => {
    await manager.uninstallModule('todo')
    if (manager.isModuleInstalled('todo')) throw new Error('待办模块卸载失败')
  })

  // 测试2：卸载日记模块
  await suite.runTest('卸载日记模块', async () => {
    await manager.uninstallModule('diary')
    if (manager.isModuleInstalled('diary')) throw new Error('日记模块卸载失败')
  })

  // 测试3：卸载AI模块
  await suite.runTest('卸载AI模块', async () => {
    await manager.uninstallModule('ai')
    if (manager.isModuleInstalled('ai')) throw new Error('AI模块卸载失败')
  })

  // 测试4：卸载壁纸模块
  await suite.runTest('卸载壁纸模块', async () => {
    await manager.uninstallModule('wallpaper')
    if (manager.isModuleInstalled('wallpaper')) throw new Error('壁纸模块卸载失败')
  })

  // 测试5：卸载设置模块
  await suite.runTest('卸载设置模块', async () => {
    await manager.uninstallModule('settings')
    if (manager.isModuleInstalled('settings')) throw new Error('设置模块卸载失败')
  })

  // 测试6：检查已安装模块数量
  await suite.runTest('检查已安装模块数量', async () => {
    const modules = manager.getInstalledModules()
    if (modules.length !== 0) throw new Error(`已安装模块数量不正确：期望0，实际${modules.length}`)
  })

  return suite
}

/**
 * 运行所有测试
 */
export async function runAllTests(): Promise<{
  registration: TestResult[]
  installation: TestResult[]
  uninstallation: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    passRate: number
  }
}> {
  console.log('[Test] 开始运行所有测试...')

  // 运行注册测试
  console.log('[Test] 运行模块注册测试...')
  const registrationSuite = await testModuleRegistration()
  const registrationResults = registrationSuite.getResults()

  // 运行安装测试
  console.log('[Test] 运行模块安装测试...')
  const installationSuite = await testModuleInstallation()
  const installationResults = installationSuite.getResults()

  // 运行卸载测试
  console.log('[Test] 运行模块卸载测试...')
  const uninstallationSuite = await testModuleUninstallation()
  const uninstallationResults = uninstallationSuite.getResults()

  // 汇总结果
  const allResults = [...registrationResults, ...installationResults, ...uninstallationResults]
  const passed = allResults.filter(r => r.passed).length
  const failed = allResults.filter(r => !r.passed).length

  const summary = {
    total: allResults.length,
    passed,
    failed,
    passRate: (passed / allResults.length) * 100
  }

  console.log('[Test] 测试完成！')
  console.log(`[Test] 通过率: ${summary.passRate.toFixed(2)}%`)

  return {
    registration: registrationResults,
    installation: installationResults,
    uninstallation: uninstallationResults,
    summary
  }
}

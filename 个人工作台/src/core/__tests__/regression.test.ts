// 功能回归测试
// 给 AI 的话：测试现有功能是否正常，确保不破坏现有功能

import { useTodoStore } from '../../store/useTodoStore'
import { useDiaryStore } from '../../store/useDiaryStore'
import { useAIConfigStore } from '../../store/useAIConfigStore'
import { useWallpaperStore } from '../../store/useWallpaperStore'
import { useSettingsStore } from '../../store/useSettingsStore'

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
class RegressionTestSuite {
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
 * 待办功能回归测试
 */
export async function testTodoFunctionality(): Promise<TestResult[]> {
  const suite = new RegressionTestSuite()

  // 测试1：加载待办数据
  await suite.runTest('加载待办数据', async () => {
    await useTodoStore.getState().loadTodos()
    const todos = useTodoStore.getState().todos
    if (!Array.isArray(todos)) throw new Error('待办数据格式错误')
  })

  // 测试2：添加待办
  await suite.runTest('添加待办', async () => {
    const initialCount = useTodoStore.getState().todos.length
    useTodoStore.getState().addTodo({
      title: '测试待办',
      category: 'work',
      priority: 'medium'
    })
    const newCount = useTodoStore.getState().todos.length
    if (newCount !== initialCount + 1) throw new Error('添加待办失败')
  })

  // 测试3：更新待办
  await suite.runTest('更新待办', async () => {
    const todos = useTodoStore.getState().todos
    if (todos.length === 0) throw new Error('没有待办可更新')
    const todoId = todos[0].id
    useTodoStore.getState().updateTodo(todoId, { title: '更新后的待办' })
    const updated = useTodoStore.getState().todos.find((t: any) => t.id === todoId)
    if (!updated || updated.title !== '更新后的待办') throw new Error('更新待办失败')
  })

  // 测试4：删除待办
  await suite.runTest('删除待办', async () => {
    const todos = useTodoStore.getState().todos
    if (todos.length === 0) throw new Error('没有待办可删除')
    const todoId = todos[todos.length - 1].id
    const initialCount = useTodoStore.getState().todos.length
    useTodoStore.getState().deleteTodo(todoId)
    const newCount = useTodoStore.getState().todos.length
    if (newCount !== initialCount - 1) throw new Error('删除待办失败')
  })

  return suite.getResults()
}

/**
 * 日记功能回归测试
 */
export async function testDiaryFunctionality(): Promise<TestResult[]> {
  const suite = new RegressionTestSuite()

  // 测试1：加载日记数据
  await suite.runTest('加载日记数据', async () => {
    await useDiaryStore.getState().loadDiaries()
    const diaries = useDiaryStore.getState().diaries
    if (!Array.isArray(diaries)) throw new Error('日记数据格式错误')
  })

  // 测试2：创建日记
  await suite.runTest('创建日记', async () => {
    const initialCount = useDiaryStore.getState().diaries.length
    useDiaryStore.getState().createDiary()
    const newCount = useDiaryStore.getState().diaries.length
    if (newCount !== initialCount + 1) throw new Error('创建日记失败')
  })

  // 测试3：更新日记
  await suite.runTest('更新日记', async () => {
    const diaries = useDiaryStore.getState().diaries
    if (diaries.length === 0) throw new Error('没有日记可更新')
    const diaryId = diaries[0].id
    useDiaryStore.getState().updateDiary(diaryId, { title: '更新后的日记' })
    const updated = useDiaryStore.getState().diaries.find((d: any) => d.id === diaryId)
    if (!updated || updated.title !== '更新后的日记') throw new Error('更新日记失败')
  })

  // 测试4：删除日记
  await suite.runTest('删除日记', async () => {
    const diaries = useDiaryStore.getState().diaries
    if (diaries.length === 0) throw new Error('没有日记可删除')
    const diaryId = diaries[diaries.length - 1].id
    const initialCount = useDiaryStore.getState().diaries.length
    useDiaryStore.getState().deleteDiary(diaryId)
    const newCount = useDiaryStore.getState().diaries.length
    if (newCount !== initialCount - 1) throw new Error('删除日记失败')
  })

  return suite.getResults()
}

/**
 * AI功能回归测试
 */
export async function testAIFunctionality(): Promise<TestResult[]> {
  const suite = new RegressionTestSuite()

  // 测试1：加载AI配置
  await suite.runTest('加载AI配置', async () => {
    await useAIConfigStore.getState().loadFromFile()
    const config = useAIConfigStore.getState().config
    if (!config) throw new Error('AI配置加载失败')
  })

  // 测试2：设置AI提供商
  await suite.runTest('设置AI提供商', async () => {
    useAIConfigStore.getState().setProvider('deepseek')
    const config = useAIConfigStore.getState().config
    if (config.provider !== 'deepseek') throw new Error('设置AI提供商失败')
  })

  // 测试3：设置AI模型
  await suite.runTest('设置AI模型', async () => {
    useAIConfigStore.getState().setModel('deepseek-chat')
    const config = useAIConfigStore.getState().config
    if (config.model !== 'deepseek-chat') throw new Error('设置AI模型失败')
  })

  return suite.getResults()
}

/**
 * 壁纸功能回归测试
 */
export async function testWallpaperFunctionality(): Promise<TestResult[]> {
  const suite = new RegressionTestSuite()

  // 测试1：加载壁纸数据
  await suite.runTest('加载壁纸数据', async () => {
    await useWallpaperStore.getState().loadFromFile()
    const current = useWallpaperStore.getState().current
    if (!current) throw new Error('壁纸数据加载失败')
  })

  // 测试2：设置壁纸
  await suite.runTest('设置壁纸', async () => {
    const wallpaper = {
      id: 'test-wallpaper',
      type: 'color' as const,
      value: '#3b82f6',
      name: '测试壁纸',
      createdAt: Date.now()
    }
    useWallpaperStore.getState().setCurrent(wallpaper)
    const current = useWallpaperStore.getState().current
    if (current.id !== 'test-wallpaper') throw new Error('设置壁纸失败')
  })

  // 测试3：添加到历史
  await suite.runTest('添加到历史', async () => {
    const initialCount = useWallpaperStore.getState().history.length
    const wallpaper = {
      id: 'history-wallpaper',
      type: 'color' as const,
      value: '#ef4444',
      name: '历史壁纸',
      createdAt: Date.now()
    }
    useWallpaperStore.getState().addToHistory(wallpaper)
    const newCount = useWallpaperStore.getState().history.length
    if (newCount !== initialCount + 1) throw new Error('添加到历史失败')
  })

  return suite.getResults()
}

/**
 * 设置功能回归测试
 */
export async function testSettingsFunctionality(): Promise<TestResult[]> {
  const suite = new RegressionTestSuite()

  // 测试1：加载设置数据
  await suite.runTest('加载设置数据', async () => {
    await useSettingsStore.getState().loadFromFile()
    const settings = useSettingsStore.getState().settings
    if (!settings) throw new Error('设置数据加载失败')
  })

  // 测试2：设置主题
  await suite.runTest('设置主题', async () => {
    useSettingsStore.getState().setTheme('dark')
    const settings = useSettingsStore.getState().settings
    if (settings.theme !== 'dark') throw new Error('设置主题失败')
  })

  // 测试3：设置语言
  await suite.runTest('设置语言', async () => {
    useSettingsStore.getState().setLanguage('zh-CN')
    const settings = useSettingsStore.getState().settings
    if (settings.language !== 'zh-CN') throw new Error('设置语言失败')
  })

  // 测试4：设置玻璃参数
  await suite.runTest('设置玻璃参数', async () => {
    useSettingsStore.getState().setGlass({ refraction: 0.8 })
    const settings = useSettingsStore.getState().settings
    if (settings.glass.refraction !== 0.8) throw new Error('设置玻璃参数失败')
  })

  return suite.getResults()
}

/**
 * 运行所有回归测试
 */
export async function runAllRegressionTests(): Promise<{
  todo: TestResult[]
  diary: TestResult[]
  ai: TestResult[]
  wallpaper: TestResult[]
  settings: TestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    passRate: number
  }
}> {
  console.log('[RegressionTest] 开始运行所有回归测试...')

  // 运行待办功能测试
  console.log('[RegressionTest] 运行待办功能测试...')
  const todoResults = await testTodoFunctionality()

  // 运行日记功能测试
  console.log('[RegressionTest] 运行日记功能测试...')
  const diaryResults = await testDiaryFunctionality()

  // 运行AI功能测试
  console.log('[RegressionTest] 运行AI功能测试...')
  const aiResults = await testAIFunctionality()

  // 运行壁纸功能测试
  console.log('[RegressionTest] 运行壁纸功能测试...')
  const wallpaperResults = await testWallpaperFunctionality()

  // 运行设置功能测试
  console.log('[RegressionTest] 运行设置功能测试...')
  const settingsResults = await testSettingsFunctionality()

  // 汇总结果
  const allResults = [...todoResults, ...diaryResults, ...aiResults, ...wallpaperResults, ...settingsResults]
  const passed = allResults.filter(r => r.passed).length
  const failed = allResults.filter(r => !r.passed).length

  const summary = {
    total: allResults.length,
    passed,
    failed,
    passRate: (passed / allResults.length) * 100
  }

  console.log('[RegressionTest] 测试完成！')
  console.log(`[RegressionTest] 通过率: ${summary.passRate.toFixed(2)}%`)

  return {
    todo: todoResults,
    diary: diaryResults,
    ai: aiResults,
    wallpaper: wallpaperResults,
    settings: settingsResults,
    summary
  }
}

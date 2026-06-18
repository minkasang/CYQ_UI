// 主题演示页面
// 展示液态玻璃 vs 扁平设计两种主题的切换效果
import { CheckSquare, BookText, Zap, Palette, Sun, Moon } from 'lucide-react'
import { useThemeStore } from '../store/useThemeStore'
import { useWallpaperStore } from '../store/useWallpaperStore'
import { useLiquidGlass } from '../hooks/useLiquidGlass'

export function ThemeDemoPage() {
  const activeThemeId = useThemeStore(s => s.activeThemeId)
  const switchTheme = useThemeStore(s => s.switchTheme)
  const themeList = useThemeStore(s => s.getThemeList())

  const wallpaper = useWallpaperStore(s => s.current)
  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined

  const { registerPanel } = useLiquidGlass(bgUrl)

  const isGlass = activeThemeId === 'liquid-glass'

  const handleSwitch = async (id: string) => {
    try {
      await switchTheme(id)
    } catch (e) {
      console.warn('切换主题失败:', e)
    }
  }

  return (
    <div className="max-w-4xl mx-auto pb-20">
      {/* 头部 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🎨 主题演示</h1>
        <p className="text-sm text-white/50 mb-4">
          在新架构下，液态玻璃只是主题之一。切换主题后，面板样式实时变化。
        </p>

        {/* 主题切换器 */}
        <div className="flex items-center gap-3 mb-6">
          {themeList.map(t => (
            <button
              key={t.metadata.id}
              onClick={() => handleSwitch(t.metadata.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeThemeId === t.metadata.id
                  ? 'bg-white/20 border-white/30 text-white shadow-lg'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {t.metadata.name}
            </button>
          ))}
        </div>

        {/* 状态指示 */}
        <div className={`text-xs px-3 py-1 rounded-full inline-block ${
          isGlass ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300'
        }`}>
          当前：{isGlass ? '🫧 液态玻璃 (WebGL)' : '📐 扁平设计 (CSS)'}
        </div>
      </div>

      {/* 面板展示区域 */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 ${isGlass ? '' : 'flat-panels'}`}>
        {/* 卡片 */}
        <div
          ref={isGlass ? (el) => registerPanel(el, { cornerRadius: 20 }) : undefined}
          className={`rounded-2xl p-5 ${!isGlass ? 'flat-panel' : ''}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <CheckSquare size={18} className={isGlass ? 'text-white/80' : 'text-blue-400'} />
            <span className={`font-semibold ${isGlass ? 'text-white' : 'text-gray-200'}`}>
              待办面板
            </span>
          </div>
          <div className={`space-y-2 mb-3 ${isGlass ? 'text-white/70' : 'text-gray-300'}`}>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">完成架构优化</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">测试主题切换</span>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" className="rounded" defaultChecked />
              <span className="text-sm line-through opacity-50">阅读项目文档</span>
            </div>
          </div>
          <button className={`text-xs px-3 py-1.5 rounded-lg transition ${
            isGlass
              ? 'bg-white/10 hover:bg-white/20 text-white/80'
              : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
          }`}>
            + 添加待办
          </button>
        </div>

        {/* 日记卡片 */}
        <div
          ref={isGlass ? (el) => registerPanel(el, { cornerRadius: 20 }) : undefined}
          className={`rounded-2xl p-5 ${!isGlass ? 'flat-panel' : ''}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <BookText size={18} className={isGlass ? 'text-white/80' : 'text-green-400'} />
            <span className={`font-semibold ${isGlass ? 'text-white' : 'text-gray-200'}`}>
              日记面板
            </span>
          </div>
          <div className={`text-sm leading-relaxed ${isGlass ? 'text-white/60' : 'text-gray-400'}`}>
            2026-06-18<br />
            今天完成了架构优化，建立了模块热拔插能力，接下来看看主题切换的效果……
          </div>
        </div>

        {/* 快捷操作 */}
        <div
          ref={isGlass ? (el) => registerPanel(el, { cornerRadius: 20 }) : undefined}
          className={`rounded-2xl p-5 ${!isGlass ? 'flat-panel' : ''}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className={isGlass ? 'text-white/80' : 'text-yellow-400'} />
            <span className={`font-semibold ${isGlass ? 'text-white' : 'text-gray-200'}`}>
              快捷操作
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {['新建待办', '写日记', 'AI 总结', '换壁纸'].map(label => (
              <button
                key={label}
                className={`text-xs px-3 py-1.5 rounded-lg transition ${
                  isGlass
                    ? 'bg-white/10 hover:bg-white/20 text-white/80'
                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 主题信息 */}
        <div
          ref={isGlass ? (el) => registerPanel(el, { cornerRadius: 20 }) : undefined}
          className={`rounded-2xl p-5 ${!isGlass ? 'flat-panel' : ''}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Palette size={18} className={isGlass ? 'text-white/80' : 'text-pink-400'} />
            <span className={`font-semibold ${isGlass ? 'text-white' : 'text-gray-200'}`}>
              主题信息
            </span>
          </div>
          <div className={`text-xs space-y-1.5 ${isGlass ? 'text-white/50' : 'text-gray-400'}`}>
            <div className="flex justify-between">
              <span>引擎:</span>
              <span>{isGlass ? 'WebGL LiquidGlass' : 'CSS FlatDesign'}</span>
            </div>
            <div className="flex justify-between">
              <span>性能:</span>
              <span>{isGlass ? '中等 (GPU)' : '高 (纯CSS)'}</span>
            </div>
            <div className="flex justify-between">
              <span>动效:</span>
              <span>{isGlass ? '流体变形' : '过渡动画'}</span>
            </div>
            <div className="flex justify-between">
              <span>可调参数:</span>
              <span>{isGlass ? '15个' : '颜色/间距'}</span>
            </div>
          </div>
        </div>

        {/* 日历卡片 */}
        <div
          ref={isGlass ? (el) => registerPanel(el, { cornerRadius: 20 }) : undefined}
          className={`rounded-2xl p-5 ${!isGlass ? 'flat-panel' : ''}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sun size={18} className={isGlass ? 'text-white/80' : 'text-orange-400'} />
            <span className={`font-semibold ${isGlass ? 'text-white' : 'text-gray-200'}`}>
              今日
            </span>
          </div>
          <div className={`text-center ${isGlass ? 'text-white' : 'text-gray-200'}`}>
            <div className="text-3xl font-bold">18</div>
            <div className={`text-sm ${isGlass ? 'text-white/50' : 'text-gray-400'}`}>2026年6月 星期四</div>
          </div>
        </div>

        {/* 设置卡片 */}
        <div
          ref={isGlass ? (el) => registerPanel(el, { cornerRadius: 20 }) : undefined}
          className={`rounded-2xl p-5 ${!isGlass ? 'flat-panel' : ''}`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Moon size={18} className={isGlass ? 'text-white/80' : 'text-indigo-400'} />
            <span className={`font-semibold ${isGlass ? 'text-white' : 'text-gray-200'}`}>
              外观设置
            </span>
          </div>
          <div className={`text-sm space-y-2 ${isGlass ? 'text-white/60' : 'text-gray-400'}`}>
            <label className="flex items-center justify-between">
              <span>粒子效果</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </label>
            <label className="flex items-center justify-between">
              <span>环境音效</span>
              <input type="checkbox" className="rounded" />
            </label>
            <div className="flex items-center justify-between">
              <span>透明度</span>
              <input type="range" className="w-24" defaultValue={80} />
            </div>
          </div>
        </div>
      </div>

      {/* 架构说明 */}
      <div
        ref={isGlass ? (el) => registerPanel(el, { cornerRadius: 20 }) : undefined}
        className={`rounded-2xl p-5 ${!isGlass ? 'flat-panel' : ''}`}
      >
        <h3 className={`font-semibold mb-3 ${isGlass ? 'text-white' : 'text-gray-200'}`}>
          新架构说明
        </h3>
        <div className={`text-xs space-y-1.5 ${isGlass ? 'text-white/50' : 'text-gray-400'}`}>
          <p>✅ ThemeEngine 接口 — 统一主题引擎抽象</p>
          <p>✅ ThemeManager — 主题注册/注销/切换</p>
          <p>✅ ThemeLoader — 热拔插 & 热更新</p>
          <p>✅ useThemeStore — 状态管理 & 回滚</p>
          <p>✅ LiquidGlassEngine — WebGL 玻璃效果</p>
          <p>✅ FlatThemeEngine — CSS 扁平设计</p>
          <p className="mt-2 text-yellow-400/80">⚠ 此页面仅供演示新架构，不影响现有功能</p>
        </div>
      </div>
    </div>
  )
}

// 主题系统初始化组件
// 在 App 挂载时调用一次，注册内置主题
import { useEffect } from 'react'
import { useThemeStore } from '../../store/useThemeStore'
import { useWallpaperStore } from '../../store/useWallpaperStore'
import { useSettingsStore } from '../../store/useSettingsStore'
import { LiquidGlassEngine } from '../../themes/engines/LiquidGlassEngine'
import { FlatThemeEngine } from '../../themes/engines/FlatThemeEngine'
import type { ThemePackage } from '../../types/theme'

type Props = { children: React.ReactNode }

export function ThemeProvider({ children }: Props) {
  const loaded = useThemeStore(s => s.loaded)
  const loadConfig = useThemeStore(s => s.loadFromFile)
  const registerTheme = useThemeStore(s => s.registerTheme)
  const switchTheme = useThemeStore(s => s.switchTheme)
  const activeThemeId = useThemeStore(s => s.activeThemeId)

  const wallpaper = useWallpaperStore(s => s.current)
  const loadWallpaper = useWallpaperStore(s => s.loadFromFile)
  const loadSettings = useSettingsStore(s => s.loadFromFile)

  const bgUrl = wallpaper.type === 'url' || wallpaper.type === 'local' ? wallpaper.value : undefined

  // 加载数据 & 初始化主题系统
  useEffect(() => {
    loadWallpaper()
    loadSettings()
    loadConfig()
  }, [loadWallpaper, loadSettings, loadConfig])

  // 加载完成后注册内置主题
  useEffect(() => {
    if (!loaded) return

    // 液态玻璃主题
    const glassTheme: ThemePackage = {
      metadata: {
        id: 'liquid-glass',
        name: '🫧 液态玻璃',
        version: '1.0.0',
        description: '流体玻璃效果，WebGL 实时渲染',
        tags: ['glass', 'webgl', 'animated']
      },
      engine: new LiquidGlassEngine(),
      config: {
        metadata: { id: 'liquid-glass', name: '液态玻璃', version: '1.0.0' },
        variants: [],
        engine: { type: 'liquid-glass', params: { bgUrl: bgUrl || '' } }
      }
    }

    // 扁平化主题
    const flatTheme: ThemePackage = {
      metadata: {
        id: 'flat',
        name: '📐 扁平设计',
        version: '1.0.0',
        description: '简洁扁平化设计，高性能',
        tags: ['flat', 'minimal', 'performance']
      },
      engine: new FlatThemeEngine(),
      config: {
        metadata: { id: 'flat', name: '扁平设计', version: '1.0.0' },
        variants: [],
        engine: { type: 'flat', params: {} },
        colors: {
          primary: '#007AFF',
          secondary: '#5856D6',
          background: '#1a1a2e',
          surface: '#16213e',
          text: '#eaeaea',
          textSecondary: '#a0a0b0',
          border: '#2a2a4a'
        }
      }
    }

    registerTheme(glassTheme)
    registerTheme(flatTheme)

    // 默认激活液态玻璃
    if (!activeThemeId) {
      switchTheme('liquid-glass').catch(console.warn)
    }
  }, [loaded, bgUrl]) // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>
}

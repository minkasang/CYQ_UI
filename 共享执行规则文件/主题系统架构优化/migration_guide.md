# 主题系统迁移指南

## 当前状态

新旧代码共存，**现有功能零影响**。以下代码已就绪但尚未接入页面：

| 文件 | 作用 |
|------|------|
| `src/types/theme.ts` | 主题接口定义（ThemeEngine/ThemeConfig/GlobalThemeConfig 等） |
| `src/themes/ThemeManager.ts` | 主题管理器（注册/注销/切换） |
| `src/themes/ThemeLoader.ts` | 主题加载器（热拔插/热更新/预加载） |
| `src/themes/engines/LiquidGlassEngine.ts` | 液态玻璃引擎（包装现有实现） |
| `src/themes/engines/FlatThemeEngine.ts` | 扁平化主题引擎 |
| `src/store/useThemeStore.ts` | 主题状态管理（注册/切换/预览/回滚） |

## 迁移步骤

### 步骤1：在 App 入口初始化主题系统

在 `src/App.tsx` 或 `src/main.tsx` 中添加初始化调用：

```typescript
import { useThemeStore } from './store/useThemeStore'
import { liquidGlassEngine } from './themes/engines/LiquidGlassEngine'

// 在 App 组件挂载时初始化
useEffect(() => {
  const store = useThemeStore.getState()
  store.loadFromFile().then(() => {
    // 注册内置主题
    store.registerTheme(/* 主题包 */)
  })
}, [])
```

### 步骤2：替换组件中的 useLiquidGlass

```typescript
// ❌ 旧代码
import { useLiquidGlass } from '../hooks/useLiquidGlass'
const { registerPanel } = useLiquidGlass(bgUrl)

// ✅ 新代码
import { useThemeStore } from '../store/useThemeStore'
const activeTheme = useThemeStore(s => s.getActiveTheme())
// activeTheme.engine 提供统一的 render/update/destroy 方法
```

### 步骤3：在设置页添加主题切换UI

```typescript
import { useThemeStore } from '../store/useThemeStore'

function ThemeSelector() {
  const themeList = useThemeStore(s => s.getThemeList())
  const activeId = useThemeStore(s => s.activeThemeId)
  const switchTheme = useThemeStore(s => s.switchTheme)

  return themeList.map(t => (
    <button
      key={t.metadata.id}
      className={activeId === t.metadata.id ? 'active' : ''}
      onClick={() => switchTheme(t.metadata.id)}
    >
      {t.metadata.name}
    </button>
  ))
}
```

## 向后兼容

- `src/lib/liquid-glass.ts` 原文件不动
- `src/hooks/useLiquidGlass.ts` 可继续使用
- `LiquidGlassEngine` 包装了现有 `LiquidGlass` 类，不修改原有逻辑

## 注意事项

1. 迁移时不要删除 `useLiquidGlass`，等新系统稳定后再清理
2. 每次切换主题会自动保存到 `data/theme_config.json`
3. 切换历史默认保留10条，可配置 `globalConfig.maxHistoryDepth`

# 接入架构

## 核心策略

**只改 `useLiquidGlass`，不动任何页面**。

```
页面 (不变)                  useLiquidGlass (改造)         新主题系统
─────────                   ──────────────────            ──────────
                            ┌─ glass → LiquidGlass(旧)
registerPanel(el, cfg) ──→  ├─ flat  → el.classList.add('flat-panel')
                            └─ 其他 → 按引擎 render()
```

## 接入点

`useLiquidGlass` 内部增加主题感知：
- 读取 `useThemeStore.activeThemeId`
- `liquid-glass` → 走原逻辑（WebGL）
- `flat` → 移除旧 canvas，加 CSS 类
- 切换主题 → `useThemeStore.subscribe()` 触发重渲染

## 质量保障

| 质量属性 | 如何保障 |
|----------|----------|
| 可靠性 | 旧逻辑完整保留，新分支独立 |
| 可维护性 | 只改一个 hook，隔离变更 |
| 可扩展性 | 新引擎只需在 hook 加分支 |
| 兼容性 | `registerPanel` API 不变 |
| 可回退 | `git revert` 一键恢复 |

# 个人工作台 — macOS 设计规范 v1.0

> **设计参考**：Apple Human Interface Guidelines · macos-design skill · apple-design skill
> **适用布局**：「macOS 风格」（范式 3：纯内容 + 浮动 Dock）
> **状态**：待审批

---

## 目录

1. [设计哲学](#1-设计哲学)
2. [页面骨架](#2-页面骨架)
3. [顶栏设计](#3-顶栏设计)
4. [底部浮动 Dock](#4-底部浮动-dock)
5. [内容区](#5-内容区)
6. [色彩体系](#6-色彩体系)
7. [字体层级](#7-字体层级)
8. [间距网格](#8-间距网格)
9. [圆角规范](#9-圆角规范)
10. [阴影与深度](#10-阴影与深度)
11. [模糊与 Vibrancy](#11-模糊与-vibrancy)
12. [Traffic Light 装饰](#12-traffic-light-装饰)
13. [微交互与动画](#13-微交互与动画)
14. [图标规范](#14-图标规范)
15. [空状态与渐进式展示](#15-空状态与渐进式展示)
16. [各页面适配指南](#16-各页面适配指南)
17. [仪表盘布局（范式 4）](#17-仪表盘布局范式-4)
18. [禁止行为](#18-禁止行为)
19. [实现清单](#19-实现清单)

---

## 1. 设计哲学

> **来源**：macos-design skill — Core Philosophy
> "A native app is not a destination. It is a system tool: appear when needed, get out of the way immediately after."

**三大原则**：

| 原则 | 说明 | 来源 |
|------|------|------|
| 内容为王 | UI chrome 退后，让用户数据成为主角。应用是容器，不是画框 | macos-design § Content Area |
| 减法优先 | 每个界面只展示当前任务需要的最少 UI。不需要的元素全部隐藏 | macos-design § Empty States & Progressive Disclosure |
| 层次而非扁平 | 用半透明、模糊、阴影创造深度层次，不是所有的东西都在同一平面 | visual-design § Blur & Shadows |

---

## 2. 页面骨架

> **来源**：macos-design § The Apple Layout Formula · layout-and-composition

```
┌──────────────────────────────────────────────────────┐
│ ●●●   2026年7月18日 星期五               🔍 搜索     │ ← 顶栏 44px
│──────────────────────────────────────────────────────│
│                                                      │
│                                                      │
│                    全屏内容区                          │
│                   px-8 py-6                           │
│                   无最大宽度                           │
│                                                      │
│                                                      │
│──────────────────────────────────────────────────────│
│         ┌──────────────────────────────┐             │
│         │  🏠   ✅   📖   💬   ⚙      │             │ ← 底部浮动 Dock 64px
│         └──────────────────────────────┘             │
└──────────────────────────────────────────────────────┘
```

### 2.1 窗口层面

| 属性 | 值 | 来源 |
|------|-----|------|
| 窗口圆角 | 10px | visual-design § Corner radii |
| 窗口阴影 | 三层阴影 | visual-design § Shadows（Window shadow） |
| 窗口边框 | 0.5px solid，低透明度 | visual-design § Color System |

```css
/* 窗口容器（如果作为独立窗口展示） */
.macos-window {
  border-radius: 10px;
  box-shadow:
    0 0 0 0.5px rgba(255,255,255,0.06),   /* 描边阴影 */
    0 12px 40px rgba(0,0,0,0.15),          /* 中型阴影 */
    0 40px 80px rgba(0,0,0,0.1);           /* 大型环境阴影 */
  overflow: hidden;
}
```

### 2.2 三层背景

| 层级 | 元素 | 颜色 | 透明度 |
|------|------|------|--------|
| Level 0（底） | 内容区背景 | `#1C1C1E`（Apple 暗色标准） | 不透明 |
| Level 1（中） | 全局壁纸 | 用户选择的壁纸 | 显示在 Level 0 之下 |
| Level 2（浮） | Dock / 浮层面板 | `rgba(30,30,32,0.85)` + blur | 半透明浮动 |

> **来源**：visual-design § Color System — Hierarchy through backgrounds, not borders

---

## 3. 顶栏设计

> **来源**：macos-design § Top Bar Design · layout-and-composition § 2

### 3.1 尺寸与定位

| 属性 | 值 | 来源 |
|------|-----|------|
| 高度 | 44px | visual-design § Top bar 48-52px（取 Apple 标准 toolbar 44px） |
| 左右内边距 | 16px | visual-design § Window padding |
| 定位 | `position: sticky; top: 0` | 内容滚动时固定 |
| 背景 | 透明 → 半透明（滚动触发） | 渐变效果 |

### 3.2 背景渐变

```
默认态（顶部）：rgba(0,0,0,0)
滚动后：rgba(0,0,0,0.6) + backdrop-filter: blur(10px)
```

```css
.topbar {
  position: sticky;
  top: 0;
  height: 44px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0);
  transition: background 0.3s ease;
  z-index: 40;
}
.topbar.scrolled {
  background: rgba(0,0,0,0.6);
  backdrop-filter: saturate(180%) blur(10px);
  -webkit-backdrop-filter: saturate(180%) blur(10px);
}
```

### 3.3 内容布局

```
┌──────────────────────────────────────────────────────┐
│ ●●●   2026年7月18日 星期五               🔍 搜索     │
└──────────────────────────────────────────────────────┘
  ↑                                      ↑
  Traffic light（视觉）                   搜索图标（可点击展开）
            ↑
         日期（居中，弱化）
```

| 元素 | 位置 | 样式 | 来源 |
|------|------|------|------|
| Traffic light | 左上 12px 处 | 3 个 12px 圆点 | visual-design § Window Chrome |
| 日期 | 居中 | `text-xs text-white/50` | 系统标准 |
| 搜索 | 右侧 | 图标按钮，点击展开输入框 | interaction-patterns § Search Patterns |

### 3.4 搜索展开态

```
点击 🔍 →
┌─────────────────────────────────────────────────────┐
│ ●●●               🔍 [________________] ✕           │
└─────────────────────────────────────────────────────┘
```

- 展开宽度：240px
- 过渡：`width 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Esc 或点 ✕ 收起
- 来源：interaction-patterns § Floating Search Bar

---

## 4. 底部浮动 Dock

> **来源**：macos-design § Floating Action Bars · visual-design § Blur & Vibrancy

### 4.1 尺寸与定位

| 属性 | 值 |
|------|-----|
| 总高度 | 64px（含 padding） |
| 内容区高度 | 48px |
| 距底部 | 12px |
| 水平居中 | `position: fixed; bottom: 12px; left: 50%; transform: translateX(-50%)` |
| 圆角 | 20px（胶囊形） |
| z-index | 50 |

### 4.2 视觉样式

```css
.dock {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  height: 48px;
  border-radius: 20px;
  z-index: 50;

  /* Vibrancy — macOS 标志性效果 */
  background: rgba(30,30,32,0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);

  /* 分层阴影 */
  box-shadow:
    0 0 0 0.5px rgba(255,255,255,0.08),   /* 描边 */
    0 4px 16px rgba(0,0,0,0.12),           /* 近阴影 */
    0 8px 32px rgba(0,0,0,0.2);            /* 远阴影 */
}
```

### 4.3 导航项

| 属性 | 值 | 来源 |
|------|-----|------|
| 图标大小 | 20px | visual-design § Iconography（16-20px） |
| 图标间距 | 4px | visual-design § Element gap |
| 每个按钮尺寸 | 36×36px | 触摸友好 |
| 按钮圆角 | 10px | visual-design § Corner radii |
| 默认色 | `rgba(255,255,255,0.5)` | 弱化非活跃项 |
| 活跃态 | 图标 `#ffffff` + 底部 3px Action Blue 圆点 | 简洁选中标记 |

```
  🏠    ✅    📖    💬    ⚙
         ●                    ← 3px Action Blue 圆点（当前页标记）
```

### 4.4 5 个导航目标

| 图标 | 标签 | 路由 | 说明 |
|------|------|------|------|
| 🏠 | 首页 | `/` | Dashboard 仪表盘 |
| ✅ | 待办 | `/todo` | 待办列表/看板 |
| 📖 | 日记 | `/diary` | 日记编辑 |
| 💬 | AI | `/chat` 或 `/ai` | AI 聊天 + AI 总结（合并入口） |
| ⚙ | 设置 | `/settings` | 系统设置 |

### 4.5 交互

- 点击：导航到对应路由（`react-router NavLink`）
- hover：图标微放大（`scale(1.1)`），背景微微亮起
- 当前页：底部 Action Blue 圆点标记
- 过渡：`transition: all 150ms cubic-bezier(0.25,0.46,0.45,0.94)`

> **来源**：interaction-patterns § Visual Feedback & Micro-Animations — 150ms fast transitions

---

## 5. 内容区

> **来源**：macos-design § Content Area · layout-and-composition § 4

### 5.1 基本原则

| 原则 | 说明 |
|------|------|
| 无最大宽度 | 页面自行决定内容宽度，壳不限制 |
| 最小 padding | 水平 32px，垂直 24px |
| 背景 | `#1C1C1E`（Apple 暗色标准），不透明 |
| 滚动 | `overflow-y: auto`，独立滚动 |

```css
.content {
  flex: 1;
  overflow-y: auto;
  background: #1C1C1E;
  padding: 24px 32px;
}
```

### 5.2 各页面自行决定宽度

壳提供 `padding: 24px 32px` 的容器，每个页面内部可再加自己的 `max-w-*`：

```tsx
// 壳
<main className="flex-1 overflow-auto" style={{ background: '#1C1C1E' }}>
  <div className="px-8 py-6">
    {children}   {/* 页面自行加 max-w */}
  </div>
</main>

// 待办页面（单列居中）
<div className="max-w-3xl mx-auto space-y-4">...</div>

// 日记页面（左右分栏）
<div className="grid grid-cols-[280px_1fr] gap-6">...</div>

// 首页（全宽 section）
<div className="space-y-12">...</div>
```

---

## 6. 色彩体系

> **来源**：visual-design § Color System + apple-design skill 色彩 Token

### 6.1 暗色主题（当前）

| Token | 值 | 用途 | 来源 |
|-------|-----|------|------|
| `--bg-root` | `#1C1C1E` | 内容区背景 | visual-design § Dark mode `--bg-primary` |
| `--bg-dock` | `rgba(30,30,32,0.85)` | Dock 背景 | visual-design § Dark mode `--bg-secondary` |
| `--bg-card` | `rgba(255,255,255,0.06)` | 卡片/面板 | 项目现有 GlassPanel |
| `--text-primary` | `rgba(255,255,255,1.0)` | 正文 | visual-design § Dark mode |
| `--text-secondary` | `rgba(255,255,255,0.6)` | 辅助文字 | visual-design § `--text-secondary` |
| `--text-tertiary` | `rgba(255,255,255,0.4)` | 弱化文字/placeholder | visual-design § `--text-tertiary` |
| `--accent` | `#0A84FF` | 唯一交互色 | visual-design § Dark mode Blue accent |
| `--accent-dim` | `#2997ff` | 暗色 Action Blue（来自 apple-design） | apple-design skill |
| `--border` | `0.5px rgba(255,255,255,0.08)` | 卡片/面板描边 | visual-design § Dark mode `--border` |
| `--border-strong` | `0.5px rgba(255,255,255,0.15)` | 强描边（极少使用） | visual-design § `--border-strong` |

### 6.2 交互色唯一原则

| ✅ 使用 | ❌ 不使用 |
|---------|----------|
| `#0A84FF` 用于链接、按钮、选中标记、Dock 活跃指示 | 不使用绿/红/紫/橙做交互（禁止多彩） |

> **来源**：apple-design skill — "只用这一个交互色，不做多彩色装饰"

### 6.3 层次通过背景而非边框

| 层级 | 元素 | 背景色 |
|------|------|--------|
| L0 | 内容区 | `#1C1C1E` |
| L1 | 卡片 | `rgba(255,255,255,0.06)` + `0.5px` 描边 |
| L2 | 弹窗 | `rgba(30,30,32,0.95)` + blur + 12px 圆角 + 中阴影 |

> **来源**：visual-design § Color System — "Hierarchy through backgrounds, not borders"

---

## 7. 字体层级

> **来源**：visual-design § Typography（Apple 9 级 type scale）

### 7.1 全局字体栈

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
             "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

### 7.2 层级表（Apple 标准）

| 角色 | 大小 | 字重 | 行高 | Tailwind | 用途 |
|------|------|------|------|----------|------|
| Large Title | 26px | Bold 700 | 32px | `text-[26px] font-bold` | 页面主标题 |
| Title 1 | 22px | Regular 400 | 28px | `text-[22px]` | 模块大标题 |
| Title 2 | 17px | Regular 400 | 22px | `text-[17px]` | Section 标题 |
| Title 3 | 15px | Semibold 600 | 20px | `text-[15px] font-semibold` | 卡片标题 |
| **Body** | **13px** | **Regular 400** | **18px** | **`text-[13px]`** | **正文** |
| Callout | 12px | Regular 400 | 16px | `text-xs` | 辅助说明 |
| Caption | 11px | Regular 400 | 14px | `text-[11px]` | 标签、时间 |
| Mini | 9px | Medium 500 | 12px | `text-[9px]` | 极小标注 |

### 7.3 使用规则

- Body 正文 **13px**（不是 web 常见 16px）
- 弱化文字用**透明度**（`text-white/60`），不用 lighter 字重
- 标题用 **Regular 400**，只在 Large Title 和 Title 3 使用 Bold/Semibold
- 字距紧凑：headlines 用 `letter-spacing: -0.01em`

> **来源**：visual-design § Typography Notes

---

## 8. 间距网格

> **来源**：visual-design § Spacing & Sizing（8px base grid）

### 8.1 间距 Token 表

| Token | 值 | Tailwind | 用途 | 来源 |
|-------|-----|----------|------|------|
| `--space-xs` | 4px | `gap-1` | 极小间隙 | |
| `--space-sm` | 8px | `gap-2`, `p-2` | 按钮/元素间距 | visual-design § Element gap |
| `--space-md` | 12px | `gap-3`, `p-3` | 卡片内边距 | visual-design § Inner padding (cards) |
| `--space-lg` | 16px | `gap-4`, `p-4` | 内容间距 | visual-design § Window padding |
| `--space-xl` | 24px | `gap-6`, `p-6` | 模块间距 | visual-design § Section gap |
| `--space-2xl` | 32px | `p-8` | 内容区 padding | |
| `--space-3xl` | 48px | `gap-12` | 大区块分隔 | |

### 8.2 页面模块间距

- 内容区 padding：**32px** 水平，**24px** 垂直
- 模块 section 间距：**24px**（`space-y-6`）
- Dock 与内容区间距：**12px**（Dock 距底部 12px）

---

## 9. 圆角规范

> **来源**：visual-design § Corner radii

| 元素 | 圆角 | Tailwind |
|------|------|----------|
| 窗口（外层） | 10px | `rounded-[10px]` |
| Dock 容器 | 20px（胶囊） | `rounded-[20px]` |
| 弹窗/面板 | 12px | `rounded-xl` |
| 卡片 | 8px | `rounded-lg` |
| 按钮 | 6px | `rounded-md` |
| 输入框 | 6px | `rounded-md` |
| Dock 导航项 | 10px | `rounded-[10px]` |
| 标签/徽章 | 4px | `rounded` |

---

## 10. 阴影与深度

> **来源**：visual-design § Shadows & Depth（Layered shadows）

### 10.1 四层阴影（暗色主题）

```css
/* Level 1: 卡片 — Subtle */
--shadow-card:
  0 0 0 0.5px rgba(255,255,255,0.05),
  0 1px 3px rgba(0,0,0,0.2);

/* Level 2: 弹窗/浮层面板 — Medium */
--shadow-panel:
  0 0 0 0.5px rgba(255,255,255,0.06),
  0 4px 16px rgba(0,0,0,0.3);

/* Level 3: Dock — Heavy */
--shadow-dock:
  0 0 0 0.5px rgba(255,255,255,0.08),
  0 4px 16px rgba(0,0,0,0.12),
  0 8px 32px rgba(0,0,0,0.2);

/* Level 4: 窗口 — Window */
--shadow-window:
  0 0 0 0.5px rgba(255,255,255,0.06),
  0 12px 40px rgba(0,0,0,0.15),
  0 40px 80px rgba(0,0,0,0.1);
```

### 10.2 关键规则

- **`0 0 0 0.5px` 描边阴影必加**——这是 macOS 标志性的边缘定义方式
- 暗色模式阴影不透明度 ×2（暗背景上阴影需更强才可见）
- 永远不要只用单层阴影——分层才有 macOS 的深度感

---

## 11. 模糊与 Vibrancy

> **来源**：visual-design § Blur, Vibrancy & Translucency

### 11.1 三处使用

| 元素 | 背景 | Blur | Saturation | 来源 |
|------|------|------|------------|------|
| Dock | `rgba(30,30,32,0.85)` | `blur(20px)` | `saturate(180%)` | visual-design § Sidebar vibrancy |
| 顶栏（滚动后） | `rgba(0,0,0,0.6)` | `blur(10px)` | `saturate(180%)` | |
| 弹窗 | `rgba(30,30,32,0.95)` | `blur(20px)` | `saturate(180%)` | visual-design § Floating panel |

### 11.2 CSS 模板

```css
.vibrancy {
  background: rgba(30,30,32,0.85);
  backdrop-filter: saturate(180%) blur(20px);
  -webkit-backdrop-filter: saturate(180%) blur(20px);
}
```

### 11.3 不使用 blur 的地方

- ❌ 内容区（应保持不透明，保证可读性）
- ❌ 正文文字容器
- ❌ Modal 背景（用半透明暗色遮罩）

> **来源**：visual-design § Where NOT to use blur

---

## 12. Traffic Light 装饰

> **来源**：macos-design § Window Chrome & Traffic Lights

### 12.1 规格

| 属性 | 值 |
|------|-----|
| 位置 | 顶栏左上角，距左 12px，距顶居中 |
| 圆点直径 | 12px |
| 圆点间距 | 8px |
| 颜色 | 红 `#FF5F57`、黄 `#FEBC2E`、绿 `#28C840` |
| 交互 | **纯视觉**，不可点击（这是 Web 应用，非原生窗口） |

```html
<div style="position:absolute; top:16px; left:12px; display:flex; gap:8px; z-index:60; pointer-events:none">
  <span style="width:12px; height:12px; border-radius:50%; background:#FF5F57" />
  <span style="width:12px; height:12px; border-radius:50%; background:#FEBC2E" />
  <span style="width:12px; height:12px; border-radius:50%; background:#28C840" />
</div>
```

---

## 13. 微交互与动画

> **来源**：interaction-patterns § Visual Feedback & Micro-Animations

### 13.1 缓动函数

```css
--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

--duration-fast: 150ms;    /* hover、小变化 */
--duration-normal: 250ms;  /* 面板、展开 */
--duration-slow: 400ms;    /* 页面级过渡 */
```

### 13.2 动画清单

| 交互 | 动画 | 时长 | 缓动 |
|------|------|------|------|
| Dock 图标 hover | `scale(1.1)` + 背景亮起 | 150ms | ease-out |
| 导航切换 | 内容淡入 `opacity 0→1` | 250ms | ease-smooth |
| 顶栏背景显现 | `background 透明→半透明` | 300ms | ease |
| 搜索框展开 | `width 40→240px` | 250ms | ease-out |
| Toast 出现 | `translateY(10px)→0, opacity 0→1` | 250ms | ease-out |
| Toast 消失 | `opacity 1→0` | 200ms | ease |

### 13.3 核心原则

> "If you don't see a change, you assume something went wrong."
> — interaction-patterns § Visual Feedback

---

## 14. 图标规范

> **来源**：visual-design § Iconography（SF Symbols 风格）

| 属性 | 值 |
|------|-----|
| 风格 | 线性（monoline），几何简洁 |
| 默认大小 | 16px |
| Dock 大小 | 20px |
| 颜色 | `currentColor`，继承文字色 |
| 实现 | lucide-react（项目现有） |

---

## 15. 空状态与渐进式展示

> **来源**：macos-design § Empty States & Progressive Disclosure · layout-and-composition § 5

### 15.1 空状态规则

- 无内容时：显示居中占位符（简单图标 + 一行说明 + CTA）
- 所有工具栏、筛选器、辅助 UI 必须隐藏（内容为空时它们无用）

### 15.2 渐进式展示规则

- 过滤器：内容存在后才出现
- 元数据：hover 或点击才显示
- 高级选项：放在「...」菜单或设置页

---

## 16. 各页面适配指南

### 16.1 待办页面 `/todo`

```
┌───────────────────────────────────┐
│   ✅ 每日待办                      │ ← 页面标题 26px Bold
│   3 项待完成 · 1 项今天            │ ← 统计摘要 12px
│───────────────────────────────────│
│   [今天] [待完成] [已完成] [全部]    │ ← 过滤栏
│   🔍 搜索...                       │ ← 搜索框
│───────────────────────────────────│
│   ☐  买 groceries      🔴高        │ ← 待办项
│   ☑  完成报告           🟢低       │
│   ☐  运动 30 分钟       🟡中       │
│───────────────────────────────────│
│   [+ 新建待办]                     │
└───────────────────────────────────┘
```

- **宽度**：`max-w-3xl mx-auto`（720px）
- **间距**：`space-y-3`
- **看板模式**：切换到全宽，三列并排

### 16.2 日记页面 `/diary`

```
┌──────────────┬──────────────────────────┐
│ 📖 我的日记   │                          │
│              │  # 2026年7月18日          │
│ [列表][时间轴] │                          │
│              │  今天发生了...             │
│ ● 7月18日    │                          │
│   周记       │                          │
│ ● 7月17日    │  [润色] [续写] [改写]     │
│   项目总结   │                          │
│              │                          │
└──────────────┴──────────────────────────┘
  280px                     flex-1
```

- **宽度**：壳不限制，页面自己 `grid-cols-[280px_1fr]`
- **左侧**：列表 + 标签筛选 + 情绪面板（可折叠）
- **右侧**：编辑器 + 预览

### 16.3 AI 页面

- **宽度**：`max-w-4xl mx-auto`（896px）
- 消息列表 + 输入框
- AI 总结页面同理

### 16.4 设置页面 `/settings`

- **宽度**：`max-w-3xl mx-auto`（720px）
- 垂直堆叠卡片，`space-y-4`

---

## 17. 仪表盘布局（范式 4）

> 来源：用户需求 — 首页以 Widget 卡片网格呈现模块摘要

### 17.1 布局骨架

```
┌──────────────────────────────────────────────┐
│                                              │
│         个人工作台          v0.1              │ ← 标题区
│         2026年7月18日                         │
│                                              │
│  ┌────────────────┐ ┌────────────────┐       │
│  │ ✅ 待办         │ │ 📖 日记         │      │ ← 2×2 卡片网格
│  │ 3 项待完成      │ │ 最近：周记      │      │
│  │ 今天 2 项       │ │ 连续 5 天       │      │
│  └────────────────┘ └────────────────┘       │
│  ┌────────────────┐ ┌────────────────┐       │
│  │ 💬 AI          │ │ 📊 数据         │      │
│  │ 最近对话...     │ │ 情绪趋势        │      │
│  └────────────────┘ └────────────────┘       │
│                                              │
│──────────────────────────────────────────────│
│         ┌──────────────────────┐             │
│         │ 🏠  ✅  📖  💬  ⚙   │             │ ← Dock
│         └──────────────────────┘             │
└──────────────────────────────────────────────┘
```

### 17.2 卡片规格

| 属性 | 值 |
|------|-----|
| 网格 | `grid grid-cols-2 gap-4` |
| 卡片高 | `min-h-[160px]` |
| 卡片 padding | `p-4` |
| 卡片圆角 | 12px |
| 标题 | 15px Semibold |
| 数据 | 13px Body |
| hover | 微弱抬起 `translateY(-2px)` + 阴影加深 |

### 17.3 每张卡片内容

| 卡片 | 实时数据 | 点击跳转 |
|------|----------|----------|
| 待办 | 待完成数 / 今天数 / 高优先数 | → `/todo` |
| 日记 | 最近一篇标题 / 连续天数 | → `/diary` |
| AI | 最近对话摘要 | → `/ai` |
| 数据 | 情绪趋势 / 完成率 | → 展开面板 |

---

## 18. 禁止行为

> **来源**：macos-design + apple-design 各处禁止规则汇总

| ❌ 禁止 | 原因 | 来源 |
|---------|------|------|
| 使用多个交互色 | 混乱，破坏视觉一致性 | apple-design |
| chrome 上加阴影 | 只有内容（卡片/图片）需要阴影 | apple-design |
| 装饰性渐变 | 不做无意义的视觉噪音 | apple-design |
| 顶栏放太多按钮 | drag zone 需要稀疏 | macos-design § Top Bar |
| 内容区使用 blur | 保证文本可读性 | visual-design § Blur |
| 用厚重边框 | 用 0.5px 低透明度描边 | visual-design § Color System |
| 纯黑 #000 背景 | Apple 用深灰 #1C1C1E | visual-design § Dark mode |
| 直接反转颜色做暗色 | 设计独立的暗色 palette | visual-design § Light & Dark |
| 跳过动画 | 每个状态变化都需要反馈 | interaction-patterns § Visual Feedback |

---

## 19. 实现清单

### 文件变更

| 文件 | 操作 | 内容 |
|------|------|------|
| `layouts/MacOSLayout.tsx` | 重写 | 按本规范完整实现 |
| `layouts/DashboardLayout.tsx` | 新建 | 仪表盘布局（范式 4） |
| `components/layout/Dock.tsx` | 新建 | 底部浮动 Dock 组件 |
| `components/layout/Layout.tsx` | 修改 | SHELL_MAP 注册新壳 |
| `store/useLayoutRegistry.ts` | 修改 | 新增 `dashboard` 布局 |
| `components/layout/Sidebar.tsx` | 不改 | 保留供 DefaultLayout 使用 |

### 质量属性

| 属性 | 实现方式 |
|------|----------|
| 可扩展 | Dock 是独立组件，新增导航项只需加一个对象 |
| 可维护 | 每个壳独立文件，互不影响 |
| 可测试 | Dock 纯 UI 组件，传入 items + activeId 即可渲染 |
| 性能 | blur 只用于 Dock/顶栏，内容区不透明 |

---

> **本文档引用来源**：
> - `macos-design/references/layout-and-composition.md` — 布局与组合
> - `macos-design/references/visual-design.md` — 视觉设计
> - `macos-design/references/interaction-patterns.md` — 交互模式
> - `apple-design` skill — Apple 色彩/字体/组件规范
> - `healthy-architecture` skill — 架构设计原则

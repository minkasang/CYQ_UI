# Bento 布局设计系统 — 诊断报告与设计方案

> 任务：2026-06-20-1535_Bento布局设计系统重构
> 版本：S0 诊断文档
> 参考规范：Apple Design（macOS Human Interface Guidelines）、high-end-visual-design skill

---

## 一、现状诊断

### 1.1 字体排版问题

逐文件扫描后发现以下具体问题：

| # | 位置 | 问题 | 现状代码示例 | 标准 |
|---|------|------|-------------|------|
| 1 | `index.css` | 全局字号通过 JS 设 `html.style.fontSize`，有闪烁 | `SettingsPage useEffect` 中动态设置 | 应在 CSS `:root` 声明 |
| 2 | `HomePage.tsx:103` | 欢迎标题 `text-5xl`（48px），无层级区分 | `<h1 className="text-5xl font-bold">` | 应用 `--text-4xl` (48px/700/52px) |
| 3 | `HomePage.tsx:106` | 日期 `text-lg`（18px），实际应该是 caption | `<p className="text-lg text-white/60">` | 应用 `--text-sm` (12px) |
| 4 | `HomePage.tsx:278` | 卡片数值 `text-2xl`（24px），card label `text-[10px]` | 大小反差过大 | 数值用 `--text-xl` (22px)，label 用 `--text-xs` (11px) |
| 5 | `HomePage.tsx:293` | Section 标题 `text-3xl`（30px），无统一 | `<h2 className="text-3xl font-bold">` | 统一用 `--text-2xl` (26px/700) |
| 6 | `InspirationSection.tsx` | 混用 `text-sm`/`text-lg`/`text-base` | 无规律 | 应用 type scale token |
| 7 | `Dock.tsx:182` | 图标 emoji `text-[20px]` | 硬编码 | 应在全局统一 icon size |
| 8 | 全局 | 无统一 `line-height` 声明 | 多处依赖浏览器默认 | 每级字号应有配对 line-height |

**根因**：没有在 CSS 中建立 font-size/line-height/weight 的三元映射表，导致每个组件自行决定。

### 1.2 间距布局问题

| # | 位置 | 问题 | 现状 | 标准 |
|---|------|------|------|------|
| 1 | `MacOSLayout.tsx:77` | 内容区 `px-8 py-6`（32/24px），不遵循 8px 网格 | 32px 是 4×8 可接受，24px 是 3×8 也可接受 | ✅ 这一处还好 |
| 2 | `MacOSLayout.tsx:35` | 顶栏 `h-[44px]`，不是 8 的倍数 | 44px | 应为 40px 或 48px |
| 3 | `HomePage.tsx:148` | Section 间距 `py-8`（32px），不同 section 混用 `py-8`/`py-10` | 不一致 | 统一 `py-12`(48px) |
| 4 | `HomePage.tsx:98` | `max-w-5xl`（1024px），对 13px 字偏宽 | 约 78ch | 阅读最佳 65-75ch ≈ 900px |
| 5 | `Dock.tsx:127` | `gap-1`（4px）太小，`bottom-3`（12px） | 图标间距过密 | gap-2(8px) |
| 6 | `index.css:33-39` | CSS 变量定义了 `--space-*` 但不被使用 | 定义了但白定义 | 应强制使用 |
| 7 | `tailwind.config.js` | 未扩展 spacing 或自定义 section 间距 | Tailwind 默认间距 | 应扩展语义化间距 |

**根因**：虽然定义了 8px 网格的 CSS 变量，但组件直接使用 Tailwind 的 `p-5`(20px)、`p-6`(24px) 等非 8 倍数间距。

### 1.3 色彩/Accent 问题

| # | 问题 | 现状 | 标准 |
|---|------|------|------|
| 1 | Accent 色 `#3b82f6`（Tailwind blue-500）| `index.css:20` | macOS dark accent `#0A84FF` |
| 2 | 文字色大量用 `text-white/50`、`text-white/70` | 硬编码透明度 | 应用 `--text-secondary`、`--text-tertiary` |
| 3 | 边框用 `border-white/5`、`border-white/10` | 无统一 | 应用 `--border-subtle`、`--border-hairline` |
| 4 | 无 light mode 语义色 | 全部硬编码暗色 | 用 CSS 变量可平滑切换 |

### 1.4 布局版式问题（核心）

| # | 问题 | 描述 |
|---|------|------|
| 1 | **纵向堆叠单调** | 首页 6-7 个 section 从上到下一列，每个 `min-h-dvh`，像一叠无尽的纸 |
| 2 | **缺乏视觉节奏** | 所有卡片等宽等高等圆角，没有大小变化，眼睛找不到焦点 |
| 3 | **信息层级扁平** | 欢迎区、灵感、待办、日记权重相同，用户第一眼不知道该看哪 |
| 4 | **滚动疲劳** | 7 屏全部看完需要大量滚动，且每屏内容密度不同（有的满有的空） |
| 5 | **无概览视图** | 没有一个"仪表盘"让用户一眼掌握全局状态 |

---

## 二、优化方案

### 2.1 总体策略

```
原布局（保留不动）              新布局（bento）
┌─────────────────┐          ┌─────────────────────────┐
│ Welcome          │          │ ┌─── Hero ────────────┐ │
│ Inspiration      │          │ │ 早上好  |  统计卡片   │ │
│ Todo             │          │ └─────────────────────┘ │
│ Diary            │    →     │ ┌灵感┐ ┌待办┐ ┌日记──┐ │
│ AI Summary       │          │ │    │ │    │ │      │ │
│ AI Chat          │          │ └────┘ └────┘ └──────┘ │
│ Wallpaper        │          │ ┌── AI 总结 ──────────┐ │
│                  │          │ └─────────────────────┘ │
│ (无尽滚动...)     │          ├─────────────────────────┤
└─────────────────┘          │ ▼ 灵感        [展开]    │
                              │ ▼ 待办        [展开]    │
                              │ ▼ 日记        [展开]    │
                              └─────────────────────────┘
```

### 2.2 Bento 网格布局（首屏）

使用 CSS Grid，卡片大小不一，营造"杂志排版"感：

```
┌──────────────────────────────────────────────┐
│                                              │
│  ┌──────────── Hero 2/3 ────────────┐ ┌Stat┐ │
│  │  早上好 👋                        │ │ 5  │ │
│  │  2026年6月20日 星期五             │ │待办│ │
│  │  向下滚动探索你的工作台            │ └────┘ │
│  └──────────────────────────────────┘        │
│                                              │
│  ┌── 灵感 2/3 ──────────────┐ ┌ 待办 1/3 ─┐ │
│  │                          │ │ 今日 5    │ │
│  │ 「知行合一」              │ │ 已完成 12 │ │
│  │ — 王阳明                 │ │ ➕ 快速添加│ │
│  │ ⭐⭐⭐ ❤                 │ └───────────┘ │
│  └──────────────────────────┘               │
│                                              │
│  ┌── 日记 1/3 ──┐ ┌── AI总结 2/3 ────────┐ │
│  │ 今日已写 ✓   │ │                      │ │
│  │ 共 42 篇     │ │  🤖 让AI帮你整理     │ │
│  │ 📝 写日记    │ │  今天的想法和感悟    │ │
│  └──────────────┘ │  [开始总结] →        │ │
│                   └──────────────────────┘ │
└──────────────────────────────────────────────┘
```

**网格设计**（桌面端 3 列，平板 2 列，手机 1 列）：

| 卡片 | 桌面 col-span | 平板 | 手机 |
|------|:------------:|:----:|:----:|
| Welcome Hero | 8 (of 12) + Stats 4 | 全宽 | 全宽 |
| Inspiration | 8 | 全宽 | 全宽 |
| Todo Stats | 4 | 半宽 | 全宽 |
| Diary | 4 | 半宽 | 全宽 |
| AI Summary | 8 | 全宽 | 全宽 |

### 2.3 手风琴区（下方详情）

```
┌──────────────────────────────────────────────┐
│ ▸ 💡 每日灵感                                │
├──────────────────────────────────────────────┤
│ ▸ ✅ 每日待办                                │
├──────────────────────────────────────────────┤
│ ▾ 📖 每日日记                                │
│ ┌──────────────────────────────────────────┐ │
│ │  (日记编辑器 + 日记列表 完整内容)         │ │
│ └──────────────────────────────────────────┘ │
├──────────────────────────────────────────────┤
│ ▸ ✨ AI 总结                                 │
├──────────────────────────────────────────────┤
│ ▸ 💬 AI 聊天                                 │
├──────────────────────────────────────────────┤
│ ▸ 🖼 壁纸设置                                │
└──────────────────────────────────────────────┘
```

- 默认全部折叠
- 点 Bento 卡片或 Dock 图标展开对应项
- 同一时间只展开一个（手风琴行为）
- 每个 item 有 ErrorBoundary 包裹

### 2.4 交互细节

| 触发源 | 行为 |
|--------|------|
| 点 Bento 灵感卡 | 手风琴展开「灵感」，滚到可见位置 |
| 点 Bento 待办卡 | 手风琴展开「待办」，滚到可见位置 |
| 点 Bento 日记卡 | 手风琴展开「日记」，滚到可见位置 |
| 点 Bento AI 卡 | 弹出浮层（Popover），不展开手风琴 |
| 点 Dock 💡 | 手风琴展开「灵感」|
| 点 Dock ✅ | 手风琴展开「待办」|
| 点 Dock 📖 | 手风琴展开「日记」|
| 点 Dock ✨ | 浮层弹出 AI Summary |
| 点 Dock 💬 | 手风琴展开「AI 聊天」|
| 点 Dock 🖼 | 手风琴展开「壁纸」|
| 点 Dock 🏠 | 滚回 Bento 顶部 |

---

## 三、Design Token 对照表

### 3.1 字体系统

```css
:root {
  /* Type Scale — Apple 9级 + 项目扩展 */
  --text-xs:     11px;    /* Caption, 标签, Badge */
  --text-sm:     12px;    /* Footnote, 辅助文字 */
  --text-base:   13px;    /* Body 正文 (macOS 默认) */
  --text-md:     15px;    /* Title 3, 卡片标题 */
  --text-lg:     17px;    /* Title 2 */
  --text-xl:     22px;    /* Title 1 */
  --text-2xl:    26px;    /* Large Title, Section 标题 */
  --text-3xl:    34px;    /* Hero 副标题 */
  --text-4xl:    48px;    /* Hero 大标题 */

  /* Line Heights */
  --leading-xs:  14px;
  --leading-sm:  16px;
  --leading-base: 18px;
  --leading-md:  20px;
  --leading-lg:  22px;
  --leading-xl:  28px;
  --leading-2xl: 32px;
  --leading-3xl: 41px;
  --leading-4xl: 52px;

  /* Font Weights */
  --weight-normal:  400;
  --weight-medium:  500;
  --weight-semibold: 600;
  --weight-bold:    700;

  /* Font Family */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "PingFang SC", "Microsoft YaHei", "Helvetica Neue", sans-serif;
  --font-mono: "SF Mono", "Menlo", "Monaco", "Consolas", monospace;
}
```

### 3.2 Tailwind 扩展映射

```js
// tailwind.config.js extend
fontSize: {
  'xs':   ['11px', { lineHeight: '14px', fontWeight: '400' }],
  'sm':   ['12px', { lineHeight: '16px', fontWeight: '400' }],
  'base': ['13px', { lineHeight: '18px', fontWeight: '400' }],
  'md':   ['15px', { lineHeight: '20px', fontWeight: '600' }],
  'lg':   ['17px', { lineHeight: '22px', fontWeight: '400' }],
  'xl':   ['22px', { lineHeight: '28px', fontWeight: '400' }],
  '2xl':  ['26px', { lineHeight: '32px', fontWeight: '700' }],
  '3xl':  ['34px', { lineHeight: '41px', fontWeight: '700' }],
  '4xl':  ['48px', { lineHeight: '52px', fontWeight: '700' }],
},
spacing: {
  '18': '72px',   // 大 section 间距
  '30': '120px',  // 超大留白
},
borderRadius: {
  'btn':   '6px',
  'card':  '8px',
  'panel': '12px',
  'bento': '16px',
  'dock':  '20px',
},
```

### 3.3 色彩 Token（替换现有硬编码值）

| 旧值 | 新 Token | 新值 |
|------|---------|------|
| `#3b82f6` (accent) | `--accent` | `#0A84FF` |
| `text-white/50` | `var(--text-tertiary)` | `rgba(245,245,247,0.45)` |
| `text-white/60` | `var(--text-secondary)` | `rgba(245,245,247,0.72)` |
| `text-white/70` | `var(--text-secondary)` | `rgba(245,245,247,0.72)` |
| `text-white/80` | `var(--text-secondary)` | `rgba(245,245,247,0.72)` |
| `text-white` | `var(--text-primary)` | `#f5f5f7` |
| `border-white/5` | `var(--border-subtle)` | `rgba(255,255,255,0.06)` |
| `border-white/10` | `var(--border-hairline)` | `rgba(255,255,255,0.08)` |
| `bg-white/10` | `var(--bg-elevated)` | `rgba(255,255,255,0.04)` |

### 3.4 动效 Token（统一替换现有）

| 旧值 | 新值 | 用途 |
|------|------|------|
| `transition-all duration-1000` | `var(--transition-slow)` | Scroll entrance |
| `transition-all duration-300` | `var(--transition-smooth)` | Hover, toggle |
| `transition-all duration-150` | `var(--transition-fast)` | Button press |
| 无 | `var(--ease-out)` | `cubic-bezier(0.25,0.46,0.45,0.94)` |
| 无 | `var(--ease-spring)` | `cubic-bezier(0.34,1.56,0.64,1)` |

---

## 四、文件变更清单

| 文件 | 操作 | 内容 |
|------|------|------|
| `tailwind.config.js` | **重写** | 完整 Token 扩展 |
| `src/index.css` | **重写** | 三层 Token + type scale + light/dark |
| `src/layouts/BentoLayout.tsx` | **新建** | Bento 布局壳 |
| `src/pages/HomePageBento.tsx` | **新建** | Bento 网格 + 手风琴首页 |
| `src/components/layout/Layout.tsx` | 修改 | SHELL_MAP 加 'bento' |
| `src/components/layout/Dock.tsx` | 修改 | Bento 模式下手风琴展开 |
| `src/store/useLayoutRegistry.ts` | 修改 | 加 bento 选项 |
| `src/App.tsx` | 轻改 | bento → HomePageBento 路由 |
| `src/modules/settings/pages/SettingsPage.tsx` | 轻改 | 布局选择器加 bento |

**不动**的文件（零改动）：
- `MacOSLayout.tsx`、`DefaultLayout.tsx`、其他 3 个布局壳
- `HomePage.tsx`（原首页）
- 所有模块组件（`TodoList`、`DiaryEditor`、`InspirationSection` 等）
- `useLiquidGlass`、`ModuleManager`
- 所有 store

---

## 五、风险与回滚

| 风险 | 缓解 |
|------|------|
| Token 改动影响其他布局 | Token 新增为独立体系，旧组件不改动时不受影响 |
| Bento 布局样式崩坏 | 独立布局壳 + 独立首页组件，原 macos 布局完全不受影响 |
| 手风琴性能 | 折叠时 `display:none` 不渲染，展开时才挂载 |
| 模块开关兼容 | 复用现有 `useModuleToggles().isOn()`，不重新发明 |

**回滚方案**：设置页切回 `macos` 布局即可，无需改代码。

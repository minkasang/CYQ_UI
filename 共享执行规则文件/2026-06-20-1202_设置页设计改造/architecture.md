# 设置页设计改造 — 架构设计

## 审计标准来源

基于以下 6 个 skill 的设计标准综合审计：

| Skill | 核心贡献 |
|-------|---------|
| `soft-skill` | 高端视觉设计：双层卡片、动效哲学、按钮语言、反 AI slop |
| `taste-skill` | 反模板化：配色纪律（单强调色、禁止纯黑白）、字体选择、布局多样性 |
| `minimalist-skill` | 极简暖调：暖单色 + 淡彩点缀、低信息密度、8px 网格 |
| `apple-design` | Apple 规范：SF Pro、Action Blue、白底、摄影驱动、emoji 禁止 |
| `macos-design` | macOS 原生：`-apple-system` 栈、13px 正文、顶栏+侧边栏+内容、窗口圆角层级 |
| `redesign-skill` | 审计协议：先审计资产、不改 URL/导航/表单字段名、针对性升级 |

---

## 全局设计决策（阶段 0 需用户确认）

### 决策 1：配色方案

| 选项 | 描述 | 适合度 |
|------|------|--------|
| **A. 深色 off-white 暖调** | 背景 `#0a0a0a`，文字 `#f5f5f7`，强调色暖琥珀/金 | 匹配现有深色主题，off-white 比纯白柔和 |
| B. 深色 Zinc 冷调 | 背景 Zinc-950，文字 Zinc-200，强调色冷蓝 | Apple 风格，偏冷峻 |
| C. 浅色暖骨白 | 背景 `#f7f6f3`，文字 `#111`，强调色去饱和粉彩 | 全新方向，改动大 |

**推荐 A**：改动最小，只把 `text-white` → `text-[#f5f5f7]`，`bg-black/85` → `bg-[#0a0a0a]/90`

### 决策 2：强调色

当前问题：`bg-blue-500` + `bg-red-500` + `bg-blue-500/30` 三种同时出现。

**推荐**：单一 accent = 青蓝色 `#3b82f6`（Tailwind blue-500），或暖琥珀 `#f59e0b`。重置按钮改用 ghost + 红色文字（不算第二个强调色，算危险操作语义色）。

### 决策 3：字体

| 选项 | 描述 |
|------|------|
| A. 保持系统栈 `-apple-system` | 零改动，macOS 原生感，taste-skill 不禁止系统栈 |
| B. Geist | Vercel 出品，modern grotesk，需引入 |
| C. Outfit | 圆润 modern，适合设置页 |

**推荐 A**：你的项目已经是 macOS 工作台定位，`-apple-system` 符合 `macos-design` skill，taste-skill 只禁止 Inter/Roboto/Arial 作为默认，不禁系统栈。

### 决策 4：图标库

当前用 Lucide。taste-skill 把 Lucide 列在"禁止作为默认"。

| 选项 | 描述 | 代价 |
|------|------|------|
| A. 切 Phosphor Icons | taste-skill 首选，Bold/Fill 双风格 | 改全项目 import |
| B. 保留 Lucide | 你项目已广泛使用，taste-skill 说"仅用户明确要求或项目已有依赖时可用" | 零改动 |

**推荐 B**：你的项目已在多处使用 Lucide，taste-skill 明确写了例外："项目已有依赖时可用"。

### 决策 5：动效强度

| 选项 | 描述 |
|------|------|
| A. 轻量 | 仅 CSS transition（section 切换淡入、按钮 hover/active） |
| B. 中等 | Framer Motion 入场动画 + 交错延迟 + 按压反馈 |
| C. 高端 | 滚动驱动 + 视差 + 磁吸悬停 |

**推荐 A（轻量纯 CSS）**：设置页不是 landing page，不需要 framer-motion。所有动效用 CSS transition + `@keyframes` 实现，零额外依赖。`prefers-reduced-motion` 下降级为静态。

---

## 改造架构

### CSS 变量体系

```css
:root {
  /* 背景层级 */
  --bg-root: #0a0a0a;
  --bg-card: rgba(255, 255, 255, 0.06);
  --bg-card-inner: rgba(255, 255, 255, 0.04);

  /* 文字层级 */
  --text-primary: #f5f5f7;
  --text-secondary: rgba(245, 245, 247, 0.72);
  --text-tertiary: rgba(245, 245, 247, 0.45);

  /* 强调色 */
  --accent: #3b82f6;
  --accent-hover: #2563eb;

  /* 边框 */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-hairline: rgba(255, 255, 255, 0.08);

  /* 圆角层级（macOS 惯例） */
  --radius-sm: 6px;   /* 按钮、输入框 */
  --radius-md: 8px;   /* 卡片内部元素 */
  --radius-lg: 12px;  /* 卡片 */
  --radius-xl: 16px;  /* 大容器 */

  /* 间距（8px 网格） */
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;

  /* 动效 */
  --transition-fast: 150ms cubic-bezier(0.32, 0.72, 0, 1);
  --transition-smooth: 300ms cubic-bezier(0.32, 0.72, 0, 1);
}
```

### 组件标准化

#### 按钮

```
primary:   bg-[--accent] text-white rounded-md px-4 py-2 active:scale-[0.98]
ghost:     bg-white/8 hover:bg-white/12 text-[--text-secondary] rounded-md px-4 py-2
danger:    bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10
```

全页最多 1 个 primary 按钮，其余用 ghost。

#### Toggle 开关

自定义组件替代原生 checkbox peer 方案：
- 轨道：`w-10 h-6 rounded-full`，off=白色/10，on=accent
- 滑块：`w-4 h-4 rounded-full bg-white`，`translate-x-0` → `translate-x-[18px]`
- 过渡：`transition-transform duration-200`
- disabled：`opacity-40 cursor-not-allowed`

#### Select 下拉

自定义 dropdown 替代原生 `<select>`：
- 触发器：`bg-white/6 rounded-md px-3 py-2 text-sm`
- 下拉面板：`bg-[#1a1a1a] border border-white/8 rounded-lg shadow-2xl`
- 选项 hover：`bg-white/8`

#### 卡片 Double Bezel

```
外层壳：bg-white/[0.04] border border-white/[0.06] rounded-xl
内层核：bg-white/[0.03] rounded-[10px]（内圆角 = 外圆角 - 2px）
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.06)
```

**与现有玻璃系统的关系**：Double Bezel 是**叠加层**，不替代 `useLiquidGlass` / `registerPanel`。
- `registerPanel` 继续提供 WebGL 玻璃背景
- Double Bezel 在外层加 CSS 边框高光 + 内阴影
- 两层互不干扰：`<div ref={registerPanel} className="double-bezel">`

#### 组件接口

```typescript
// Toggle
interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string           // 可选文字标签
}

// Select
interface SelectProps<T extends string> {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  placeholder?: string
}

// Toast（替换内联 toast state）
// 使用方式：showToast({ message: '✓ 导出成功', type: 'success' })
interface ToastOptions {
  message: string
  type?: 'success' | 'error' | 'info'
  duration?: number        // 默认 3000ms
}

// FontSizeSlider（从 SettingsPage 提取）
// 无 props —— 自管理 localStorage('pw-font-size')，全局生效
```

### Section 布局策略

每个 section 用不同布局，打破「标题+均匀网格」的同质化：

| Section | 布局策略 |
|---------|---------|
| 显示 | 2×2 Bento：1 张大卡片（玻璃效果）+ 3 张并排小卡片（颜色/字号/主题） |
| 模块 | 单列列表 + 分隔线 + 底部 AI 配置区 |
| 布局 | 全宽 + 内嵌预览 |
| AI | 横向卡片：provider 选择 + API Key 入口 + 状态 |
| 日记 | 左右不对等：左 60%（设置面板）+ 右 40%（备份+日志） |
| 数据 | 操作区横排（导出/导入）+ 日志区独立卡片 |
| 关于 | 居中 mini section：logo + 版本徽章 + 技术栈标签 |

### 动效计划（纯 CSS，零依赖）

- Section 切换：`@keyframes fadeSlideUp`（`opacity: 0; translateY(12px)` → `opacity: 1; translateY(0)`），`animation: fadeSlideUp 300ms var(--transition-smooth)`
- 卡片入场：`animation-delay: calc(var(--i) * 60ms)` 交错
- 侧边栏 active：`transition: background-color 200ms var(--transition-fast)` + 当前项 `bg-white/10`
- Toast：`@keyframes slideUp`（入场从 `translateY(100%)`）+ `@keyframes fadeOut`（离场 `opacity: 0`）
- Toggle 滑块：`transition: transform 200ms var(--transition-fast)`
- 按钮按压：`transition: transform 100ms; :active { transform: scale(0.98) }`
- `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`

---

## 质量目标对照

| 质量属性 | 如何实现 |
|---------|---------|
| 可靠性 | 不动功能逻辑，只改样式和交互壳 |
| 可维护性 | CSS 变量统一管理，组件标准文档化 |
| 可扩展性 | 新增 section 只需选一种布局策略 + 套组件标准 |
| 性能效率 | 动效仅用 transform+opacity，`prefers-reduced-motion` 适配 |
| 可测试性 | 每个阶段独立验证，不改 Store/API 契约 |
| 安全性 | 不涉及 |
| 兼容性 | 保持旧版 SettingsPage.tsx 在 git 中，可随时恢复 |

## 涉及文件清单

| 文件 | 改动类型 |
|------|---------|
| `src/modules/settings/pages/SettingsPage.tsx` | 重写样式和交互壳（功能逻辑不动） |
| `src/index.css` | 新增 CSS 变量 + `@keyframes` |
| `src/components/ui/Toggle.tsx` | 新增组件 |
| `src/components/ui/Select.tsx` | 新增组件 |
| `src/components/ui/Toast.tsx` | 新增组件（替换内联 toast） |
| `src/components/settings/FontSizeSlider.tsx` | 从 SettingsPage 提取 |

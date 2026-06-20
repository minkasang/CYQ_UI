# 架构设计 — Bento布局设计系统重构

> 任务：2026-06-20-1535_Bento布局设计系统重构

---

## 一、设计维度 → 质量目标映射

| 质量属性 | 如何实现 | 涉及设计维度 |
|----------|---------|-------------|
| **可维护性** | Design Token 统一管理，一处改处处生效 | 接口与契约、项目结构 |
| **可扩展性** | 新布局壳通过 SHELL_MAP 注册，不修改现有代码 | 设计原则（OCP） |
| **性能效率** | Token 在 CSS 变量层计算，无 JS 运行时开销 | 数据流 |
| **可测试性** | 布局壳纯展示组件，token 为纯 CSS，可独立验证 | 可测试性设计 |
| **兼容性** | 原 default/macos 布局壳不动，向后完全兼容 | 接口与契约 |
| **可观测性** | Token 命名自解释，DevTools 直接可读 | 项目结构 |

---

## 二、架构设计

### 2.1 设计 Token 三层体系

```
┌─────────────────────────────────────────┐
│  Layer 3: Component Tokens              │
│  (Tailwind extend: glass, macos, card)  │
├─────────────────────────────────────────┤
│  Layer 2: Semantic Tokens               │
│  (CSS变量: --text-primary, --accent)    │
├─────────────────────────────────────────┤
│  Layer 1: Primitive Tokens              │
│  (基础色板、字号序列、间距序列)           │
└─────────────────────────────────────────┘
```

**原则**：组件用 Layer 3 Tailwind class，特殊场景用 Layer 2 CSS 变量，Layer 1 作为底层不直接暴露。

### 2.2 文件结构

```
src/
├── index.css                    # [修改] 扩展 CSS 变量 + type scale + light/dark
├── layouts/
│   ├── BentoLayout.tsx          # [新增] Bento 布局壳
│   ├── MacOSLayout.tsx          # [不动] 原 macOS 壳
│   └── ...
├── pages/
│   ├── HomePageBento.tsx        # [新增] Bento 版首页
│   ├── HomePage.tsx             # [不动] 原首页
│   └── ...
├── components/layout/
│   ├── Layout.tsx               # [修改] SHELL_MAP 加 'bento'
│   └── Dock.tsx                 # [修改] Bento 模式下展开手风琴
└── store/
    └── useLayoutRegistry.ts     # [修改] 加 bento 选项
```

### 2.3 布局壳 → 首页映射

| 布局壳 key | 首页组件 | 说明 |
|-----------|---------|------|
| `default` | `HomePage` | 原侧边栏布局 |
| `macos` | `HomePage` | 原 macOS 布局 |
| `bento` | `HomePageBento` | **新** Bento 网格 + 手风琴 |
| `dashboard` | `HomePage` | 仪表盘布局 |
| `fullwidth` | `HomePage` | 全宽布局 |
| `topnav` | `HomePage` | 顶导航布局 |

### 2.4 Bento 网格数据流

```
useModuleToggles() → 过滤可见模块
       ↓
BentoGrid 组件:
  ┌──────────────────────────────┐
  │ Welcome Hero      (col-span-4)│
  ├──────────┬────────┬──────────┤
  │ Inspiration│ Todo   │ Diary   │
  │ (2 cols)   │ (1 col)│ (1 col) │
  ├──────────┴────────┴──────────┤
  │ AI Summary          (3 cols) │
  └──────────────────────────────┘
       ↓ 点击
AccordionSection 组件:
  ┌─ 灵感 ───────────────────── ✕ ─┐
  │  InspirationSection (完整内容)  │
  └────────────────────────────────┘
  ┌─ 待办 ────────────────────────┐ (折叠)
  ┌─ 日记 ────────────────────────┐ (折叠)
  ...
```

### 2.5 组件树

```
BentoLayout
├── GlobalBackground          (不动)
├── TrafficLights             (不动)
├── TopBar                    (轻调：紧凑高度)
├── Main Content
│   └── HomePageBento
│       ├── BentoGrid         [新]
│       │   ├── WelcomeHero   [新]
│       │   ├── InspirationCard [新]
│       │   ├── TodoCard      [新]
│       │   ├── DiaryCard     [新]
│       │   └── AICard        [新]
│       └── AccordionZone     [新]
│           ├── AccordionItem (灵感) → InspirationSection
│           ├── AccordionItem (待办) → TodoList
│           ├── AccordionItem (日记) → DiaryEditor + DiaryList
│           ├── AccordionItem (AI总结) → AISummary
│           ├── AccordionItem (AI聊天) → ChatPanel
│           └── AccordionItem (壁纸) → WallpaperManager
└── Dock                      [轻调]
```

---

## 三、接口契约

### 3.1 布局壳接口（不变）

```ts
type ShellComponent = (props: { children: ReactNode }) => ReactNode
// BentoLayout 遵守同一接口
```

### 3.2 HomePageBento 内部接口

```ts
// Bento 卡片通用 props
interface BentoCardProps {
  title: string
  icon: ReactNode
  span: 'sm' | 'md' | 'lg' | 'xl'  // Tailwind col-span
  onClick: () => void
  children: ReactNode
}

// 手风琴 item props
interface AccordionItemProps {
  id: string
  label: string
  icon: string
  expanded: boolean
  onToggle: (id: string) => void
  children: ReactNode
}
```

### 3.3 Dock → 手风琴通信

```
Dock.onClick(moduleId)
  → 如果当前布局是 'bento' 且 moduleId 有对应手风琴
    → window.dispatchEvent(new CustomEvent('bento-accordion-expand', { detail: { id } }))
  → 否则原逻辑（scrollTo 或 navigate）
```

使用 CustomEvent 而非 prop drilling，因为 Dock 和 HomePageBento 不在同一组件树分支。

---

## 四、错误处理

| 场景 | 策略 |
|------|------|
| 模块未加载 | Bento 卡片显示骨架屏，手风琴 item 灰显不可点击 |
| 空数据 | 卡片显示空状态引导文案，手风琴展开后显示模块自带空状态 |
| Token 缺失 | CSS 变量提供 fallback（`var(--text-primary, #f5f5f7)`） |
| 手风琴展开失败 | ErrorBoundary 包裹每个 AccordionItem |

---

## 五、设计 Token 规范（新）

### 字体层级（Apple 9 级 + 项目适配）

| Token | Size | Weight | Line-height | 用途 |
|-------|------|--------|-------------|------|
| `--text-xs` | 11px | 400 | 14px | Caption、标签 |
| `--text-sm` | 12px | 400 | 16px | 辅助文字、Footnote |
| `--text-base` | 13px | 400 | 18px | Body 正文 |
| `--text-md` | 15px | 600 | 20px | Title 3、卡片标题 |
| `--text-lg` | 17px | 400 | 22px | Title 2 |
| `--text-xl` | 22px | 400 | 28px | Title 1 |
| `--text-2xl` | 26px | 700 | 32px | Large Title、Section 标题 |
| `--text-3xl` | 34px | 700 | 41px | Hero 标题 |
| `--text-4xl` | 48px | 700 | 52px | 超大标题（欢迎区） |

### 间距（8px 基网格）

| Token | 值 | Tailwind 近似 |
|-------|----|--------------|
| `--space-1` | 4px | `gap-1` |
| `--space-2` | 8px | `gap-2` |
| `--space-3` | 12px | `gap-3` |
| `--space-4` | 16px | `gap-4` |
| `--space-6` | 24px | `gap-6` |
| `--space-8` | 32px | `gap-8` |
| `--space-12` | 48px | `gap-12` |
| `--space-16` | 64px | `gap-16` |

### 圆角

| Token | 值 | 用途 |
|-------|----|------|
| `--radius-sm` | 6px | Button、Input |
| `--radius-md` | 8px | Card |
| `--radius-lg` | 12px | Panel、Modal |
| `--radius-xl` | 16px | Bento 卡片 |
| `--radius-2xl` | 20px | Dock、Hero 区 |

### 色彩（暗色模式 — 项目默认）

| Token | 值 | 用途 |
|-------|----|------|
| `--bg-root` | `#0a0a0a` | 根背景 |
| `--bg-elevated` | `rgba(255,255,255,0.04)` | 悬浮面板 |
| `--bg-card` | `rgba(255,255,255,0.06)` | 卡片背景 |
| `--text-primary` | `#f5f5f7` | 主文字 |
| `--text-secondary` | `rgba(245,245,247,0.72)` | 辅助文字 |
| `--text-tertiary` | `rgba(245,245,247,0.45)` | 弱文字 |
| `--accent` | `#0A84FF` | 强调色（macOS dark） |
| `--border-subtle` | `rgba(255,255,255,0.06)` | 弱边框 |
| `--border-hairline` | `rgba(255,255,255,0.08)` | Hairline 边框 |

### 阴影（macOS 分层）

```css
--shadow-card:   0 0 0 0.5px rgba(255,255,255,0.05), 0 1px 3px rgba(0,0,0,0.2);
--shadow-panel:  0 0 0 0.5px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.3);
--shadow-dock:   0 0 0 0.5px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.2);
```

### 动效

```css
--ease-out:      cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
--duration-fast:  150ms;
--duration-normal: 300ms;
--duration-slow:   400ms;
```

---

## 六、架构健康自查

| 检查项 | 状态 |
|--------|------|
| 模块职责清晰 | ✅ 布局壳/首页/设计token 各司其职 |
| 接口稳定 | ✅ 布局壳接口不变，仅新增一个实现 |
| 接口深度 | ✅ Token 体系深藏实现细节，组件只需引用 |
| 依赖方向正确 | ✅ Token → 组件，不反向依赖 |
| 错误有处理 | ✅ ErrorBoundary + 空状态 + fallback |
| 可测试 | ✅ 布局壳为纯展示，token 纯 CSS |
| 无过度设计 | ✅ 三层 token 够用，不过度抽象 |
| 副作用隔离 | ✅ CSS 变量无副作用，CustomEvent 可测试 |

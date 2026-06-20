# 设置页设计改造 — 任务拆解

## 审计结果摘要

对 `SettingsPage.tsx` 做了 6 个设计 skill 标准对照审计，发现 **27 个问题**，根因 3 个：
1. **零动效** — 像 2018 年管理后台
2. **配色无温度** — 纯白文字 + 纯黑 toast + 多强调色混用
3. **所有 section 同质化** — 7 个 section 全是「标题+均匀卡片网格」，零节奏变化

### 27 问题 → 阶段映射

| 阶段 | 覆盖的问题 # |
|------|-------------|
| 阶段 1（Shell） | #5, #7, #8, #9, #10, #11, #12, #17, #22, #24 |
| 阶段 2（组件） | #6, #18, #19, #20, #21, #26 |
| 阶段 3（Section） | #1, #2, #3, #4, #13, #14, #15, #16, #25 |
| 阶段 4（动效） | #22, #25, #26, #27 |
| 阶段 5（收尾） | #15, #23, #14 |

> 完整问题清单见下方审计附录。

---

## 审计附录：27 个问题清单

### 排版（#1-#4）
| # | 问题 |
|---|------|
| 1 | 全页只用了一个字体，没有性格 |
| 2 | 字号层级只有 3 级：22px→14px→11px/10px，缺 16-18px 中间层 |
| 3 | section 标题无 tracking 控制，无 weight 梯度 |
| 4 | 标签文字 11px/10px 偏小且无 tracking-wide |

### 配色（#5-#8）
| # | 问题 |
|---|------|
| 5 | text-white 全页铺满——纯白刺眼，应为 off-white |
| 6 | 多强调色混用：蓝+红同时出现 |
| 7 | 侧边栏分隔线 1px 硬线，应为发丝线或负空间 |
| 8 | Toast bg-black/85 纯黑 |

### 间距与留白（#9-#12）
| # | 问题 |
|---|------|
| 9 | 右侧内容区 py-8 px-10 偏紧 |
| 10 | 卡片间距 gap-5（20px）不在 8px 网格上 |
| 11 | 模块列表 py-1.5 行间距过紧 |
| 12 | 侧边栏 w-[200px] 硬编码像素 |

### 布局（#13-#17）
| # | 问题 |
|---|------|
| 13 | 7 个 section 全是「标题+均匀卡片网格」——零布局变化 |
| 14 | 标题 h2 和卡片平级放在 grid 里，无 section 语义包裹 |
| 15 | 响应式只有一个断点 lg:grid-cols-2，768px 以下无显式回退 |
| 16 | 无 hero/intro 区域，像控制面板不像设计过的设置页 |
| 17 | 无 Footer 或底部闭合——内容突然结束 |

### 组件与材质（#18-#22）
| # | 问题 |
|---|------|
| 18 | 卡片只有单层玻璃效果，缺双层嵌套（外壳+内核） |
| 19 | 原生 select 无任何自定义样式 |
| 20 | 模块 toggle 纯 CSS peer 方案，无品牌感/无过渡动画 |
| 21 | 按钮风格混乱：半透明/实色/幽灵三种语言 |
| 22 | Toast 无入场/出场动画——突然出现消失 |

### 图标（#23-#24）
| # | 问题 |
|---|------|
| 23 | Lucide 图标——taste-skill 禁止名单 |
| 24 | section 导航用 emoji——taste-skill 禁止 |

### 动效（#25-#27）
| # | 问题 |
|---|------|
| 25 | 零动效——section 切换瞬间跳变 |
| 26 | 无 active:scale-[0.98] 按压反馈 |
| 27 | 侧边栏导航切换无过渡动画

---

## 阶段拆解

### 阶段 0：全局设计决策（不动代码，先定基调）

**产出**：设计决策文档（在 architecture.md 中）

| 决策 | 选项 |
|------|------|
| 配色方案 | off-white 暖调 vs Zinc 冷调 vs 保持深色但用 off-white 文字 |
| 强调色 | 单一 accent（蓝/青/琥珀？） |
| 字体 | 系统栈 vs Geist vs Outfit vs 保持现状 |
| 图标库 | 切 Phosphor vs 保留 Lucide（Lucide 在 taste-skill 禁止名单，但你项目已广泛使用） |
| 动效强度 | 轻量（仅过渡）vs 中等（入场+按压）vs 高端（滚动驱动+交错） |

**验证**：用户确认 5 个决策，写入 architecture.md

---

### 阶段 1：全局 Shell 改造

**范围**：侧边栏 + 主区域容器 + 全局 CSS 变量

| 步骤 | 内容 | 涉及文件 |
|------|------|---------|
| 1.1 | 建立 CSS 变量体系（`--accent` / `--text-primary` / `--radius` 等） | `index.css` 或新建 `settings-theme.css` |
| 1.2 | 侧边栏重设计：emoji → 图标、间距/字号/高亮动效 | `SettingsPage.tsx` |
| 1.3 | 主区域 padding 调整（`py-8 px-10` → `py-12 px-12`），换 `gap-6`（24px，对齐 8px 网格） | `SettingsPage.tsx` |
| 1.4 | 侧边栏宽度用 rem 替代 px | `SettingsPage.tsx` |
| 1.5 | Toast 换 off-black + 入场/出场动效 | `SettingsPage.tsx` |

**验证**：侧边栏切换动画流畅，配色统一，toast 有过渡

---

### 阶段 2：组件标准化

**范围**：按钮 / Toggle / Select / 卡片壳 / FontSizeSlider 提取

| 步骤 | 内容 | 涉及文件 |
|------|------|---------|
| 2.1 | 按钮语言统一：定义 primary/ghost/danger 三种，全局替换 | `SettingsPage.tsx` |
| 2.2 | Toggle 开关品牌化：自定义动画 toggle，品牌强调色 | 新建 `src/components/ui/Toggle.tsx` |
| 2.3 | Select 下拉自定义样式 | 新建 `src/components/ui/Select.tsx` |
| 2.4 | 卡片 Double Bezel：外层壳 + 内层核（内边框高光 + 内阴影），**叠加在现有 `registerPanel` 玻璃之上，不替代** | `SettingsPage.tsx` |
| 2.5 | FontSizeSlider 提取为独立组件 | 新建 `src/components/settings/FontSizeSlider.tsx` |
| 2.6 | TextColorPanel / GlassControlPanel / DiarySettingsPanel 不改功能逻辑，只包一层品牌化样式壳 | `SettingsPage.tsx`（壳） |

**验证**：所有交互组件视觉一致，按钮有 `active:scale-[0.98]`，toggle 有过渡动画

---

### 阶段 3：Section 逐个重设计（7 个 section）

每个 section 独立改造，各有不同的布局节奏：

| 步骤 | Section | 当前问题 | 改造方向 |
|------|---------|---------|---------|
| 3.1 | 显示 | 4 张均匀卡片，零节奏 | 1 张大卡片 + 3 张小卡片的不规则 Bento 布局 |
| 3.2 | 模块 | 6 行 toggle 挤在一起 | 每行加分隔 + 间距翻倍 + AI 配置整合 |
| 3.3 | 布局 | 正常 | 微调间距和标题层级 |
| 3.4 | AI | 只有 1 个按钮，太空 | 加 provider 选择 + 状态指示 |
| 3.5 | 日记 | 2 张卡片同样大小 | 主卡片（设置）+ 副卡片（备份），大小区分 |
| 3.6 | 数据 | 按钮堆叠 + 日志 | 按钮横排 + 日志区视觉分层 |
| 3.7 | 关于 | 2 行文字 | 加 logo/图标 + 版本号徽章 |

**验证**：每个 section 视觉上有自己的节奏，但共享同一套设计语言

---

### 阶段 4：动效集成

| 步骤 | 内容 |
|------|------|
| 4.1 | section 切换：淡入 + 上移 12px（`opacity` + `translateY` 过渡） |
| 4.2 | 卡片入场：staggered 交错（每张延迟 60ms） |
| 4.3 | 侧边栏 active 指示器平滑滑动（不瞬间跳） |
| 4.4 | Toast 入场/出场 |
| 4.5 | `prefers-reduced-motion` 适配 |

**验证**：动效流畅不卡顿，减少动效模式下降级为静态

---

### 阶段 5：响应式 + 可访问性收尾

| 步骤 | 内容 |
|------|------|
| 5.1 | `<768px` 移动端侧边栏折叠或顶部 tab 切换 |
| 5.2 | 焦点指示器可见（键盘导航） |
| 5.3 | 语义 HTML（`<section>` / `<nav>` 包裹） |
| 5.4 | 对比度检查（WCAG AA） |

**验证**：移动端可用，键盘可导航，语义正确

---

## 依赖关系

```
阶段 0（决策） → 阶段 1（Shell） → 阶段 2（组件） → 阶段 3（Section） → 阶段 4（动效） → 阶段 5（收尾）
                      ↓
              阶段 2 和 阶段 3 可部分并行（组件标准定好后 section 可同步推进）
```

## 回退策略

- 每个阶段改前 git commit，改完验证通过后再 commit
- 每个 section 独立可回退（改坏了不影响其他 section）
- 旧版 `SettingsPage.tsx` 已在 git 中，可随时恢复

## 什么不动（红线）

| 不动的东西 | 原因 |
|-----------|------|
| Store 层（`useSettingsStore` / `useAPIKeysStore` / `useWallpaperStore`） | 数据流契约不变 |
| 模块系统（`useModuleRoutes` / `ALL_MODULE_IDS` / `MODULE_NAMES`） | 模块开关逻辑不变 |
| `useLiquidGlass` / `registerPanel` API | 玻璃系统只叠加样式，不改调用方式 |
| 数据持久化（`data/settings.json` / localStorage） | 读写路径不变 |
| 导入的子组件内部逻辑（`TextColorPanel` / `GlassControlPanel` / `DiarySettingsPanel` / `BackupManager` / `OperationLogViewer` / `LayoutManager` / `APIKeyModal`） | 只在外层包样式壳，不改内部 |
| 路由 `/settings` | 不改路径和注册方式 |
| 导出/导入功能（`downloadExport` / `importData`） | 功能逻辑不变 |
| Toast 触发逻辑（`showToast` 调用时机） | 只换 UI 壳，不换调用点 |

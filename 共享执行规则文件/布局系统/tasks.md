# 任务拆解 - 布局系统

## 任务概述

创建可切换、可导入/导出的布局模块系统。每个布局控制整体页面结构（侧边栏位置、顶栏样式、内容宽度、间距）。
v2 扩展：CSS 归一化 — 清除 inline style + JS hover，统一为 Tailwind className。

---

## 步骤拆解

### 步骤 1：类型定义 + Store ✅

| 子步骤 | 任务 | 验证方式 | 状态 |
|--------|------|----------|------|
| 1.1 | 创建 `types/layout.ts`，定义 LayoutConfig 接口 | tsc | ✅ |
| 1.2 | 创建 `useLayoutStore.ts`（Zustand persist + 5个内置布局） | tsc | ✅ |

### 步骤 2：LayoutManager 组件 ✅

| 子步骤 | 任务 | 验证方式 | 状态 |
|--------|------|----------|------|
| 2.1 | 创建切换 UI（显示所有布局，点选切换） | 手动 | ✅ |
| 2.2 | 导入 JSON / 导出 JSON 功能 | 手动 | ✅ |
| 2.3 | 删除自定义布局功能 | 手动 | ✅ |

### 步骤 3：接入现有组件 ✅

| 子步骤 | 任务 | 验证方式 | 状态 |
|--------|------|----------|------|
| 3.1 | Layout.tsx 壳选择器（SHELL_MAP） | 手动 | ✅ |
| 3.2 | MacOSLayout（纯内容+浮动Dock） | 手动 | ✅ |
| 3.3 | DashboardLayout（2×2卡片网格） | 手动 | ✅ |
| 3.4 | 设置页嵌入 LayoutManager | 手动 | ✅ |

### 步骤 4：tailwind.config.js 补全 design tokens

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 4.1 | 补入 macOS 色彩 token（背景/文字/边框/强调色） | tsc + 手动 |
| 4.2 | 补入间距/圆角/阴影 token | tsc + 手动 |
| 4.3 | 补入玻璃效果专用 utility（backdrop-blur 等） | 手动 |

### 步骤 5：清除组件 inline style + JS hover → Tailwind

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 5.1 | Sidebar 导航项 inline style → className | 手动 |
| 5.2 | DashboardLayout DashboardCard → className | 手动 |
| 5.3 | Dock 容器+子项 → className | 手动 |
| 5.4 | SettingsPage 侧边导航 → className | 手动 |
| 5.5 | TopBar header → className | 手动 |
| 5.6 | FullWidthLayout + TopNavLayout 顶栏 → className | 手动 |

### 步骤 6：补充 FullWidthLayout + TopNavLayout 完整实现

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 6.1 | FullWidthLayout：完整顶栏+导航+内容区 | 手动 |
| 6.2 | TopNavLayout：水平导航菜单+内容区 | 手动 |

### 步骤 7：编译 + lint + 测试验证

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 7.1 | `tsc --noEmit` 编译通过 | tsc |
| 7.2 | `npm test` 已有测试无退化 | vitest |
| 7.3 | 手动验证 5 个布局壳切换正常 | 手动 |

---

## 复杂度评估

| 步骤 | 复杂度 | 预计代码量 |
|------|--------|-----------|
| 步骤 1-3 | 中等 | ~200 行（已完成） |
| 步骤 4 | 简单 | ~40 行 |
| 步骤 5 | 中等 | ~200 行（改既有代码） |
| 步骤 6 | 中等 | ~100 行 |
| 步骤 7 | 简单 | 验证为主 |

## 更新记录

| 时间 | 更新内容 |
|------|----------|
| 2026-07-18 | 创建任务拆解文件 |
| 2026-07-18 | 步骤1-3完成 + CSS归一化步骤4-7追加；合并「前端设计布局优化」任务 |

---
name: design-reference
description: 大厂设计规范参考库：Apple、Linear、Notion 的完整 DESIGN.md 索引。需要设计决策、UI 优化、组件样式时，读取对应 DESIGN.md 获取色彩/字体/组件/布局规范。
---

# 设计参考库 — 大厂 DESIGN.md 索引

当需要优化 UI、选择配色、设计组件、调整排版时，参考以下设计规范。每个 DESIGN.md 包含：色彩体系、字体层级、组件样式、布局原则、阴影系统、响应式策略、该做/不该做、Agent 提示指南。

## 可用的设计规范

| 设计规范 | 路径 | 适用场景 |
|----------|------|----------|
| 🍎 **Apple** | `开源项目参考/设计/awesome-design-md/design-md/apple/DESIGN.md` | 极简白底、SF Pro 字体、摄影驱动、Action Blue (#0066cc) |

## 已有的设计 skill

- **macos-design** (`/macos-design`) — macOS 原生 App 布局、交互、动画模式
- **apple-design** (`/apple-design`) — Apple 设计系统摘要（色彩/字体/组件/布局）
- 完整 Apple 规范：读取 `开源项目参考/设计/awesome-design-md/design-md/apple/DESIGN.md`

## 使用方式

1. 调用 `/macos-design` 了解 App 级布局和交互模式
2. 调用 `/apple-design` 获取设计 token（颜色、字体、间距、组件）
3. 需要更详细规范时，读取 Apple DESIGN.md 原文
4. 将 Apple 设计语言应用到个人工作台 UI

## 设计参考分工

| 维度 | Apple | macOS |
|------|-------|-------|
| 色彩体系 | token 级语义色（Action Blue 单色交互） | 系统色 |
| 字体 | SF Pro Display/Text | SF Pro |
| 组件 | 简洁 chrome、胶囊按钮、极细描边 | 原生控件 |
| 布局 | 全幅摄影 + 交错色带 + 大留白 | 顶栏+侧栏+内容 |
| 氛围 | 博物馆画廊、产品说话 | 系统工具 |

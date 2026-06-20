# 任务拆解 — Bento布局设计系统重构

> 创建时间：2026-06-20 15:35
> 父任务：无（新任务）
> 阻塞：设置页设计改造（blocked，不受影响）

---

## 任务概览

| 阶段 | 步骤 | 内容 | 类型 | 预计文件数 |
|------|------|------|------|-----------|
| **S0** | 0.1 | 诊断报告 + 设计方案文档 | 文档 | 1 |
| **S1** | 1.1 | 全局 Design Token 体系（CSS + Tailwind） | 编码 | 2 |
| **S2** | 2.1 | Token 应用到现有 index.css | 编码 | 1 |
| **S3** | 3.1 | BentoLayout 新布局壳 | 编码 | 2 |
| **S4** | 4.1 | HomePageBento 组件（Bento 网格 + 手风琴） | 编码 | 1 |
| **S5** | 5.1 | Dock 集成 + Layout 注册 | 编码 | 2 |
| **S6** | 6.1 | 全面测试 | 测试 | 1 |

---

## 详细步骤

### S0：诊断 + 设计文档
- [ ] **0.1** 产出诊断报告文档：逐条列出当前排版问题 + 优化方案 + Token 对照表
  - 产出：`docs/bento-layout-design.md`
  - 验证：用户审阅确认

### S1：全局 Design Token 体系
- [ ] **1.1** 重写 `tailwind.config.js`：添加完整 type scale、间距、色彩、圆角、阴影 token
  - 基于 Apple 设计规范（index.css CSS 变量 + Tailwind extend 双层）
  - 验证：`npx tailwindcss --help` 无报错
- [ ] **1.2** 扩展 `index.css` CSS 变量：补充 light/dark 双模式 token、字体栈、type scale
  - 验证：浏览器 DevTools 检查 `:root` 变量完整

### S2：Token 应用到现有组件（渐进迁移）
- [ ] **2.1** 更新 `index.css` 中 prose/markdown 样式使用新 token
  - 验证：视觉对比新旧 prose 渲染

### S3：BentoLayout 新布局壳
- [ ] **3.1** 创建 `src/layouts/BentoLayout.tsx`：复制 MacOSLayout 结构，调整顶栏+内容区
  - 注册到 `Layout.tsx` SHELL_MAP（key: `bento`）
  - 验证：切换到 bento 布局壳不报错
- [ ] **3.2** 更新 `useLayoutRegistry` 添加 bento 选项
  - 验证：设置页可选 bento 布局

### S4：HomePageBento 组件
- [ ] **4.1** 创建 `src/pages/HomePageBento.tsx`：
  - 首屏：Bento 网格（欢迎 Hero + 灵感卡 + 待办卡 + 日记卡 + AI 总结卡）
  - 下方：手风琴区（灵感/待办/日记/AI总结/AI聊天/壁纸）
  - 滚动入场动画
  - 服从模块开关
  - 验证：所有模块卡片渲染，手风琴展开/折叠正常

### S5：Dock 集成 + 路由
- [ ] **5.1** BentoLayout 下 Dock 改为手风琴展开逻辑
  - 验证：点 Dock 图标 → 对应手风琴展开，其他折叠
- [ ] **5.2** App.tsx 路由：bento 布局壳使用 HomePageBento
  - 验证：切换到 bento 布局，首页显示 Bento 版

### S6：全面测试
- [ ] **6.1** 测试覆盖：渲染一致性、交互反馈、模块开关、性能、边界状态
  - 验证：tsc 零错误，vitest 通过，手动验收

---
name: "improve-codebase-architecture"
description: "架构体检报告。扫描代码库寻找深化机会（将浅度模块转为深度模块），生成可视化 HTML 报告，然后逐个盘问用户选择的候选项。建议每隔几天运行一次，防止代码腐化。在用户想改进架构质量、代码库变得难以维护、或定期架构审查时触发。"
---

# 架构体检（Improve Codebase Architecture）

发现架构摩擦并提出**深化机会**——将浅度模块转为深度模块的重构建议。目标是提升可测试性和 AI 可导航性。

## 前置准备

1. 使用 `healthy-architecture` 中的深度模块词汇（**模块 / 接口 / 深度 / 缝 / 适配器 / 杠杆 / 局部性**）——在所有建议中使用这些精确术语
2. 读取 `CONTEXT.md`（如果存在）——领域语言为好的缝命名
3. 检查相关区域的 ADR——不重新争论已记录的决策

---

## 流程

### 1. 探索代码库

先读 `CONTEXT.md` 和相关 ADR。

然后用子 agent 探索代码库。**不要循规蹈矩**——有机地探索，注意你在哪里感受到摩擦：

- 理解一个概念需要跨多个小模块跳来跳去？→ **浅度模块扩散**
- 模块接口几乎和实现一样复杂？→ **浅度模块**
- 纯函数被抽出来只是为了可测试性，但真正的 bug 藏在它们被调用的方式里？→ **缺少局部性**
- 紧耦合的模块在缝上泄漏？→ **缝被侵蚀**
- 哪些部分没测试，或通过当前接口很难测试？→ **接口不是测试面**

对任何你怀疑是浅度的东西应用**删除测试**：删除它会集中复杂度还是只是移动它？"会集中"是你想要的信号。

### 2. 呈现候选项为 HTML 报告

写一个自包含的 HTML 文件到临时目录（`$TMPDIR` 或 `/tmp`），命名为 `architecture-review-<timestamp>.html`。用 `xdg-open`（Linux）/ `open`（macOS）打开，告诉用户绝对路径。

报告使用 **Tailwind CDN** 做布局和样式，可选 **Mermaid CDN** 做关系图。每个候选项渲染为一张卡片：

- **涉及文件**：哪些文件/模块受影响
- **问题**：为什么当前架构造成摩擦
- **解决方案**：纯语言描述什么会改变
- **收益**：用局部性和杠杆解释，以及测试会如何改善
- **前后对比图**：并排展示，说明浅度状态和深化后的状态
- **推荐强度**：`强烈推荐` / `值得探索` / `试探性`，渲染为徽章

报告末尾放一个**首选推荐**：你会先处理哪个，为什么。

**用 CONTEXT.md 词汇命名领域概念，用 healthy-architecture 1.4 的词汇描述架构。** 如果 CONTEXT.md 定义了 "Order"，说"Order 接收模块"——不是 "FooBarHandler"。

**ADR 冲突**：如果候选项与已有 ADR 矛盾，只在摩擦足够真实到值得重新审视 ADR 时才提出来。在卡片中明确标记（如警告标注："与 ADR-0007 矛盾——但值得重新打开，因为……"）。不要列出 ADR 禁止的每个理论上的重构。

**此时不要提出接口方案。** 文件写出后，问用户："以上候选项中，你想探索哪一个？"

### 3. 盘问循环

用户选择候选项后，运行 `grilling` skill 和 `domain-modeling` skill：

- 如果深化后的模块命名了一个 `CONTEXT.md` 中没有的概念 → 添加到 CONTEXT.md
- 盘问中收紧了模糊术语 → 立即更新 CONTEXT.md
- 用户以有分量的理由拒绝候选 → 提议 ADR："要我把它记录为 ADR 吗？这样以后的架构审查就不会重新建议了。"

---

## HTML 报告技术参考

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>架构体检报告</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
</head>
<body class="bg-gray-50 text-gray-900 min-h-screen">
  <header class="bg-white border-b px-6 py-4">
    <h1 class="text-2xl font-bold">架构体检报告</h1>
    <p class="text-gray-500 text-sm">生成时间：{timestamp} | 项目：{project}</p>
  </header>

  <main class="max-w-5xl mx-auto px-6 py-8 space-y-8">
    <!-- 每个候选项一张卡片 -->
    <section class="bg-white rounded-xl shadow-sm border p-6">
      <!-- 标题 + 推荐强度徽章 -->
      <!-- 涉及文件 -->
      <!-- 问题描述 -->
      <!-- 解决方案 -->
      <!-- 收益（局部性 + 杠杆 + 测试改善） -->
      <!-- 前后对比图（Mermaid / 手绘 div+SVG） -->
    </section>

    <!-- 首选推荐 -->
    <section class="bg-blue-50 rounded-xl border border-blue-200 p-6">
      <h2 class="text-lg font-semibold text-blue-900">首选推荐</h2>
      <!-- ... -->
    </section>
  </main>
</body>
</html>
```

### 推荐强度样式参考

- `强烈推荐`：红色/深橙徽章，表示明显的架构问题
- `值得探索`：蓝色徽章，有潜力但需要更多讨论
- `试探性`：灰色徽章，只是观察到的模式

---

## 禁止行为

- ❌ 不读 CONTEXT.md 和 ADR 就开始探索
- ❌ 用"组件""服务""API"代替深度模块词汇
- ❌ 在报告阶段就提出接口设计方案（留到盘问阶段）
- ❌ 批量处理多个候选项（一次只深入一个）
- ❌ 忽略与 ADR 的矛盾不标注
- ❌ 生成报告但忘记用浏览器打开

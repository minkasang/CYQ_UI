# 任务拆解 — 智能体群聊

## 任务概述

新建 Agent 管理和 Room 管理模块，支持创建独立 Agent 实体并拉入聊天室。MVP 不含实际聊天循环。

---

## 步骤拆解（垂直切片）

### 步骤 1：类型 + Agent Store

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 1.1 | 创建 `types/agent.ts`，定义 `AgentConfig` + `RoomConfig` 接口 | tsc |
| 1.2 | 创建 `store/useAgentStore.ts`（Zustand + fileStorage，CRUD + 重名校验） | tsc + 单元测试 |
| 1.3 | 创建 `store/useRoomStore.ts`（CRUD + 成员管理 + 开关 + 级联清理） | tsc + 单元测试 |

### 步骤 2：Agent 管理 UI

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 2.1 | 创建 `components/agents/AgentCard.tsx`（展示卡片 + 编辑/删除按钮） | tsc |
| 2.2 | 创建 `components/agents/AgentForm.tsx`（新建/编辑表单，模型选择复用 Popover） | tsc |
| 2.3 | 创建 `modules/agents/pages/AgentManagePanel.tsx`（Agent 列表 + 新建/编辑/删除） | 手动验证完整 CRUD 流程 |

### 步骤 3：Room 管理 UI

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 3.1 | 创建 `components/agents/RoomCard.tsx`（展示卡片 + 开关 + 成员数） | tsc |
| 3.2 | 创建 `components/agents/RoomForm.tsx`（命名 + 多选 Agent） | tsc |
| 3.3 | 创建 `modules/agents/pages/RoomManagePanel.tsx`（Room 列表 + 新建/管理/删除） | 手动验证完整 CRUD 流程 |

### 步骤 4：首页 Section 入口

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 4.1 | 创建 `modules/agents/pages/AgentSection.tsx`（统计卡片 + Agent管理/Room管理入口） | tsc |
| 4.2 | 修改 `pages/HomePage.tsx`：新增 agents Section（参考 inspiration） | 手动：首页可见 |
| 4.3 | 修改 `components/layout/Dock.tsx`：加代理图标入口 | 手动 |

### 步骤 5：编译 + Lint + 测试验证

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 5.1 | `tsc --noEmit` 编译通过 | tsc |
| 5.2 | Store 单元测试（Agent CRUD、Room 成员管理、级联清理） | vitest pass |
| 5.3 | 手动验证：创建 Agent → 创建 Room → 拉 Agent → 编辑 → 删除 | 手动 |

---

## 复杂度评估

| 步骤 | 复杂度 | 预计文件数 |
|------|--------|-----------|
| 步骤 1 | 中等 | 3 新文件 + 2 测试 |
| 步骤 2 | 中等 | 3 新文件 |
| 步骤 3 | 中等 | 3 新文件 |
| 步骤 4 | 简单 | 1 新文件 + 2 修改 |
| 步骤 5 | 简单 | 验证为主 |

---

## 依赖关系

```
步骤 1 (Store) ──→ 步骤 2 (Agent UI) ──→ 步骤 4 (HomePage)
                └─→ 步骤 3 (Room UI) ──┘
                                            └── 步骤 5 (验证)
```

步骤 2 和步骤 3 可以并行走，但都依赖步骤 1。

---

## 更新记录

| 时间 | 更新内容 |
|------|----------|
| 2026-06-20 | 创建任务拆解文件 |

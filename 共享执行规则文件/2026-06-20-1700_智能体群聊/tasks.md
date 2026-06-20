# 任务拆解 — 智能体群聊 v2.0

## 设计原则

- 垂直切片：每片贯穿类型→逻辑→UI→测试，可独立完成、独立验证
- 不破坏现有功能：Chat 扩展字段是可选的，旧 Chat 零影响
- 先接口后实现：策略和模块接口先行，实现可推迟

---

## 步骤 1：类型 + Strategy 接口 + contextBuilder（纯逻辑）

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 1.1 | 更新 `types/agent.ts`：ChatAgent、ChatStrategy 接口、StrategyContext | tsc |
| 1.2 | 创建 `modules/ai/strategies/types.ts`（如与 types/agent.ts 重复则合并） | tsc |
| 1.3 | 创建/迁移 `modules/ai/lib/contextBuilder.ts`：纯逻辑，接收 agent+history→输出 systemPrompt+instruction | 单元测试 |
| 1.4 | 创建 `modules/ai/strategies/PassiveStrategy.ts`：Agent 只回人类，Agent 间不互动 | 单元测试 |

## 步骤 2：ChatStore 扩展 + ChatPanel 适配多 Agent

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 2.1 | 扩展 `store/useChatStore.ts`：Chat 加 `agents?: ChatAgent[]`、`strategy?: string`，向后兼容 | tsc + 单元测试 |
| 2.2 | 扩展 `ChatPanel.tsx`：接收 `agents` prop，调用 strategy.execute 替代现有 send 逻辑（当 isMultiAgent 时） | tsc |
| 2.3 | 扩展 `ChatSidebar.tsx`：显示 Agent 数量标签 | tsc |
| 2.4 | 扩展 `ChatInput.tsx`：多 Agent 模式下显示参与者标签 + 策略状态 | tsc |

## 步骤 3：EventDrivenStrategy 实现 + @提及

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 3.1 | 创建 `modules/ai/strategies/EventDrivenStrategy.ts`：多轮收敛 + 冷却 + 并行 + @提及 | 单元测试 |
| 3.2 | 集成到 ChatPanel：单 Agent 走旧逻辑，多 Agent 走 EventDrivenStrategy | 手动 |
| 3.3 | @提及解析：从消息中提取 `@Agent名` → 强制该 Agent 参与本轮 | 单元测试 |

## 步骤 4：Agent 管理 UI 集成

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 4.1 | 移动 `components/agents/` 到 AI 模块内（或保持原位置），确保 AgentCard/AgentForm 可用 | tsc |
| 4.2 | 创建 `AgentSection.tsx` 入口（Agent 管理面板，嵌入 AI 聊天页面或独立 Tab） | tsc |
| 4.3 | ChatSidebar「新建对话」按钮扩展：选择单 Agent / 多 Agent 模式，多 Agent 弹出 Agent 多选 | 手动 |

## 步骤 5：编译 + 测试 + 验证

| 子步骤 | 任务 | 验证方式 |
|--------|------|----------|
| 5.1 | tsc --noEmit 全量编译 | tsc 零错误 |
| 5.2 | 全量单元测试：useAgentStore + useChatStore + contextBuilder + EventDrivenStrategy | vitest 全过 |
| 5.3 | 手动验证：创建Agent→多Agent对话→发消息→@提及→验证并行+多轮 | 手动 |

---

## 依赖关系

```
步骤1 (类型+接口) ──→ 步骤2 (ChatStore+ChatPanel) ──→ 步骤3 (EventDriven)
                  └─→ 步骤4 (Agent管理UI)        ──→ 步骤5 (验证)
```

步骤2和步骤4可并行。

---

## 复杂度评估

| 步骤 | 复杂度 | 改/新增文件数 | 风险 |
|------|--------|-------------|------|
| 步骤 1 | 低 | 3~4 新文件 | 无 |
| 步骤 2 | 中 | 1改 + 2~3扩 | ⚠️ 不能破坏现有单Agent聊天 |
| 步骤 3 | 中 | 1 新文件 | 无 |
| 步骤 4 | 中 | 2~3 新文件 | 无 |
| 步骤 5 | 低 | 验证为主 | 无 |

---

## 更新记录

| 时间 | 更新内容 |
|------|----------|
| 2026-06-20 | v1.0 创建 |
| 2026-06-20 | v2.0 合并 AI 模块 + 垂直切片重新拆解 |

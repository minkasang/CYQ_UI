# 架构设计 - 日记功能稳定性增强

## 设计目标

为日记功能添加稳定性保障机制，确保面向几万用户时的系统可靠性。

## 质量属性检查

| 属性 | 当前状态 | 目标状态 | 实现方式 |
|------|----------|----------|----------|
| 可靠性 | ⚠️ AI 调用无重试 | ✅ 自动重试 + 降级 | 阶段 1 |
| 可维护性 | ⚠️ 错误难追踪 | ✅ 操作日志 | 阶段 3 |
| 可观测性 | ⚠️ 无结构化日志 | ✅ 操作日志 | 阶段 3 |
| 安全性 | ✅ 已有保护 | ✅ 保持 | - |
| 可恢复性 | ⚠️ 白屏无恢复 | ✅ 错误边界 | 阶段 2 |

---

## 架构设计

### 1. AI 调用重试机制

```
┌─────────────────────────────────────────────────────────────┐
│                      表现层 (Components)                      │
│  DiaryToolbar / DiaryFeedback / DiaryChat / EmotionReport   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       服务层 (Service)                        │
│                        aiService.ts                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              retryWithBackoff()                      │    │
│  │  - 指数退避重试（最多 3 次）                           │    │
│  │  - 错误分类（网络错误 / API 错误 / 业务错误）          │    │
│  │  - 降级策略（返回缓存结果或默认值）                    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       外部 API                                │
│            OpenAI / Claude / Gemini / DeepSeek               │
└─────────────────────────────────────────────────────────────┘
```

**重试策略**：
- 网络错误：重试 3 次，指数退避（1s, 2s, 4s）
- API 限流（429）：等待 Retry-After 后重试
- 其他错误：不重试，直接返回错误

**降级策略**：
- 情绪分析失败：返回 null，不影响保存
- AI 润色失败：提示用户重试
- 日记对话失败：显示错误信息

---

### 2. 错误边界

```
┌─────────────────────────────────────────────────────────────┐
│                        App / Layout                          │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                  ErrorBoundary                       │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │              子组件树                        │    │    │
│  │  │  - DiaryEditor                              │    │    │
│  │  │  - DiaryList                                │    │    │
│  │  │  - EmotionChart                             │    │    │
│  │  │  - ...                                      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  │                                                     │    │
│  │  错误时显示：                                        │    │
│  │  - 友好的错误提示                                    │    │
│  │  - 重试按钮                                         │    │
│  │  - 错误日志记录                                      │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**错误处理**：
- 捕获渲染错误
- 记录错误日志到 localStorage
- 显示友好的错误界面
- 提供重试按钮

---

### 3. 操作日志

```
┌─────────────────────────────────────────────────────────────┐
│                      表现层 (Components)                      │
│  DiaryEditor / DiaryList / BackupManager                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       工具层 (Utils)                          │
│                    operationLogger.ts                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  logOperation(type, detail)                          │    │
│  │  - 记录操作类型、时间、详情                           │    │
│  │  - 存储到 localStorage                               │    │
│  │  - 最多保留 1000 条记录                               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据层 (Data)                           │
│                     localStorage                              │
│  operation_logs: [                                           │
│    { type, timestamp, detail, success }                      │
│  ]                                                           │
└─────────────────────────────────────────────────────────────┘
```

**记录的操作**：
- 创建日记
- 更新日记
- 删除日记
- 创建备份
- 恢复备份
- AI 功能调用

---

## 模块依赖关系

```
ErrorBoundary (表现层)
    │
    └── 不依赖其他模块，独立运行

retry.ts (工具层)
    │
    └── 被 aiService.ts 调用

operationLogger.ts (工具层)
    │
    └── 被多个组件调用（DiaryEditor, DiaryList, BackupManager）
```

**依赖方向**：表现层 → 工具层 → 数据层（向内收敛）

---

## 公共 API 设计

### retry.ts

```typescript
// 公开接口
export function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: RetryOptions
): Promise<T>

export interface RetryOptions {
  maxRetries?: number      // 默认 3
  baseDelay?: number       // 默认 1000ms
  maxDelay?: number        // 默认 10000ms
  shouldRetry?: (error: Error) => boolean
}
```

### operationLogger.ts

```typescript
// 公开接口
export function logOperation(
  type: OperationType,
  detail: Record<string, unknown>,
  success?: boolean
): void

export function getOperationLogs(): OperationLog[]
export function clearOperationLogs(): void

export type OperationType =
  | 'diary:create'
  | 'diary:update'
  | 'diary:delete'
  | 'backup:create'
  | 'backup:restore'
  | 'ai:polish'
  | 'ai:emotion'
  | 'ai:feedback'
  | 'ai:chat'
```

### ErrorBoundary.tsx

```typescript
// 公开接口
export function ErrorBoundary(props: {
  children: React.ReactNode
  fallback?: React.ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}): JSX.Element
```

---

## 测试策略

| 层级 | 测试内容 | 测试方式 |
|------|----------|----------|
| 单元测试 | retryWithBackoff 函数 | 模拟失败场景 |
| 单元测试 | logOperation 函数 | 验证日志记录 |
| 集成测试 | AI 调用重试 | 模拟网络错误 |
| 集成测试 | 错误边界 | 模拟组件错误 |
| 手动测试 | 完整流程 | 功能测试清单 |

---

## 更新记录

| 时间 | 更新内容 |
|------|----------|
| 2026-06-17 | 创建架构设计文件 |

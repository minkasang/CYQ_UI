// ChatStrategy 可拔插接口 — 重新导出
// 缝位置：ChatPanel 依赖此接口，不依赖具体策略实现
// 新增策略 = 新增文件实现此接口，不改 ChatPanel

export type {
  ChatStrategy,
  StrategyContext,
  ChatAgent,
  AgentModule,
  AgentModuleContext,
  AgentModuleResult,
} from '../../../types/agent'

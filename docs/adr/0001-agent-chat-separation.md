# 0001：1v1 与群聊分离存储

多 Agent 聊天系统拆分为两个独立子域：Agent 对话（1v1）和群聊（Group Chat）。两者数据模型、存储文件、Store 完全独立。

原因：1v1 模式无策略/冷却/并行等概念，与群聊共享存储导致数据模型混杂、旧 chat 引用断裂、1v1 对话意外受到群聊规则影响。

决策：
- 1v1 对话 → `stores/agentChatStore.ts` → `data/agent_chats.json`
- 群聊 → `stores/groupChatStore.ts` → `data/group_chats.json`
- Agent 实体 → `store/useAgentStore.ts` → `data/agents.json`（不变）

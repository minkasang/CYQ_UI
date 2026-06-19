# 模块开关功能（重做：localStorage 方案）

## 阶段一：拆解

### 任务1.1：回退 ModuleManager 过度改动
- 移除新增的 `getAllModuleStates()` 方法
- 移除新增的 `getEnabledModules()` 方法
- 恢复 `enableModule`/`disableModule` 原样（去掉幂等化）
- **验证**：tsc 零错误

### 任务1.2：useModuleRoutes 改用 localStorage 过滤
- 定义 key 规范：`module_toggle_{moduleId}` = `'on'` | `'off'`
- 默认全部为 `'on'`
- 路由渲染时只包含 localStorage 为 `'on'` 的模块
- 监听自定义事件触发重新渲染
- **验证**：页面路由正常

### 任务1.3：SettingsPage 模块开关
- 从 localStorage 读取所有模块开关状态
- 每个模块一个开关，点击写 localStorage + 派发自定义事件
- "设置"模块不可关闭
- **验证**：开关状态正确显示，点击后持久化

### 任务1.4：编译 + 测试
- tsc 零错误
- vitest 全部通过
- **验证**：执行验证命令

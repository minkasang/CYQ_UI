# 模块热拔插接入

## 任务

### 1. 创建 useModuleRoutes hook ✅
- 从 `ModuleManager.getInstalledModules()` 读取路由
- 输出 React Router `<Route>` 元素
- **产出**：[src/hooks/useModuleRoutes.tsx](file:///media/cyq/455E28568C7503F7/project/cyq_UI/个人工作台/src/hooks/useModuleRoutes.tsx)

### 2. 创建 ModuleRegistry 单例 ✅
- 全局 ModuleManager + ModuleContext
- **产出**：[src/core/ModuleRegistry.ts](file:///media/cyq/455E28568C7503F7/project/cyq_UI/个人工作台/src/core/ModuleRegistry.ts)

### 3. 改造 App.tsx ✅
- 用 `useModuleRoutes` 替代硬编码 import + Route
- 保留 Layout 和 Demo 页不动
- **产出**：[src/App.tsx](file:///media/cyq/455E28568C7503F7/project/cyq_UI/个人工作台/src/App.tsx)

### 4. 编译 + 验证 ✅
- `tsc --noEmit` 零错误
- `/` `/todo` `/diary` `/settings` 页面正常加载
- 删除模块文件不影响其他模块

## 全部完成

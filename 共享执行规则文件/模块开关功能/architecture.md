# 模块开关功能 — 架构设计（重做版）

## 设计原则

**单一职责**：UI 开关是用户偏好，不属模块生命周期。ModuleManager 只管理模块状态机，不碰用户配置。

## 质量属性如何实现

| 属性 | 方案 |
|------|------|
| **可维护性** | 一个 key 规范 `module_toggle_{id}`，无新接口 |
| **可靠性** | localStorage 同步读写，不抛异常 |
| **可扩展性** | 新模块加一行 key 判断 |
| **性能** | 一次 localStorage.getItem，无 Map 遍历 |

## 数据流

```
localStorage[module_toggle_todo] = 'off'
        ↓
SettingsPage 点击 → localStorage.setItem + 派发 CustomEvent
        ↓
useModuleRoutes 监听事件 → 重新读取 localStorage → 过滤路由
```

## 关键约束

- ModuleManager **零改动**
- 不在核心模块加任何公开方法
- 页面刷新后开关状态保持（localStorage 天生持久化）

## 接口契约

无新增。唯一的约定是 key 命名规范：
```
module_toggle_{模块id}  ∈  'on' | 'off'
```

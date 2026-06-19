# 模块开关首页联动 — 架构设计

## 问题本质

`HomePage.tsx` 硬编码渲染所有模块 section，未读取 `localStorage[module_toggle_{id}]` 开关状态。用户点击设置页开关后，`notifyModuleToggleChanged()` 触发了路由层和侧边栏的重渲染，但 HomePage 未订阅该通知。

## 质量目标实现

| 质量属性 | 实现方式 |
|---------|---------|
| **可靠性** | 复用现有 localStorage 读写机制，零新增存储逻辑 |
| **可维护性** | 开关读函数集中导出，Single Source of Truth |
| **可扩展性** | 新增模块只需在 `ALL_MODULE_IDS` 加一行 |
| **性能** | 仅在开关切换时重渲染，无轮询 |
| **可测试性** | `isModuleToggledOn` 为纯函数，可单独测试 |
| **兼容性** | 不改 ModuleManager、不改 SettingsPage 核心逻辑 |

## 设计维度

### 1. 设计原则（SOLID）

- **单一职责**：`isModuleToggledOn` 只管读 localStorage，`useModuleToggles` 只管订阅通知
- **开闭原则**：扩展开关覆盖范围（加 welcome），不修改现有开关逻辑核心
- **依赖反转**：HomePage 依赖导出的纯函数，不依赖 ModuleManager

### 2. 项目结构

```
个人工作台/src/
├── hooks/useModuleRoutes.tsx  ← 改动：导出 isModuleToggledOn + 新增 useModuleToggles
├── pages/HomePage.tsx         ← 改动：条件渲染
└── components/layout/Sidebar.tsx ← 改动：ALWAYS_ON 调整 + chat→ai 映射
    modules/settings/pages/SettingsPage.tsx ← 零改动（自动获取 ALL_MODULE_IDS）
```

### 3. 接口与契约

```typescript
// 唯一的公开契约保持不变
localStorage key: module_toggle_{id} ∈ 'on' | 'off'
// 默认（key 不存在）= 'on'

// 新增导出（useModuleRoutes.tsx）
export function isModuleToggledOn(id: string): boolean
export function useModuleToggles(): { isOn: (id: string) => boolean }
```

### 4. 数据流

```
SettingsPage 点击开关
  → writeToggle(id, on/off)
    → localStorage.setItem(STORAGE_PREFIX + id, on ? 'on' : 'off')
    → notifyModuleToggleChanged()
      → _refreshVersion++
      → listeners.forEach(fn => fn())        // useModuleRoutes 重算路由
      → window.__sidebarRefresh()            // Sidebar 重渲染

[新增链路]
      → HomePage 的 useModuleToggles() 也监听 listeners
        → setVersion() → re-render
          → 读取 localStorage → isModuleToggledOn(id)
            → 条件渲染各 section
```

### 5. 错误处理

- `localStorage.getItem` 不抛异常（key 不存在返回 null，走默认 on）
- `notifyModuleToggleChanged` 中 `__sidebarRefresh` 用可选链兜底
- HomePage 的条件渲染用 `&&` 短路，不会因开关缺失而崩溃

### 6. 可测试性设计

- `isModuleToggledOn` 是纯函数（读 localStorage），可独立单元测试
- `useModuleToggles` 依赖 global `listeners` 数组，需集成测试
- Sidebar 的 `isOn` 函数也可独立测试
- HomePage 渲染结果可快照测试（mock localStorage）

## 关键决策

### Q: chat section 为什么跟随 ai 开关？
A: 项目中没有独立的 `chat` 模块，`ChatPanel` 是 AI 模块的组成部分。用户期望关 AI 模块时，相关的一切（AI 总结 + AI 聊天）都消失。

### Q: welcome 为什么要加入 ALL_MODULE_IDS？
A: SettingsPage 的开关列表来自 `ALL_MODULE_IDS`。添加后自动出现"首页"开关，零改动 SettingsPage。

### Q: GlobalBackground 为什么不跟随 wallpaper 开关？
A: 壁纸设置 UI 和壁纸背景渲染是两个独立关注点。关掉设置界面不影响已设置的背景图片。

## 改动范围总结

| 文件 | 改动行数 | 风险 |
|------|---------|------|
| `useModuleRoutes.tsx` | ~10 行 | 低：仅导出+添加常量 |
| `Sidebar.tsx` | ~5 行 | 低：仅改 ALWAYS_ON + isOn 逻辑 |
| `HomePage.tsx` | ~30 行 | 中：条件渲染包裹，需确保不破坏动画 |
| `SettingsPage.tsx` | **0 行** | 零 |

## 架构健康自查

- [x] 模块职责清晰：开关读/通知/渲染三层分离
- [x] 接口稳定：仅新增导出，不改变现有契约
- [x] 依赖方向正确：HomePage → useModuleRoutes（hooks），不反向
- [x] 错误有处理：localStorage 缺失 = 默认 on
- [x] 可测试：isModuleToggledOn 纯函数
- [x] 无过度设计：条件渲染用 `&&`，不引入新抽象层
- [x] 副作用隔离：纯函数读 localStorage，hook 管理订阅

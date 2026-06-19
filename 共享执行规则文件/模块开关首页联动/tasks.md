# 模块开关首页联动 — 任务拆解

## 背景
模块开关功能（已归档）实现了路由层和侧边栏的开关过滤，但 `HomePage.tsx` 硬编码渲染所有 section，未读取 localStorage 开关状态。用户关闭某模块开关后，侧边栏入口消失了，但首页 section 仍显示。

## 需求确认
| 模块 key | 首页 section | 侧边栏入口 | 关闭后行为 |
|---------|-------------|-----------|-----------|
| `welcome` | `#welcome`（欢迎区+统计卡+滚动提示） | 首页 | **全部消失**（新增开关） |
| `todo` | `#todo`（每日待办） | 待办 | 全部消失 |
| `diary` | `#diary`（每日日记） | 日记 | 全部消失 |
| `ai` | `#ai`（AI 总结）+ `#chat`（AI 聊天） | AI 总结 + AI 聊天 | 全部消失（一个开关控制两个 section） |
| `wallpaper` | `#wallpaper`（壁纸设置） | 壁纸 | 全部消失 |
| `settings` | 无首页 section | 设置 | **始终显示**（不可关闭） |

**额外规则：**
- 统计卡片跟随各自模块：今日待办/已完成→`todo`，日记总数/今日日记→`diary`
- 向下滚动提示按钮指向 `#todo`，跟随 `todo` 开关
- `GlobalBackground`（全局壁纸背景）不受开关影响，始终存在

---

## 阶段 1：useModuleRoutes.tsx 改动

### 1.1 添加 welcome 到模块枚举
- 在 `ALL_MODULE_IDS` 前添加 `'welcome'`
- 在 `MODULE_NAMES` 添加 `welcome: '首页'`
- **验证**：SettingsPage 应自动出现"首页"开关

### 1.2 导出 isModuleToggledOn
- 将 `function isModuleToggledOn` 改为 `export function isModuleToggledOn`
- **验证**：`HomePage.tsx` 可 import 此函数，tsc 无错误

### 1.3 新增 useModuleToggles hook
- 提供 React hook 供 HomePage 订阅开关变化
- 复用现有 `listeners` 机制，不做新的通知体系
- **验证**：Hook 返回值随 `notifyModuleToggleChanged()` 调用而变化

---

## 阶段 2：Sidebar.tsx 改动

### 2.1 调整 ALWAYS_ON
- 从 `new Set(['welcome', 'settings', 'chat'])` 改为 `new Set(['settings'])`
- `welcome` 变为可关闭，`chat` 改用 `ai` 的开关

### 2.2 chat 入口跟随 ai 开关
- `isOn('chat')` 改为读取 `module_toggle_ai` 而非 `module_toggle_chat`
- **验证**：关掉 `ai` 开关后，侧边栏"AI 总结"和"AI 聊天"同时消失

### 2.3 联动通知适配
- 如果 HomePage 改用新的通知方式，确保 `__sidebarRefresh` 不受影响
- **验证**：开关切换后，侧边栏入口正确显隐

---

## 阶段 3：HomePage.tsx 改动

### 3.1 引入开关读取能力
- Import `isModuleToggledOn` from `useModuleRoutes`
- 添加 `useModuleToggleListener()` hook 订阅通知

### 3.2 条件渲染 section
- `#welcome`：`{isModuleToggledOn('welcome') && <section>...</section>}`
- `#todo`：同上，key=`'todo'`
- `#diary`：同上，key=`'diary'`
- `#ai`：同上，key=`'ai'`
- `#chat`：同上，key=`'ai'`（注意！chat 跟随 ai 开关）
- `#wallpaper`：同上，key=`'wallpaper'`

### 3.3 统计卡片条件渲染
- "今日待办"+"已完成"：跟随 `todo`
- "日记总数"+"今日日记"：跟随 `diary`
- 注意 grid 列数动态调整（4个全开→2列，2个→1列等）

### 3.4 向下滚动提示
- 跟随 `todo` 开关，因为 scrollTo('todo')

---

## 阶段 4：SettingsPage.tsx（自动生效，无需改动）
- `ALL_MODULE_IDS` 新增 `welcome` 后自动出现"首页"开关
- `settings` 仍 disabled
- **验证**：设置页出现"首页"开关，可正常切换

---

## 阶段 5：全链路集成测试
见 test.md

---

## 依赖关系
```
阶段1（useModuleRoutes.tsx）
  ├→ 阶段2（Sidebar.tsx）
  └→ 阶段3（HomePage.tsx）
        └→ 阶段5（集成测试）
阶段4（SettingsPage 自动生效，零改动）

执行顺序：1 → 2+3 并行 → 5
```

## 回滚方案
- git revert 到备份提交即可
- 所有改动局限在 3 个文件，风险可控

# 模块开关首页联动 — 测试报告

## 改动文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `src/hooks/useModuleRoutes.tsx` | 修改 | 导出 `isModuleToggledOn`，新增 `useModuleToggles` hook，`ALL_MODULE_IDS` 添加 `welcome` |
| `src/pages/HomePage.tsx` | 修改 | 所有 section + 统计卡片条件渲染 |
| `src/components/layout/Sidebar.tsx` | 修改 | `ALWAYS_ON` 缩为 `['settings']`，`chat` 映射到 `ai` 开关 |
| `src/modules/settings/pages/SettingsPage.tsx` | **零改动** | 自动获取 `ALL_MODULE_IDS` 枚举 |
| `src/test/module/settingsToggle.test.tsx` | 更新 | 测试用例适配 6 个开关 + 新索引 |
| `src/test/module/sidebarToggle.test.tsx` | 更新 | "首页永远显示" → "首页可被关闭" |

## 测试执行

```
$ npx vitest run
Test Files  2 failed | 13 passed (15)
     Tests  109 passed (109)
```

> 2 个失败文件为 `regression.test.ts` 和 `moduleSystem.test.ts`，是空测试文件，**与本次改动无关**，之前就存在。

## 测试覆盖（按分类）

### 单元测试
| 测试 | 文件 | 验证内容 | 结果 |
|------|------|---------|------|
| `isModuleToggledOn` 默认 on | moduleToggle.test.ts | key 不存在返回 true | ✓ |
| `isModuleToggledOn` 设为 off | moduleToggle.test.ts | key='off' 返回 false | ✓ |
| `isModuleToggledOn` 恢复 on | moduleToggle.test.ts | 改回 'on' 返回 true | ✓ |
| Sidebar isOn() 函数 | sidebarToggle.test.tsx | ALWAYS_ON 仅 settings | ✓ |
| chat→ai 映射 | sidebarToggle.test.tsx | `module_toggle_ai='off'` → chat 隐藏 | ✓ |

### 集成测试
| 测试 | 验证内容 | 结果 |
|------|---------|------|
| SettingsPage 渲染 6 开关 | 含"首页"开关，settings 始终 disabled | ✓ |
| 默认全开 | 所有 checkbox checked | ✓ |
| 点击开关写 localStorage | `module_toggle_todo='off'` 写入成功 | ✓ |
| 关闭后再开启 | `module_toggle_todo` 恢复 'on' | ✓ |
| Sidebar 默认全显示 | 所有导航项可见 | ✓ |
| 关闭待办 | sidebar "待办"消失 | ✓ |
| 关闭多个 | todo+diary 消失，ai 存在 | ✓ |
| 关闭 welcome | "首页"从 sidebar 消失 | ✓ |
| 设置不可关 | settings='off' 仍显示"设置" | ✓ |

### 端到端验证（手动测试路径）
1. 启动 dev server → 首页正常渲染所有 section ✓
2. 进入设置页 → 出现"首页"开关 ✓
3. 关闭"待办管理" → 首页 `#todo` section 消失，统计卡"今日待办/已完成"消失，sidebar "待办"消失 ✓
4. 关闭"日记" → 首页 `#diary` section 消失，统计卡"日记总数/今日日记"消失 ✓
5. 关闭"AI 助手" → 首页 `#ai` + `#chat` 两个 section 消失，sidebar "AI 总结" + "AI 聊天"都消失 ✓
6. 关闭"壁纸引擎" → 首页 `#wallpaper` section 消失，sidebar "壁纸"消失 ✓
7. 关闭"首页" → 欢迎区全部消失 ✓
8. 刷新页面 → 开关状态保持 ✓
9. 重新打开各开关 → 所有内容恢复 ✓

## 测试分类对照

| 分类 | 覆盖说明 |
|------|---------|
| **数据一致性** | localStorage 读写一致，刷新后保持 |
| **边界与极限** | 全关后首页仅剩空白+底部留白，不崩溃 |
| **渲染与视觉** | 条件渲染不破坏动画机制 |
| **实际效果** | 开关控制首页 section 显隐 ✓ |

## 总结

- **回归测试**：109/109 通过（2 个空文件不计）
- **tsc 编译**：零错误
- **改动范围**：3 个生产文件 + 2 个测试文件
- **风险等级**：低（未动 ModuleManager、Store、路由逻辑）

## Bug 修复记录

### BUG-1：滚动入场动画在开关切换后失效
- **现象**：关掉模块→再打开→section 不可见（opacity-0 永不触发过渡）
- **根因**：`useScrollAnimation` 用 `useRef`，条件渲染使 ref 初始为 null，Observer 未创建；
  后续 ref 变非 null 但 `useEffect([threshold])` 不重跑
- **修复**：改为 callback ref (`useState<HTMLElement | null>`)，
  ref 变化→state 变化→effect 重跑→Observer 重新创建
- **文件**：[HomePage.tsx](file:///media/cyq/455E28568C7503F7/project/cyq_UI/个人工作台/src/pages/HomePage.tsx#L27-L46)

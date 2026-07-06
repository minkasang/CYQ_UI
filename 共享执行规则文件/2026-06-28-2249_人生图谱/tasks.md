# 任务拆解 - 人生图谱

> 任务名：人生图谱  
> 创建时间：2026-06-28 22:49  
> 最后更新：2026-06-28 23:15  
> 目标：将“每日灵感”升级为能长期收集、理解并转化人生感悟的第一版系统。  
> 当前状态：**in_progress** — MVP 第一阶段代码已完成，待浏览器验收。

---

## 共识总结

### 要做什么

- 将现有“每日灵感”从摘录/灵感收藏升级为“人生图谱”的 MVP。
- 默认提供安静、私人、精神性的漫游体验。
- 需要改变时，展开锚定模式：洞察、价值、障碍、原则、小行动实验。
- 保留旧数据和旧入口，不破坏现有模块开关、首页、独立路由与持久化。

### 不做什么

- 第一阶段不接入真正 AI 自动分析。
- 第一阶段不自动读取日记内容，不跨模块写入日记。
- 第一阶段不做强制打卡、惩罚、连续天数等压迫式机制。
- 第一阶段不改全局布局壳和主题系统。

### 验收标准

- 旧的每日灵感记录仍能正常显示、编辑、删除和回顾。
- 新增记录可选择类型、维度、洞察、原则、小行动实验等字段。
- UI 不再是简单堆叠列表，而是具备“内在空间 + 成长工具”的信息层级。
- 主题/维度概览能从现有数据中派生，不存重复统计状态。
- store 单元测试覆盖新增字段、兼容旧数据、行动实验更新和派生统计。

---

## 垂直切片拆解

### 阶段 1：文档与边界 ✅

- [x] 更新 `CONTEXT.md`：登记人生图谱相关术语。
- [x] 新建本任务 `tasks.md`、`architecture.md`、`test.md`。
- [x] 新建 `个人工作台设计规范/人生图谱/功能设计规范.md`。
- [x] 验证：文档命名一致，任务清单有且只有一个 `in_progress`。

### 阶段 2：数据模型与核心逻辑 ✅

- [x] 扩展 `InspirationItem`，新增类型、维度、洞察、原则、行动实验等字段。
- [x] 扩展 `useInspirationStore` 的 `add` / `update` / `updateActionExperiment`。
- [x] 用 `useMemo` 派生内在图谱概览，不把统计结果存入持久化。
- [x] 验证：`useInspirationStore` 单元测试 18/18 通过。

### 阶段 3：UI 重构 ✅

- [x] 重做 `InspirationSection` 为三块结构：
  - 顶部：人生图谱 Hero + 当前回看卡。
  - 中部：收集箱 + 漫游/锚定模式。
  - 底部/侧栏：内在图谱、原则提醒、小行动实验、记录流。
- [x] 保留搜索、编辑、删除、收藏、触动程度。
- [ ] 验证：完整 TypeScript build 未通过（阻塞来自既有待办标签模块，非本任务）。

### 阶段 4：入口文案同步 ✅

- [x] 更新模块元数据、首页 Bento 卡片、普通首页标题与 Dock/Sidebar/TopNav 文案。
- [x] 验证：模块 id 仍为 `inspiration`，路由仍为 `/inspiration`，持久化 key 不变。

### 阶段 5：测试与报告 ⚠️ 部分完成

- [x] 运行 `useInspirationStore` 单元测试：18/18 通过。
- [x] 本次修改文件 linter 无错误。
- [x] 更新 `test.md` 记录测试分类、执行结果、遗留风险。
- [ ] 浏览器手动视觉验收（首页手风琴 + `/inspiration` 独立页）。
- [ ] 完整 `npm run build`（需先修复既有待办标签 TS 错误）。

---

## 当前进度总结

| 维度 | 状态 |
|------|------|
| 任务状态 | `in_progress` |
| 阶段完成度 | 1✅ 2✅ 3✅ 4✅ 5⚠️（5/5 代码完成，验收未完成） |
| 单元测试 | 通过（18/18） |
| Linter | 本次修改文件 0 错误 |
| 完整构建 | 被既有待办标签模块阻塞 |
| 视觉验收 | 待用户打开应用确认 |
| 下一步 | 浏览器验收 → 微调 UI → 归档或阶段 2 |

### 已变更代码文件

| 文件 | 变更 |
|------|------|
| `src/types/index.ts` | 新增 `InspirationKind`、`LifeDimension`、`ActionExperiment` 等类型 |
| `src/store/useInspirationStore.ts` | 扩展 add/update，新增 `updateActionExperiment` |
| `src/store/__tests__/useInspirationStore.test.ts` | 新增 6 项人生图谱相关测试 |
| `src/modules/inspiration/pages/InspirationSection.tsx` | 全面 UI 重构 |
| `src/modules/inspiration/pages/InspirationPage.tsx` | 移除重复标题，放宽容器宽度 |
| `src/modules/inspiration/index.ts` | 模块元数据改为「人生图谱」 |
| `src/pages/HomePage.tsx` | Section 标题/副标题 |
| `src/pages/HomePageBento.tsx` | Bento 卡片与手风琴标签 |
| `src/components/layout/Dock.tsx` | Dock 标签「图谱」 |
| `src/components/layout/Sidebar.tsx` | 侧边栏标签「图谱」 |
| `src/layouts/TopNavLayout.tsx` | 顶栏标签「图谱」 |
| `src/hooks/useModuleRoutes.tsx` | 模块名「人生图谱」 |

### 已产出文档

| 文件 | 说明 |
|------|------|
| `CONTEXT.md` | 人生图谱术语表 |
| `共享执行规则文件/2026-06-28-2249_人生图谱/tasks.md` | 本文件 |
| `共享执行规则文件/2026-06-28-2249_人生图谱/architecture.md` | 架构设计 |
| `共享执行规则文件/2026-06-28-2249_人生图谱/test.md` | 测试报告 |
| `个人工作台设计规范/人生图谱/功能设计规范.md` | 产品功能规范 |

---

## 回退边界

- 数据字段为向后兼容新增，回退 UI 不影响旧字段读取。
- 模块 id 仍为 `inspiration`，路由仍为 `/inspiration`，避免破坏用户现有入口。
- 若 UI 重构有问题，可先回退 `InspirationSection.tsx`，store 新字段可保留。

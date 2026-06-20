# 任务拆解 — 主题系统模块化

> 创建时间：2026-06-20 16:16
> 架构参考：architecture.md

---

## 任务概览

| 阶段 | 步骤 | 内容 | 文件数 |
|------|:----:|------|:------:|
| S0 | 0.1 | 功能设计规范 | 1 |
| S1 | 1.1 | 引擎参数注册表 `presetRegistry.ts` | 1 |
| S2 | 2.1 | 主题 Store `useThemePresetStore.ts` | 1 |
| S3 | 3.1 | 内置主题 + 数据迁移 | 2 |
| S4 | 4.1 | 三栏主题页面骨架 | 2 |
| S5 | 5.1 | 左侧主题列表 `ThemeList.tsx` | 1 |
| S6 | 6.1 | 右侧配置面板 `ThemeConfig.tsx` + `ParamSlider.tsx` | 2 |
| S7 | 7.1 | 应用主题 + 实时预览 | 1 |
| S8 | 8.1 | 导入/导出 JSON | 1 |
| S9 | 9.1 | 模块注册 + 导航 + Dock | 2 |
| S10 | 10.1 | 全面测试 | 1 |

---

## 详细步骤

### S0：功能设计规范
- [ ] **0.1** 编写 `个人工作台设计规范/主题系统/功能设计规范.md`
  - 功能清单、用户路径、布局草图、状态覆盖
  - 验证：文档完整

### S1：引擎参数注册表
- [ ] **1.1** 创建 `src/themes/presetRegistry.ts`
  - 注册 LiquidGlass + Flat 引擎的 `EngineMeta`（参数名/类型/范围/默认值）
  - 验证：`tsc` 零错误

### S2：主题 Store
- [ ] **2.1** 创建 `src/store/useThemePresetStore.ts`
  - 状态：`presets[]`, `activeId`
  - 操作：`addPreset`, `removePreset`, `applyPreset`, `updatePreset`
  - 持久化：JSON 文件 `data/theme_presets.json`
  - 验证：`tsc` + 单元测试

### S3：内置主题
- [ ] **3.1** 定义 2-3 个内置主题 + 迁移逻辑
  - 首次加载时自动写入内置主题
  - 验证：内置主题不可删除

### S4：主题页面骨架
- [ ] **4.1** 创建 `src/modules/theme/pages/ThemePage.tsx`
  - 三栏布局（responsive：桌面三栏，平板堆叠）
  - 验证：`tsc` + 渲染三栏

### S5：左侧主题列表
- [ ] **5.1** 创建 `src/components/theme/ThemeList.tsx`
  - 显示内置 + 自定义主题列表
  - 选中高亮，自定义可删除
  - 导入/导出按钮
  - 验证：列表渲染、选中切换

### S6：右侧配置面板
- [ ] **6.1** 创建 `ThemeConfig.tsx` + `ParamSlider.tsx` + `FontConfig.tsx`
  - 根据当前引擎动态渲染参数滑块
  - 字体选择（family + size）
  - 壁纸简要设置
  - 「保存为新主题」按钮
  - 验证：切换引擎→面板参数变化

### S7：应用主题 + 预览
- [ ] **7.1** 实现 `applyPreset`：引擎 + 字体 + 壁纸一站式应用
  - 选中主题 = 实时预览
  - 验证：切换主题→页面立即变化

### S8：导入/导出
- [ ] **8.1** JSON 导入导出功能
  - 导出：选中主题 → 下载 JSON
  - 导入：选择文件 → 校验 → 添加到列表
  - 验证：导出再导入，主题一致

### S9：模块注册 + 导航
- [ ] **9.1** 注册为模块（`modules/theme/index.ts`）+ Dock 加图标 + 设置页可选
  - 验证：Dock 出现主题图标，设置页有开关

### S10：全面测试
- [ ] **10.1** tsc + vitest + build + 手动验收
  - 覆盖：数据一致性、渲染、交互、导入导出、切换
  - 验证：tsc 0 错误，vitest 通过，build 成功

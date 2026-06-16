# Bug 修复记录

## 2026-06-15 LiquidGlass 定位错位问题

### 问题描述
官方 `liquid-glass-react` 组件在页面中显示错乱：
- 卡片散落在不同位置
- 文字被裁剪
- 出现多个重叠/分离的元素

### 根本原因
官方组件返回了多个并列的 Fragment 子元素（overLight、border、hover 等），这些元素都使用了 `positionStyles`：

```tsx
const positionStyles = {
  position: baseStyle.position || "relative",
  top: baseStyle.top || "50%",
  left: baseStyle.left || "50%",
}
```

问题：
1. 默认 `position: relative` → 元素在文档流中堆叠，每个都偏移 `top: 50%`
2. `positionStyles` 缺少 `transform: translate(-50%, -50%)` → absolute 层只定位到中心点但不居中
3. 组件返回 Fragment，没有统一的定位容器 → 各层散开

### 修复过程

#### 尝试 1：外层加 `position: relative` 容器
**结果**：失败。虽然容器有了定位基准，但组件内部 relative 元素仍然堆叠偏移。

#### 尝试 2：传 `style={{ position: 'absolute' }}`
**结果**：部分改善。所有层变成 absolute，但 `positionStyles` 缺少 `transform`，导致元素左上角在容器中心，不向中心对齐。

#### 尝试 3：复制源码到本地，修正 `positionStyles`
**结果**：成功。

修正内容：
```tsx
// 官方代码（有 bug）
const positionStyles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  // 缺少 transform！
}

// 修正后
const positionStyles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)", // ← 加上居中 transform
}
```

同时：
- 外层容器保持 `position: relative` + 固定宽高
- 组件内部所有层统一使用修正后的 `positionStyles`
- 确保所有层在容器内居中重叠

### 验证
访问 `/demo` 页面，3 个卡片：
1. 垂直排列整齐
2. 鼠标悬停时玻璃扭曲效果正常
3. 无错位、无裁剪

### 文件变更
- 新增：`src/components/glass/LiquidGlassNative.tsx`
- 新增：`src/components/glass/shader-utils-local.ts`
- 新增：`src/components/glass/displacement-maps.ts`
- 修改：`src/pages/DemoPage.tsx`

---

## 2026-06-15 首页排版错乱问题

### 问题描述
首页统计卡片区域排版异常：
- 卡片间距过大，上下留白过多
- 内容未居中，视觉重心偏移
- 下方区域出现不明空白块
- 整体页面高度被强制拉伸（`min-h-[90vh]`）

### 根本原因
1. 外层容器使用了 `min-h-[90vh]`，强制撑高页面，导致元素分散
2. 内边距 `py-12`（48px）过大，上下留白过多
3. 网格/弹性布局参数不当，元素之间 `gap` 过大

### 修复过程

#### 尝试 1：调整 gap 和 padding
**结果**：部分改善，但 `min-h-[90vh]` 仍然撑高页面。

#### 尝试 2：移除最小高度限制，收紧 padding
**结果**：成功。

修正内容：
```tsx
// 修复前
<div className="min-h-[90vh] py-12 ...">

// 修复后
<div className="py-8 ...">
  // 移除 min-h-[90vh]
  // 调整 padding 为 py-8
```

同时调整了统计卡片的间距和字体大小，使整体更紧凑。

### 验证
首页布局：
1. 统计卡片紧凑排列，无过大间距
2. 内容垂直居中，视觉平衡
3. 页面高度由内容自然决定，无强制拉伸

### 文件变更
- 修改：`src/pages/HomePage.tsx`（或相关首页文件）

---

## 2026-06-15 Demo 背景不明显导致玻璃效果不可见

### 问题描述
在 `/demo` 页面测试液态玻璃组件时：
- 玻璃卡片的扭曲/折射效果几乎看不出来
- 鼠标悬停时的位移贴图效果不明显
- 整体看起来像普通毛玻璃，没有"液态"质感

### 根本原因
`feDisplacementMap`（位移贴图滤镜）的工作原理是对**背后的内容**进行像素偏移。如果背景颜色单一、对比度低，即使发生像素位移，肉眼也难以察觉。之前的背景：
- 暗色底色 `#1a1a2e` 过于均匀
- 网格线透明度只有 `0.03`，几乎看不见
- 彩色光斑颜色太淡、透明度太低（`0.2~0.3`）
- 缺乏高对比度的图案或色块

### 修复过程

#### 尝试 1：增加网格透明度
**结果**：略有改善，但 still 不够明显。

#### 尝试 2：使用更鲜艳、对比度更高的彩色渐变背景
**结果**：成功。玻璃扭曲效果肉眼可见。

修正内容：
```tsx
// 修复前
backgroundColor: '#1a1a2e',
backgroundImage: `
  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px),
  radial-gradient(circle at 20% 50%, rgba(120, 80, 200, 0.3) 0%, transparent 50%),
  ...
`,

// 修复后
backgroundColor: '#0f0c29',
backgroundImage: `
  linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px),
  radial-gradient(circle at 15% 30%, rgba(255, 50, 100, 0.45) 0%, transparent 55%),
  radial-gradient(circle at 85% 20%, rgba(50, 200, 255, 0.4) 0%, transparent 50%),
  radial-gradient(circle at 70% 75%, rgba(150, 50, 255, 0.4) 0%, transparent 55%),
  radial-gradient(circle at 30% 80%, rgba(255, 200, 50, 0.35) 0%, transparent 50%),
  radial-gradient(circle at 50% 50%, rgba(0, 255, 180, 0.15) 0%, transparent 60%),
  linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)
`,
```

改进点：
1. 网格线透明度从 `0.03` → `0.06`，纹理更清晰
2. 彩色光斑使用高饱和色（亮粉、青蓝、紫、金黄）
3. 透明度提升到 `0.35~0.45`，对比度更强
4. 增加底部渐变色带 `#0f0c29 → #302b63 → #24243e`，丰富层次
5. 光斑位置分散在四角和中心，确保玻璃覆盖区域背后总有高对比色块

### 验证
访问 `/demo` 页面：
1. 背景有明显的网格+彩色光斑
2. 鼠标悬停玻璃卡片时，背后颜色扭曲/折射肉眼可见
3. 玻璃质感从"普通毛玻璃"提升为"液态玻璃"

### 文件变更
- 修改：`src/pages/DemoPage.tsx`

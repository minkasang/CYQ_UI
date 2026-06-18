# 弹窗修复任务分解

## 问题描述
1. 部分弹窗不是液态玻璃效果，显示为纯黑色
2. 弹窗点击空白区域不会自动关闭
3. 部分弹窗无法关闭

## 任务拆解

### 步骤1：定位问题弹窗 ✅
- [x] 搜索所有弹窗组件
- [x] 识别使用纯黑色背景的弹窗
- [x] 识别缺少点击空白关闭功能的弹窗

**发现的问题弹窗：**
- GlassControlPanel.tsx (玻璃调参面板)
- APIKeyModal.tsx (API Key管理弹窗)

### 步骤2：修复液态玻璃效果 ✅
- [x] GlassControlPanel 使用 GlassPanel 组件
- [x] APIKeyModal 使用 GlassPanel 组件

### 步骤3：修复点击空白关闭 ✅
- [x] GlassControlPanel 添加背景遮罩和点击关闭
- [x] APIKeyModal 已有点击关闭功能

### 步骤4：测试验证 ✅
- [x] TypeScript 类型检查通过
- [x] 单元测试通过 (37个测试)

## 涉及文件
- `src/components/glass/GlassControlPanel.tsx` - 修复
- `src/components/chat/APIKeyModal.tsx` - 修复
- `src/components/glass/GlassPanel.tsx` - 类型更新

## 状态
- ✅ 完成

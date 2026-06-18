# 弹窗修复架构设计

## 问题分析

### 已发现的问题弹窗
1. **GlassControlPanel.tsx** (玻璃调参面板)
   - 使用内联样式，不是液态玻璃效果
   - 没有背景遮罩
   - 点击空白不会关闭

2. **APIKeyModal.tsx** (API Key管理弹窗)
   - 使用内联样式，不是液态玻璃效果
   - 有背景遮罩点击关闭功能

### 解决方案
1. 使用 GlassPanel 组件替换内联样式
2. 添加背景遮罩层
3. 添加点击遮罩关闭功能

## 修复方案

### GlassControlPanel.tsx
- 添加全屏背景遮罩
- 使用 GlassPanel 组件
- 点击遮罩关闭

### APIKeyModal.tsx
- 使用 GlassPanel 组件替换内联样式
- 保留现有的点击遮罩关闭功能

## 依赖关系
- GlassPanel 组件 (已存在)
- 液态玻璃效果系统

---
name: apple-design
description: Apple 设计规范：摄影驱动、SF Pro 字体、Action Blue #0066cc 单色交互、极简白底。适用：展示型页面、产品页、极简 UI。
---

# Apple Design System

来源：`开源项目参考/设计/awesome-design-md/design-md/apple/DESIGN.md`

## 设计哲学
摄影驱动——产品图片是主角，UI chrome 退后。像博物馆画廊一样展示内容，不做装饰性渐变，没有 chrome 阴影。

## 色彩体系
| Token | Hex | 用途 |
|-------|-----|------|
| Primary / Action Blue | `#0066cc` | 链接、按钮、交互色（仅此一色） |
| Primary focus | `#0071e3` | hover 状态 |
| Primary on dark | `#2997ff` | 暗色背景上的交互色 |
| Ink / Body | `#1d1d1f` | 正文 |
| Body muted | `#cccccc` | 弱化文字 |
| Canvas | `#ffffff` | 白底 |
| Canvas parchment | `#f5f5f7` | 暖白背景 |
| Surface black | `#000000` | 暗色 tile 表面 |

## 字体
- **Hero display**: SF Pro Display, 600 weight, 56px, letter-spacing: -0.28px
- **Display lg**: SF Pro Display, 600 weight, 40px
- **Body**: system-ui, 17px, line-height 1.47

## 组件规范
- **按钮**：28px border-radius 胶囊形，纯 Action Blue 填充，无边框无阴影
- **Card/Tile**：12-18px border-radius，1px 极细描边，微妙 hover 抬起
- **输入框**：12px border-radius，1px solid 边框，#f5f5f7 背景

## 布局
- 间距体系：8px 基础网格（4/8/12/16/24/32/48/64/96px）
- 全幅摄影 hero，明暗 tile 交替排列
- 大段留白，信息密度极低

## 不该做的
- ❌ 不要用多个交互色（只用 Action Blue）
- ❌ 不要在 chrome 上加阴影
- ❌ 不要用装饰性渐变
- ❌ 不要把多张图片放进同一个 tile

完整规范：读取 `开源项目参考/设计/awesome-design-md/design-md/apple/DESIGN.md`

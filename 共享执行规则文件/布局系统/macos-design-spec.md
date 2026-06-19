# macOS 布局设计规范

> 来源：macos-design skill（布局/交互/动画）、apple-design skill（色彩/字体/组件）、healthy-architecture（架构原则）
> 目标：严格遵循 Apple 设计语言的全新页面骨架

---

## 1. 页面骨架结构

```
┌──────────────────────────────────────────────────┐
│ ●●●        TopBar (~50px, draggable)              │  ← Traffic lights + 全局操作
├─────────┬────────────────────────────────────────┤
│         │                                        │
│ Sidebar │         Main Content                   │
│ 240px   │         max-w-[1200px] mx-auto         │
│ vibrancy│         px-6 py-6                       │
│  blur   │         space-y-6 (24px 模块间距)       │
│         │                                        │
└─────────┴────────────────────────────────────────┘
```

**规则**：
- 侧边栏：固定 240px，vibrancy blur 半透明背景
- 顶栏：约 50px 高度，作为窗口拖拽区域，内容稀疏
- 内容区：最大宽度 1200px，水平居中，左右 padding 24px
- 模块间距：24px（Apple 标准 section gap）
- 页面无底部 padding，让内容自然终止

---

## 2. 间距体系（8px 基础网格）

遵循 apple-design skill 的 8px 基础网格：

| Token | 值 | 用途 |
|-------|-----|------|
| `--space-xs` | 4px (0.5×) | 图标与文字间隙 |
| `--space-sm` | 8px (1×) | 按钮内边距、小元素间距 |
| `--space-md` | 12px | 卡片内边距 |
| `--space-lg` | 16px (2×) | 内容区 padding、列表项间距 |
| `--space-xl` | 24px (3×) | 模块 section 间距 |
| `--space-2xl` | 32px (4×) | 大区块分隔 |
| `--space-3xl` | 48px (6×) | 页面级分隔 |
| `--space-4xl` | 64px (8×) | Hero 区留白 |

**Tailwind 映射**：
- `gap-1` = 4px, `gap-2` = 8px, `gap-3` = 12px, `gap-4` = 16px
- `p-3` = 12px, `p-4` = 16px, `p-6` = 24px
- `space-y-6` = 24px section gap
- `px-6` = 24px 内容区左右 padding

---

## 3. 字体层级

来源：macos-design skill 视觉设计参考（9 级 Apple 标准 type scale）

| 角色 | 大小 | 字重 | 行高 | Tailwind | 用途 |
|------|------|------|------|----------|------|
| Large Title | 26px | Bold 700 | 32px | `text-2xl font-bold` | 页面标题 |
| Title 1 | 22px | Regular 400 | 28px | `text-xl` | 模块标题 |
| Title 2 | 17px | Regular 400 | 22px | `text-base` | 二级标题 |
| Title 3 | 15px | Semibold 600 | 20px | `text-sm font-semibold` | 三级标题 |
| **Body** | **13px** | Regular 400 | 18px | `text-[13px]` | 正文（macOS 标准） |
| Callout | 12px | Regular 400 | 16px | `text-xs` | 辅助说明 |
| Footnote | 12px | Regular 400 | 16px | `text-xs` | 脚注 |
| Caption | 11px | Regular 400 | 14px | `text-[11px]` | 标签、时间 |
| Mini | 9px | Medium 500 | 12px | `text-[9px]` | 极小标注 |

**字体栈**（贯穿全局）：
```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
             "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

**规则**：
- Body 默认 13px（非 web 常见的 16px）
- 弱化文字用 `text-white/60` 或 `text-white/40`（透明度），不用 lighter 字重
- 标题不用过重（Bold 只在 Large Title 和 Title 3 使用）

---

## 4. 色彩 Token

来源：apple-design skill（Apple DESIGN.md）

### 交互色（唯一）

| Token | Light | Dark | 用途 |
|-------|-------|------|------|
| Primary / Action Blue | `#0066cc` | `#2997ff` | 链接、按钮、选中态、聚焦环 |
| Primary focus | `#0071e3` | — | hover 状态 |
| **规则**：只用这一个交互色，不做多彩色装饰 |

### 中性色

| Token | 值 | 用途 |
|-------|-----|------|
| Ink / Body | `#1d1d1f` | 正文（但在暗色主题中用白色） |
| Canvas | `#ffffff` | 白底 |
| Canvas parchment | `#f5f5f7` | 暖白背景（侧边栏） |
| Divider soft | `#f0f0f0` | 分隔线 |
| Hairline | `#e0e0e0` | 极细描边 |

### 暗色主题（本布局主要场景）

当前工作台是暗色玻璃风格，以下为暗色映射：

| Token | 值 | 用途 |
|-------|-----|------|
| 最深底 | `rgba(0,0,0,0.85)` | 内容区底色 |
| 侧边栏 | `rgba(0,0,0,0.4)` + blur | 半透明 vibrancy |
| 卡片 | `rgba(255,255,255,0.06)` | 玻璃面板 |
| 文字主 | `#ffffff` | 正文 |
| 文字次 | `rgba(255,255,255,0.6)` | 辅助文字 |
| 文字弱 | `rgba(255,255,255,0.4)` | 禁用/弱化 |
| 描边 | `rgba(255,255,255,0.08)` | 卡片边框 |
| Action Blue | `#2997ff` | 交互色（暗色专用） |

---

## 5. 组件规范

### 5.1 侧边栏

```
┌──────────────┐
│  [● ● ●]     │  ← Traffic light 装饰（纯视觉，不可交互）
│              │
│  W  工作台    │  ← Logo 区（40px 高）
│     v0.1     │
│              │
│  ● 首页      │  ← 导航项（32px 行高）
│  ○ 待办      │    选中态：subtle 高亮，非色块
│  ○ 日记      │    默认态：白色 0.7 透明度
│  ○ AI        │
│  ○ 壁纸      │
│              │
├──────────────┤
│  ⚙ 设置      │  ← 底部固定
└──────────────┘
```

**参数**：
- 宽度：240px（固定，不缩放）
- 背景：`rgba(0,0,0,0.4)` + `backdrop-filter: saturate(180%) blur(20px)`
- 导航项高度：32px
- 导航项内边距：`px-3 py-2`
- 选中态：`background: rgba(255,255,255,0.1)`（subtle）
- 默认态：`color: rgba(255,255,255,0.7)`，无背景
- hover：`background: rgba(255,255,255,0.05)`
- 图标：16px，SF Symbols 风格（使用 lucide-react 替代）
- 图标与文字间距：`gap-3`（12px）
- 描边：右侧 `1px solid rgba(255,255,255,0.06)` 分隔
- Traffic light 装饰：3 个 12px 圆点（红 #FF5F57、黄 #FEBC2E、绿 #28C840），不可交互

### 5.2 顶栏

```
┌──────────────────────────────────────────────────┐
│ [☰]  2026年7月18日 星期五     [🎛玻璃] [⬇导出] [⬆导入] │
└──────────────────────────────────────────────────┘
```

**参数**：
- 高度：~50px
- 左：折叠侧边栏按钮（☰）
- 中：日期显示（友好格式）
- 右：操作按钮组（玻璃调参、导出、导入）
- 背景：`rgba(0,0,0,0.3)`，半透明
- 下部描边：`1px solid rgba(255,255,255,0.06)`
- 内边距：`px-4`
- 此区域为窗口拖拽区（drag zone）

### 5.3 内容区

```html
<main className="flex-1 overflow-auto px-6 py-6">
  <div className="max-w-[1200px] mx-auto space-y-6">
    {children}
  </div>
</main>
```

**参数**：
- 最大宽度：1200px，`mx-auto` 居中
- 垂直间距：`space-y-6`（24px）
- 水平 padding：`px-6`（24px）
- 底部不留白
- 背景色：`rgba(0,0,0,0.85)`（最深底色）

### 5.4 圆角规范

| 元素 | 圆角 | Tailwind |
|------|------|----------|
| 页面窗口 | 10px | `rounded-[10px]`（外层） |
| 卡片/面板 | 8px | `rounded-xl`（已有 GlassPanel） |
| 按钮 | 6px | `rounded-lg` |
| 输入框 | 6px | `rounded-lg` |
| 标签/徽章 | 4px | `rounded` |
| 导航项 | 6px | `rounded` |

### 5.5 阴影规范

macOS 用分层阴影（layered shadows），关键是最外层的 `0 0 0 0.5px` 描边阴影：

```
卡片：0 0 0 0.5px rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.06)
面板：0 0 0 0.5px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.1)
弹窗：0 0 0 0.5px rgba(255,255,255,0.1), 0 8px 30px rgba(0,0,0,0.14)
```

---

## 6. 与初始布局的差异对比

| 维度 | 初始布局（default） | macOS 布局 |
|------|-------------------|-----------|
| 侧边栏宽度 | `collapsed` 切换 64/208px | 固定 240px |
| 侧边栏背景 | `rgba(0,0,0,0.4)` | 同上 + vibrancy blur |
| 内容区最大宽 | `max-w-6xl`（72rem=1152px） | `max-w-[1200px]` |
| 内容区 padding | `p-6`（24px 四周） | `px-6 py-6`（同） |
| 间距 | Tailwind 默认 | 对齐 8px 网格 |
| Traffic light | 无 | 纯装饰 3 个圆点 |
| 字体大小 | 未显式设置 body | body 13px |
| 顶栏高度 | 无固定高度 | ~50px |

---

## 7. 不做的事项（v1 范围）

- ❌ 不做键盘快捷键（后续）
- ❌ 不做拖拽排序 Sidebar（后续）
- ❌ 不做 Traffic light 交互（纯装饰）
- ❌ 不做 light mode（当前全是暗色玻璃）
- ❌ 不做侧边栏折叠动画（后续）
- ❌ 不做命令面板（后续）

## 8. 禁止行为

- ❌ 不要在 chrome 上加重阴影（Apple 规则）
- ❌ 不要用多个交互色（只用 Action Blue）
- ❌ 不要用装饰性渐变
- ❌ 不要改现有组件（只改壳，内容复用）
- ❌ 不要在顶栏放太多按钮（drag zone 需稀疏）

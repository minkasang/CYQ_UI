# Scroll Snap 与页面滚动方案速查

> 不用懂代码，也能知道什么时候该用什么滚动方案

---

## 一、Scroll Snap（滚动吸附）

### 白话解释
像翻书一样，每一"页"自动吸到屏幕顶部，不会卡在两页之间。

### 你什么时候需要它
- 每个模块（待办、日记、灵感）独立成"屏"，不想看到下面模块的内容
- Dock / 侧边栏点一个模块 → 滚过去 → 眼里只有这个模块

### 关键 CSS
```css
/* 容器 */
scroll-snap-type: y mandatory;  /* 垂直吸附，强制对齐 */

/* 每个 section */
scroll-snap-align: start;       /* 顶部对齐 */
min-height: 100dvh;             /* 至少一屏高 */
```

### 两个重要选择

| 属性 | 选择 | 原因 |
|------|------|------|
| `mandatory`（强制） | ❌ | 太暴力——滚轮动一下就跳到下一个 section，看不到衔接处 |
| `proximity`（就近） | ✅ | 自由滚动丝滑，松手时才就近吸附；Dock 点击仍然精准跳转 |

---

## 二、dvh vs vh（视口单位）

### 白话解释
手机浏览器地址栏会伸缩——`100vh` 是固定死的，地址栏缩进去后页面不跟着变，底部会被裁掉。`100dvh` 是动态的，浏览器怎么变它就怎么变。

### 什么时候用
- 全屏 section → `min-height: 100dvh`
- 移动端 H5 → 必用 `dvh`

---

## 三、scroll-behavior（平滑滚动）

### 白话解释
`scroll-behavior: smooth` 让滚动有"滑过去"的动画感，而不是瞬间跳过去。

### 陷阱
Safari 里 `scroll-behavior: smooth` 和 `scroll-snap` 一起用会有 bug。用 JS 的 `scrollIntoView({ behavior: 'smooth' })` 代替更稳。

---

## 四、Scroll Snap 的兄弟概念

| 术语 | 什么意思 | 你的项目用在哪 |
|------|----------|---------------|
| **Scroll Snap** | section 吸附对齐 | 首页模块滚动 |
| **IntersectionObserver** | 检测元素有没有进入屏幕 | 入场动画（现在就在用） |
| **Sticky** | 元素滚到某个位置就"粘住" | MacOSLayout 顶栏 |
| **Virtual Scroll** | 只渲染看得见的内容 | 待办列表如果几百条 |
| **Overscroll** | 滚到底还能再拖一下的弹性效果 | 系统自带 |
| **Scroll-driven Animation** | 滚到哪动画就播到哪 | 高级网页用 |

---

## 五、什么时候该用什么

| 你的需求 | 方案 |
|----------|------|
| 模块各占一屏，不串 | `scroll-snap` + `min-h-dvh` |
| 点导航跳到对应模块 | `scrollIntoView({ behavior: 'smooth' })` |
| 全屏必须占满 | `100dvh`（不是 `100vh`） |
| 移动端底部导航不挡内容 | `pb-[calc(64px+env(safe-area-inset-bottom))]` |

---

## 六、你现在项目的滚动架构

```
Layout 壳（DefaultLayout / MacOSLayout / ...）
  └─ <main overflow-auto>        ← 滚动容器
       └─ HomePage
            ├─ section#welcome   ← scroll-snap-align: start
            ├─ section#todo      ← min-height: 100dvh
            ├─ section#diary
            ├─ section#ai
            ├─ section#chat
            ├─ section#wallpaper
            └─ section#inspiration
```

Dock 点待办 → `scrollIntoView({ behavior: 'smooth' })` → 吸到 `#todo` 顶部。

# 架构设计 - 每日灵感

> 设计参考：healthy-architecture（6大维度）+ Readwise/Obsidian UX 模式

---

## 1. 设计目标

个人数字 Commonplace Book。捕获触动自己的名言/哲理/好句子，支持随机回顾防止遗忘。

```
┌───────────── 捕获 ─────────────┐
│  输入一句话 + 来源 + 标签         │
│  回车 → 存好，立即出现在列表       │
└────────────────────────────────┘
              ↓
┌───────────── 回顾 ─────────────┐
│  ┌─────────────────────────┐   │
│  │  "一切都会过去"           │   │
│  │      — 刻在戒指上的话      │   │
│  │  ⭐⭐⭐  #生活 #韧性       │   │
│  │  [❤收藏] [换一条]         │   │
│  └─────────────────────────┘   │
└────────────────────────────────┘
              ↓
┌───────────── 浏览 ─────────────┐
│  全部记录，时间倒序，可点详情      │
└────────────────────────────────┘
```

---

## 2. 六大设计维度

### 2.1 设计原则

| 原则 | 应用 |
|------|------|
| **单一职责** | Store 只管数据 CRUD + 查询；页面组件只管渲染 |
| **开闭原则** | 新增字段（如"回顾次数"）只需扩展类型 + Store，不改页面逻辑 |
| **接口隔离** | 组件不依赖完整 Store，只取需要的 selector |
| **组合优于继承** | 灵感模块不继承任何现有模块，独立组件通过 props 组装 |
| **最少知识** | 灵感模块不知道布局壳存在；导航入口由各壳独立添加 |

### 2.2 项目结构

```
src/
├── types/inspiration.ts              # InspirationItem 接口
├── store/
│   ├── useInspirationStore.ts        # Zustand persist CRUD
│   └── __tests__/
│       └── useInspirationStore.test.ts  # 单元测试
├── modules/inspiration/
│   ├── index.ts                      # 模块注册（Module 对象）
│   └── pages/
│       └── InspirationPage.tsx       # 首页（随机卡片+捕获+列表）
├── hooks/
│   └── useModuleRoutes.tsx           # 修改：ALL_MODULE_IDS + initBuiltinModules
└── components/layout/                # 导航入口（修改）
    ├── Sidebar.tsx                   # + "灵感"入口
    ├── Dock.tsx                      # + "💡灵感"
    └── layouts/TopNavLayout.tsx      # + "灵感"链接
```

### 2.3 接口与契约

```typescript
// 数据模型
interface InspirationItem {
  id: string            // crypto.randomUUID()
  content: string       // 那句话本身（必填）
  source?: string       // 谁说的/哪看到的
  tags: string[]        // 多标签
  reflection?: string   // 我的感想
  impact: 1 | 2 | 3     // 触动程度（默认2）
  isFavorite: boolean   // 收藏标记
  createdAt: number     // 收集时间戳
  lastReviewedAt: number // 最近回顾时间戳
}

// Store 接口（小接口原则）
interface InspirationStore {
  items: InspirationItem[]
  add: (item: Omit<InspirationItem, 'id' | 'createdAt' | 'lastReviewedAt'>) => void
  toggleFavorite: (id: string) => void
  setImpact: (id: string, impact: 1 | 2 | 3) => void
  markReviewed: (id: string) => void
  getNextReview: () => InspirationItem | null  // "优先遗忘"算法
}
```

### 2.4 错误处理

| 场景 | 策略 |
|------|------|
| 没有任何记录 | 空状态：展示引导文字"记下第一句触动你的话" |
| 输入内容为空 | 不允许提交，按钮 disabled |
| persist 读取失败 | 容错降级，初始化为空数组，不阻塞渲染 |

### 2.5 数据流与状态管理

```
单向数据流：
  用户输入 → add() → items 更新 → 页面重渲染
  点击收藏 → toggleFavorite() → items 更新 → 卡片重渲染
  点击换一条 → markReviewed() + getNextReview() → 展示新卡片
```

**状态归属：** 灵感数据只属于这个模块，用独立 Store，不放全局。

**"优先遗忘"算法：**
```typescript
// Store 内方法
getNextReview: () => {
  const { items } = get()
  if (items.length === 0) return null
  if (items.length === 1) return items[0]

  // 加权评分：lastReviewedAt 越早 + impact 越高 → 分值越低（越优先）
  const scored = items.map(item => ({
    item,
    score: item.lastReviewedAt - item.impact * 86400000, // impact * 1天
  }))
  scored.sort((a, b) => a.score - b.score)

  // 前半段随机选（增加变化性）
  const pool = scored.slice(0, Math.ceil(scored.length / 2))
  return pool[Math.floor(Math.random() * pool.length)].item
}

### 2.6 可测试性设计

| 测试 | 方法 |
|------|------|
| Store CRUD | 纯逻辑，直接调函数验证 |
| getNextReview 算法 | 构造 items 数组，验证排序和选择逻辑 |
| 组件渲染 | 传入 mock store 验证 DOM |
| 空状态 | 空数组 → 显示引导文字 |

---

## 3. 质量属性检查

| 属性 | 保证 |
|------|------|
| ✅ 可扩展 | 新增字段只需扩展类型 + Store |
| ✅ 可维护 | 独立模块，不耦合现有代码 |
| ✅ 可测试 | Store 纯逻辑可单测，组件可集成测 |
| ✅ 可靠性 | persist 持久化，读取失败容错降级 |
| ✅ 安全 | 纯本地存储，无外部请求 |

## 4. 禁止行为检查

- ❌ 不继承任何现有模块
- ❌ 灵感模块不知道布局壳存在
- ❌ 不为尚未存在的需求（分享/导出）预留代码
- ❌ 标签不用文件夹——用字符串数组

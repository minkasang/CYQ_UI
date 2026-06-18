# 模块开发指南

## 模块是什么

模块是个人工作台的功能单元，支持独立开发、独立测试、热拔插。

```
src/modules/
├── todo/           # 待办模块
│   ├── index.ts    # 模块入口（Module 接口实现）
│   └── pages/      # 页面组件
├── diary/          # 日记模块
├── ai/             # AI模块
├── wallpaper/      # 壁纸模块
└── settings/       # 设置模块
```

## 创建新模块

### 1. 目录结构

```bash
mkdir -p src/modules/模块名/pages
touch src/modules/模块名/index.ts
touch src/modules/模块名/pages/模块名Page.tsx
```

### 2. 入口文件模板

```typescript
// src/modules/模块名/index.ts
import type { Module, ModuleContext } from '../../types/module'
import { 模块名Page } from './pages/模块名Page'

export const 模块名Module: Module = {
  metadata: {
    id: '模块id',          // 唯一标识
    name: '模块显示名',
    version: '1.0.0',
    dependencies: []        // 依赖的模块id列表
  },

  capabilities: {
    routes: true,           // 有路由
    stores: true,           // 有Store
    components: false,
    services: false,
    api: true               // 有公共API
  },

  routes: [
    { path: '模块id', element: 模块名Page }
  ],

  stores: [
    { name: '模块id', store: useStore, persist: true }
  ],

  api: {
    // 对外暴露的方法
  },

  async install(context: ModuleContext) {},
  async uninstall() {},
  async enable() {},
  async disable() {}
}
```

### 3. 页面模板

```typescript
// src/modules/模块名/pages/模块名Page.tsx
export function 模块名Page() {
  return (
    <div>
      <h1>模块名</h1>
    </div>
  )
}
```

### 4. 编译验证

```bash
npx tsc --noEmit
```

## 模块通信

### 读取其他模块数据

```typescript
const todoModule = moduleManager.getModule('todo')
const todos = todoModule.api.getTodos()
```

### 模块间事件

```typescript
// 发送事件
context.eventBus.emit('event:name', payload)

// 监听事件
context.eventBus.on('event:name', handler)
```

## 公共API设计原则

| 原则 | 说明 |
|------|------|
| 最小暴露 | 只暴露必需的方法，不暴露内部实现 |
| 稳定性 | API一旦发布不随意修改 |
| 清晰性 | 方法名见名知义 |

## 模块生命周期

```
注册 → 安装 → 启用 → 运行 → 禁用 → 卸载 → 注销
```

- `install`：首次加载，初始化资源
- `uninstall`：完全移除，释放资源
- `enable`：启用模块（不重新初始化）
- `disable`：禁用模块（不释放资源）

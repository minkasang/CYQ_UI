# 模块化架构设计文档

## 一、设计目标

### 1.1 质量目标（引用 rules）

| 质量属性 | 说明 | 实现手段 |
|----------|------|----------|
| **可靠性** | 系统稳定运行，错误可恢复 | 模块隔离，错误边界 |
| **可维护性** | 代码易于理解、修改、扩展 | 按功能分包，模块边界清晰 |
| **可扩展性** | 新增功能时修改最小化 | 模块热拔插，开闭原则 |
| **性能效率** | 响应快速，资源占用合理 | 模块懒加载，资源管理 |
| **可测试性** | 核心逻辑可独立测试 | 模块独立测试，接口清晰 |
| **可观测性** | 系统状态可监控、可追踪 | 模块生命周期日志 |
| **安全性** | 数据安全，权限可控 | 模块权限控制 |
| **兼容性** | 向后兼容，版本平滑升级 | 模块版本管理 |
| **可移植性** | 跨平台、跨环境部署 | 模块独立部署 |

### 1.2 设计原则（引用 rules）

- **模块化与分层**：按功能模块组织代码，每层职责明确
- **明确边界与依赖方向**：外层可依赖内层，内层绝不依赖外层
- **稳定的公共API**：每个模块只暴露必要接口，内部实现细节对外不可见
- **开闭原则（OCP）**：扩展不加改，新增功能时添加新代码

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                     应用层（Application）                 │
│  - App.tsx                                              │
│  - ModuleProvider                                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   模块管理层（Module Manager）            │
│  - ModuleManager                                        │
│  - ModuleRegistry                                       │
│  - ModuleContext                                        │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   模块抽象层（Module Abstraction）        │
│  - Module Interface                                     │
│  - ModuleLifecycle                                      │
│  - ModuleAPI                                            │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   模块实现层（Module Implementations）    │
│  - TodoModule                                           │
│  - DiaryModule                                          │
│  - AIModule                                             │
│  - WallpaperModule                                      │
│  - SettingsModule                                       │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     数据层（Data Layer）                  │
│  - Store（Zustand）                                     │
│  - FileStorage                                          │
│  - API Client                                           │
└─────────────────────────────────────────────────────────┘
```

### 2.2 模块接口设计

#### 2.2.1 核心接口

```typescript
// src/types/module.ts

/**
 * 模块元数据
 */
export interface ModuleMetadata {
  id: string                    // 模块唯一标识
  name: string                  // 模块显示名称
  version: string               // 模块版本
  description?: string          // 模块描述
  author?: string               // 作者
  dependencies?: string[]       // 依赖的其他模块ID
  tags?: string[]               // 标签
  icon?: string                 // 图标
  preview?: string              // 预览图
}

/**
 * 模块能力
 */
export interface ModuleCapabilities {
  routes: boolean               // 是否提供路由
  stores: boolean               // 是否提供状态管理
  components: boolean           // 是否提供组件
  services: boolean             // 是否提供服务
  api: boolean                  // 是否提供API
}

/**
 * 路由配置
 */
export interface RouteConfig {
  path: string                  // 路由路径
  element: React.ComponentType  // 路由组件
  children?: RouteConfig[]      // 子路由
  meta?: {                      // 路由元数据
    title?: string
    icon?: string
    hidden?: boolean
  }
}

/**
 * Store配置
 */
export interface StoreConfig {
  name: string                  // Store名称
  store: any                    // Store实例
  persist?: boolean             // 是否持久化
}

/**
 * 组件配置
 */
export interface ComponentConfig {
  name: string                  // 组件名称
  component: React.ComponentType // 组件类型
  description?: string          // 组件描述
}

/**
 * 服务配置
 */
export interface ServiceConfig {
  name: string                  // 服务名称
  service: any                  // 服务实例
  description?: string          // 服务描述
}

/**
 * 模块上下文
 */
export interface ModuleContext {
  router: any                   // 路由管理器
  storeManager: any             // Store管理器
  eventBus: any                 // 事件总线
  logger: any                   // 日志工具
  config: any                   // 配置管理
}

/**
 * 模块生命周期
 */
export interface ModuleLifecycle {
  /**
   * 模块安装
   * @param context 模块上下文
   */
  install(context: ModuleContext): Promise<void>

  /**
   * 模块卸载
   */
  uninstall(): Promise<void>

  /**
   * 模块启用
   */
  enable?(): Promise<void>

  /**
   * 模块禁用
   */
  disable?(): Promise<void>

  /**
   * 模块更新
   * @param oldVersion 旧版本
   * @param newVersion 新版本
   */
  update?(oldVersion: string, newVersion: string): Promise<void>
}

/**
 * 模块接口
 */
export interface Module extends ModuleLifecycle {
  // ========== 元数据 ==========
  metadata: ModuleMetadata

  // ========== 能力 ==========
  capabilities: ModuleCapabilities

  // ========== 路由 ==========
  routes?: RouteConfig[]

  // ========== Store ==========
  stores?: StoreConfig[]

  // ========== 组件 ==========
  components?: ComponentConfig[]

  // ========== 服务 ==========
  services?: ServiceConfig[]

  // ========== 公共API ==========
  api?: Record<string, any>
}
```

#### 2.2.2 模块管理器接口

```typescript
// src/types/module.ts

/**
 * 模块管理器接口
 */
export interface ModuleManager {
  // ========== 模块注册 ==========
  /**
   * 注册模块
   * @param module 模块实例
   */
  registerModule(module: Module): void

  /**
   * 注销模块
   * @param moduleId 模块ID
   */
  unregisterModule(moduleId: string): void

  // ========== 模块安装 ==========
  /**
   * 安装模块
   * @param moduleId 模块ID
   */
  installModule(moduleId: string): Promise<void>

  /**
   * 卸载模块
   * @param moduleId 模块ID
   */
  uninstallModule(moduleId: string): Promise<void>

  // ========== 模块查询 ==========
  /**
   * 获取模块
   * @param moduleId 模块ID
   */
  getModule(moduleId: string): Module | null

  /**
   * 获取所有模块
   */
  getAllModules(): Module[]

  /**
   * 获取已安装的模块
   */
  getInstalledModules(): Module[]

  /**
   * 检查模块是否已安装
   * @param moduleId 模块ID
   */
  isModuleInstalled(moduleId: string): boolean

  // ========== 模块状态 ==========
  /**
   * 启用模块
   * @param moduleId 模块ID
   */
  enableModule(moduleId: string): Promise<void>

  /**
   * 禁用模块
   * @param moduleId 模块ID
   */
  disableModule(moduleId: string): Promise<void>

  /**
   * 检查模块是否已启用
   * @param moduleId 模块ID
   */
  isModuleEnabled(moduleId: string): boolean
}
```

### 2.3 模块依赖关系

```
TodoModule（待办模块）
├── 依赖：SettingsModule（设置模块）
└── 依赖：WallpaperModule（壁纸模块）

DiaryModule（日记模块）
├── 依赖：SettingsModule（设置模块）
└── 依赖：AIModule（AI模块）

AIModule（AI模块）
└── 依赖：SettingsModule（设置模块）

WallpaperModule（壁纸模块）
└── 依赖：SettingsModule（设置模块）

SettingsModule（设置模块）
└── 无依赖
```

### 2.4 模块生命周期

```
注册 → 安装 → 启用 → 运行 → 禁用 → 卸载 → 注销
```

#### 生命周期详解

1. **注册（Register）**
   - 模块被添加到模块注册表
   - 验证模块元数据和依赖
   - 不执行任何初始化代码

2. **安装（Install）**
   - 执行模块的 `install` 方法
   - 注册路由、Store、组件、服务
   - 初始化模块资源

3. **启用（Enable）**
   - 执行模块的 `enable` 方法
   - 模块开始工作
   - 可以响应用户操作

4. **运行（Running）**
   - 模块正常运行状态
   - 提供功能和服务

5. **禁用（Disable）**
   - 执行模块的 `disable` 方法
   - 模块停止工作
   - 保留资源和状态

6. **卸载（Uninstall）**
   - 执行模块的 `uninstall` 方法
   - 移除路由、Store、组件、服务
   - 释放模块资源

7. **注销（Unregister）**
   - 从模块注册表中移除
   - 清理所有引用

## 三、设计维度实现

### 3.1 设计原则

#### 单一职责原则（SRP）
- 每个模块只负责一个业务领域
- 模块内部按功能分包

#### 开闭原则（OCP）
- 新增功能通过添加新模块实现
- 不修改已有模块代码

#### 接口隔离原则（ISP）
- 模块接口小而精
- 模块只暴露必要的API

#### 依赖反转原则（DIP）
- 高层模块依赖抽象接口
- 不依赖具体实现

### 3.2 项目结构

#### 按功能分包
```
src/
  core/                   # 核心层
    ModuleManager.ts      # 模块管理器
    ModuleContext.ts      # 模块上下文
    ModuleRegistry.ts     # 模块注册表

  types/                  # 类型定义
    module.ts             # 模块类型

  modules/                # 模块层
    todo/                 # 待办模块
      index.ts            # 模块入口
      components/         # 组件
      pages/              # 页面
      store/              # 状态管理
      hooks/              # Hooks
      types/              # 类型
      utils/              # 工具

    diary/                # 日记模块
      index.ts
      components/
      pages/
      store/
      hooks/
      types/
      utils/

    ai/                   # AI模块
      index.ts
      components/
      pages/
      store/
      hooks/
      types/
      utils/

    wallpaper/            # 壁纸模块
      index.ts
      components/
      pages/
      store/
      hooks/
      types/
      utils/

    settings/             # 设置模块
      index.ts
      components/
      pages/
      store/
      hooks/
      types/
      utils/
```

### 3.3 接口与契约

#### 稳定的公共API
```typescript
// 每个模块只暴露必要的API
export const TodoModule: Module = {
  metadata: { ... },
  capabilities: { ... },
  
  // 公共API
  api: {
    addTodo: (data) => useTodoStore.getState().addTodo(data),
    getTodos: () => useTodoStore.getState().todos,
    // ... 其他API
  }
}
```

#### 向后兼容策略
- 模块版本管理
- API版本控制
- 数据迁移工具

### 3.4 错误处理

#### 模块错误隔离
```typescript
// 每个模块有独立的错误边界
class ModuleErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    console.error(`[Module Error] ${this.props.moduleId}:`, error)
    // 通知模块管理器
  }
}
```

#### 错误传播链
- 模块错误 → 模块管理器 → 应用层
- 记录错误日志
- 提供降级处理

### 3.5 数据流与状态管理

#### 单向数据流
```
用户操作 → 模块API → Store → UI更新
```

#### 状态归属原则
- 模块状态由模块自己管理
- 跨模块状态通过事件总线通信

### 3.6 可测试性设计

#### 依赖注入
```typescript
// 模块通过上下文获取依赖
async install(context: ModuleContext) {
  this.router = context.router
  this.storeManager = context.storeManager
  this.eventBus = context.eventBus
}
```

#### 副作用隔离
- 模块初始化代码在 `install` 方法中
- 模块清理代码在 `uninstall` 方法中

## 四、质量目标实现

### 4.1 可靠性
- ✅ 模块隔离，错误边界
- ✅ 模块依赖检查
- ✅ 模块版本兼容性检查

### 4.2 可维护性
- ✅ 按功能分包，模块边界清晰
- ✅ 模块独立开发、测试、部署
- ✅ 模块文档完善

### 4.3 可扩展性
- ✅ 模块热拔插
- ✅ 新增功能添加新模块
- ✅ 模块市场支持

### 4.4 性能效率
- ✅ 模块懒加载
- ✅ 模块按需加载
- ✅ 资源管理优化

### 4.5 可测试性
- ✅ 模块独立测试
- ✅ 接口清晰，易于Mock
- ✅ 测试边界清晰

### 4.6 可观测性
- ✅ 模块生命周期日志
- ✅ 模块状态监控
- ✅ 模块性能追踪

### 4.7 安全性
- ✅ 模块权限控制
- ✅ 模块沙箱隔离
- ✅ 模块数据加密

### 4.8 兼容性
- ✅ 模块版本管理
- ✅ API版本控制
- ✅ 数据迁移工具

### 4.9 可移植性
- ✅ 模块独立部署
- ✅ 模块跨平台支持
- ✅ 模块配置化

## 五、实施结果（已完成）

### 5.1 阶段一：架构设计 ✅
- 输出：[tasks.md](./tasks.md)、[architecture.md](./architecture.md)

### 5.2 阶段二：核心实现 ✅
- `src/types/module.ts` — 模块接口定义
- `src/core/ModuleManager.ts` — 模块管理器
- `src/core/ModuleContext.ts` — 模块上下文

### 5.3 阶段三：模块迁移 ✅
- `src/modules/todo/` — 待办模块
- `src/modules/diary/` — 日记模块
- `src/modules/ai/` — AI模块
- `src/modules/wallpaper/` — 壁纸模块
- `src/modules/settings/` — 设置模块

### 5.4 阶段四：集成测试 ✅
- 37个测试全部通过（100%）
- 测试报告：[test.md](./test.md)

### 5.5 阶段五：文档与优化 ✅
- 模块开发指南：[module_guide.md](./module_guide.md)
- 模块市场设计：[marketplace_design.md](./marketplace_design.md)

## 六、产出文件清单

| 类型 | 文件 | 位置 |
|------|------|------|
| 核心 | 模块接口定义 | `src/types/module.ts` |
| 核心 | 模块管理器 | `src/core/ModuleManager.ts` |
| 核心 | 模块上下文 | `src/core/ModuleContext.ts` |
| 模块 | 待办模块 | `src/modules/todo/` |
| 模块 | 日记模块 | `src/modules/diary/` |
| 模块 | AI模块 | `src/modules/ai/` |
| 模块 | 壁纸模块 | `src/modules/wallpaper/` |
| 模块 | 设置模块 | `src/modules/settings/` |
| 测试 | 模块系统测试 | `src/core/__tests__/moduleSystem.test.ts` |
| 测试 | 回归测试 | `src/core/__tests__/regression.test.ts` |
| 文档 | 任务拆解 | `tasks.md` |
| 文档 | 架构设计 | `architecture.md` |
| 文档 | 测试报告 | `test.md` |
| 文档 | 模块开发指南 | `module_guide.md` |
| 文档 | 模块市场设计 | `marketplace_design.md` |

## 七、总结

1. ✅ 5个模块全部实现，支持热拔插
2. ✅ 按功能分包，模块边界清晰
3. ✅ 现有功能完全正常，无破坏
4. ✅ 37个测试全部通过
5. ✅ 符合 rules 所有质量目标

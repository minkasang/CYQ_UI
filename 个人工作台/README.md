# 个人工作台 (Personal Workbench)

> 督促个人习惯 · 安排工作与生活 · 记录思考与感悟

基于 **React 18 + Vite + 流体玻璃效果** 的个人工作台 Web 应用。

## ✨ 功能特性

- 📋 **每日待办** - 增删改查、分类、优先级、日期
- 📔 **日记** - Markdown 编辑器，实时预览，自动保存
- 🤖 **AI 总结** - 一键总结日记或长文本（DeepSeek/OpenAI/Claude/Kimi/智谱）
- 🖼 **壁纸管理** - 网络图片、本地上传、纯色渐变
- 🪟 **流体玻璃** - 6 个可调参数，4 种变形模式
- 💾 **本地优先** - 数据存浏览器，支持导出/导入 JSON
- 📦 **零后端** - 纯前端，AI 调用直连官方 API

## 🚀 快速开始

### 安装依赖

```bash
cd 个人工作台
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开 http://localhost:5174

### 构建生产版本

```bash
npm run build
```

产物在 `dist/` 目录。

## 📁 项目结构

```
个人工作台/
├── src/
│   ├── main.tsx              # React 入口
│   ├── App.tsx               # 路由配置
│   ├── index.css             # 全局样式
│   ├── types/                # TypeScript 类型
│   ├── store/                # Zustand 状态管理
│   ├── utils/                # 工具函数（存储、日期、导出）
│   ├── components/
│   │   ├── layout/           # 布局（Sidebar/TopBar/Layout）
│   │   ├── glass/            # 玻璃效果（FluidGlass/GlassPanel/调参）
│   │   ├── todo/             # 待办组件
│   │   ├── diary/            # 日记组件
│   │   ├── ai/               # AI 组件（APIConfig/AISummary）
│   │   └── wallpaper/        # 壁纸组件
│   └── pages/                # 页面（Home/Todo/Diary/AI/Wallpaper/Settings）
├── docs/                     # 文档
└── public/                   # 静态资源
```

## 🔧 技术栈

| 类别 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| 样式方案 | Tailwind CSS 3 |
| 状态管理 | Zustand |
| 路由 | React Router v6 |
| 玻璃效果 | liquid-glass-react (MIT) |
| Markdown | react-markdown + remark-gfm |
| 图标 | lucide-react |
| 日期处理 | date-fns |

## ⚙️ 配置 AI

1. 打开「设置」页面
2. 选择 AI 服务商（推荐 DeepSeek，免费且中文支持好）
3. 输入 API Key
4. 点击「测试连接」验证

支持的 AI 服务：
- **DeepSeek** - 国产，便宜（注册送额度）
- **OpenAI** - 需科学上网
- **Claude** - Anthropic
- **Kimi** - 月之暗面，长文本
- **智谱 GLM** - 国产，GLM-4
- **自定义** - 兼容 OpenAI 协议的任意服务

## 📝 数据存储

- **位置**：浏览器 localStorage
- **隐私**：API Key 等敏感信息仅存本地
- **备份**：顶部「导出」按钮生成 JSON 文件
- **恢复**：顶部「导入」按钮恢复 JSON

## 🎨 玻璃效果调参

点击顶部「🎛 玻璃调参」按钮，可实时调整：
- **变形模式**：standard / polar / prominent / shader
- **变形强度**：0-200
- **模糊程度**：0-2
- **饱和度**：0-300
- **色差强度**：0-10
- **弹性系数**：0-1
- **圆角半径**：0-50

参数自动保存到本地。

## 📅 路线图

- **v0.1**（当前）: 基础布局、玻璃、待办、日记、AI、壁纸
- **v0.2**: 警醒墙（弹窗+列表+定时）、灵感记录、文件连接
- **v0.3**: 多模型支持、云同步、数据加密、移动端
- **v1.0**: 双玻璃风格切换（流体/光学）、PWA、番茄钟

## 📄 文档

- [架构说明 (AI 专用)](./docs/ARCHITECTURE.md)
- [使用指南](./docs/USER_GUIDE.md)
- [更新日志](./docs/CHANGELOG.md)

## 📜 开源协议

MIT

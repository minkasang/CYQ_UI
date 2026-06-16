# Git 版本管理策略

> 本文档定义项目的Git使用规范。跨设备协作、版本回溯、代码安全全靠它。

---

## 一、仓库初始化

项目根目录：`/media/cyq/455E28568C7503F7/project/cyq_UI`

```bash
cd /media/cyq/455E28568C7503F7/project/cyq_UI
git init
```

---

## 二、.gitignore 配置（必须）

以下内容**绝对不能**提交到Git：

```
# Node / Vite 生成目录
node_modules/
dist/
.vite/

# IDE 配置
.vs/
.idea/
.vscode/

# 系统文件
Thumbs.db
.DS_Store
Desktop.ini

# 用户临时文件
用户回复草稿缓存文件.md
1.md

# 压缩包
*.zip
*.rar
*.7z
```

---

## 三、分支策略

```
main (主分支)
  ├── design/   (设计文档修改)
  ├── feat/     (功能开发)
  └── fix/      (Bug修复)
```

| 分支 | 用途 | 示例 |
|------|------|------|
| `main` | 始终可运行的稳定版本 | — |
| `design/xxx` | 规范文档、设计文档修改 | `design/npc-params` |
| `feat/xxx` | 新功能开发 | `feat/social-network` |
| `fix/xxx` | Bug修复 | `fix/memory-leak` |

**工作流程：**
```
1. 从 main 切出新分支
2. 在新分支上工作
3. 完成后合并回 main
4. 打 tag
```

---

## 四、Commit 规范

### 4.1 格式

```
<类型>: <简短描述>

<详细说明（可选）>
```

### 4.2 类型

| 类型 | 含义 |
|------|------|
| `docs` | 文档/规范修改 |
| `feat` | 新功能 |
| `fix` | Bug修复 |
| `refactor` | 代码重构（不改功能） |
| `chore` | 项目维护（目录整理、配置修改） |

### 4.3 示例

```
docs: 新增Git管理策略

- 定义分支策略
- 配置.gitignore
- 规范commit格式
```

```
feat: 添加数据提醒组件

实现提醒规则配置面板，支持到期/提前/周期性三种提醒模式。
```

---

## 五、Tag 策略（里程碑标记）

在以下时机打Tag：

| Tag 类型 | 格式 | 时机 |
|----------|------|------|
| 框架里程碑 | `framework-v1.0` | 一套完整的规范体系建立后 |
| 功能里程碑 | `v0.1.0` | 一个完整功能可运行时 |
| 原型可跑 | `v0.1.0-alpha` | 最小可运行骨架搭好后 |

**每次Tag必须附带简要说明**（在GitHub/Git中写Release Notes）。

**版本号规则：**
```
v<主版本>.<次版本>.<修订版本>
   ↑        ↑        ↑
  大改版   新功能   Bug修复
```

---

## 六、跨设备协作

### 6.1 你的设备情况

你目前有三台设备（笔记本、台式机、工作站），每台设备的项目路径**可能不同**：

| 设备 | 可能的路径 | 
|------|-----------|
| 设备A | `/media/cyq/455E28568C7503F7/project/cyq_UI` |
| 设备B | `~/project/cyq_UI` |
| 设备C | `/home/user/workspace/cyq_UI` |

**Git 不受路径变化影响**——只要仓库根目录结构一致，相对路径永远有效。

### 6.2 首次设置（每台设备）

```bash
# 每台设备上
git clone <远程仓库地址>
```

### 6.3 日常使用

```bash
# 开始工作前
git pull

# 工作完成后
git add <具体文件名>
git commit -m "feat: xxx"
git push
```

### 6.4 换设备注意事项

| 问题 | 说明 | 对策 |
|------|------|------|
| **仓库路径变了** | `/media/cyq/...` → `~/project/...` | 不影响。框架内部只使用相对路径，不硬编码绝对路径 |
| **node_modules 未生成** | `node_modules/` 在 `.gitignore` 中，clone 后没有 | 运行 `npm install` 重新安装依赖 |
| **IDE 不同** | 设备A用 Trae，设备B可能用 VS Code | 不影响代码。`.vscode/` 等IDE配置已加入 `.gitignore` |
| **Node 版本不同** | 设备A是 Node 18，设备B是 Node 20 | 建议统一 Node 版本，或使用 nvm 管理 |
| **参考项目缺失** | `看板/` 和 `liquid-glass-react/` 是参考项目，如未传 Git | 确认是否在 Git 中；如不在，每台设备需单独 clone |
| **执行策略不同** | Windows / Linux / macOS 命令差异 | 本项目使用 npm scripts（跨平台），无平台差异 |

### 6.5 AI 在换设备后必须做的

如果 AI 发现自己在不同设备上运行（项目根路径变了），必须：

1. 用 `git pull` 同步最新代码
2. 确认 `AI开发规范/0-启动入口.md` 中列出的所有文件都存在
3. 如果 `个人工作台/node_modules/` 缺失 → 提醒用户运行 `npm install`
4. 检查 `AI开发规范/任务拆分/共享任务清单.json` 是否有新任务待执行

### 6.6 规则

- 每次开始工作前必须 `git pull`
- 不能在 `main` 上直接开发，必须用分支
- `push` 前确保代码能编译通过
- `.gitignore` 里列出的文件不手动 `git add`

---

## 七、AI操作Git的权限

| 操作 | AI可以做吗 |
|------|----------|
| `git status` | ✅ 查看状态 |
| `git diff` | ✅ 查看差异 |
| `git log` | ✅ 查看历史 |
| `git add <指定文件>` | ✅ 添加文件 |
| `git commit` | ⚠️ 需用户确认 |
| `git push` | ⚠️ 需用户明确要求 |
| `git push --force` | ❌ 绝对禁止 |
| `git reset --hard` | ❌ 绝对禁止 |
| `git branch -D` | ❌ 非用户明确要求禁止 |
| `git rebase` | ❌ 需要用户理解并授权 |

---

## 八、Git 远程仓库

你目前还没有配置远程仓库（GitHub/Gitee等）。建议：
- 使用 **GitHub**（免费、全球通用）或 **Gitee**（国内更快）
- 创建私有仓库（Private），不对外公开
- 把 `.gitignore` 里的内容排除干净后再首次push

**设置远程仓库：**
```bash
git remote add origin <你的仓库URL>
git push -u origin main
```

---

## 九、常见场景速查

| 场景 | 命令 |
|------|------|
| 看看改了什么 | `git status` |
| 看看具体改了什么 | `git diff` |
| 添加所有修改 | `git add -A`（慎用，推荐指定文件） |
| 提交 | `git commit -m "feat: xxx"` |
| 推送 | `git push` |
| 拉取最新 | `git pull` |
| 看最近提交 | `git log --oneline -10` |
| 新建分支 | `git checkout -b feat/xxx` |
| 切回main | `git checkout main` |
| 合并分支 | `git merge feat/xxx` |
| 撤销未提交的修改 | `git checkout -- <文件名>` |

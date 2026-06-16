# Git 代理配置指南（小白版）

## 一、为什么要配置 Git 代理？

### 问题背景
- GitHub 等国外代码托管平台在国内访问速度慢
- 即使浏览器能正常访问，Git 命令行也不会自动使用系统代理
- 导致 `git clone`、`git pull`、`git push` 等操作非常慢甚至超时

### 解决方案
给 Git 配置代理，让它通过代理服务器（如 Clash）连接外网。

---

## 二、核心概念解释

### 1. 什么是代理？
想象你要寄信给国外的朋友：
- **不配置代理**：你直接寄，路途遥远，可能寄不到
- **配置代理**：你把信交给"快递公司"（代理软件），它帮你快速送达

### 2. 代理端口是什么？
代理软件会在你的电脑上开一个"窗口"（端口），Git 通过这个窗口发送请求。

常见代理软件的默认端口：
| 软件 | HTTP 端口 | SOCKS5 端口 |
|------|-----------|-------------|
| Clash | 7890 | 7891 |
| Clash Verge | 7897 | - |
| Shadowsocks | - | 1080 |
| V2RayN | 10809 | 10808 |

---

## 三、配置步骤

### 步骤 1：找到你的代理端口

#### 方法 A：查看代理软件设置
打开你的代理软件（Clash/Clash Verge 等），在设置里找到 "Port" 或 "端口"。

#### 方法 B：用命令查找（推荐）
在 PowerShell 中运行：
```powershell
netstat -ano | Select-String -Pattern "LISTENING" | Select-String -Pattern ":789"
```

输出示例：
```
TCP    127.0.0.1:7897         0.0.0.0:0              LISTENING       1764
```
这里的 `7897` 就是你的代理端口。

---

### 步骤 2：配置 Git 代理

#### 方式一：HTTP 代理（推荐，兼容性好）

```bash
# 设置 HTTP 代理（把 7897 换成你的实际端口）
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
```

#### 方式二：SOCKS5 代理（如果 HTTP 不行）

```bash
# 设置 SOCKS5 代理
git config --global http.proxy socks5://127.0.0.1:7891
git config --global https.proxy socks5://127.0.0.1:7891
```

---

### 步骤 3：验证配置

```bash
# 查看当前代理配置
git config --global --get http.proxy
git config --global --get https.proxy

# 应该输出：
# http://127.0.0.1:7897
```

---

### 步骤 4：测试效果

```bash
# 克隆一个 GitHub 仓库测试速度
git clone --depth=1 https://github.com/rdev/liquid-glass-react.git
```

如果看到类似下面的输出，说明代理生效了：
```
Receiving objects: 100% (39/39), 96.51 MiB | 10.21 MiB/s, done.
```
速度从几百 KB/s 提升到几 MB/s 甚至更高。

---

## 四、常用命令速查表

| 操作 | 命令 |
|------|------|
| 设置 HTTP 代理 | `git config --global http.proxy http://127.0.0.1:7897` |
| 设置 HTTPS 代理 | `git config --global https.proxy http://127.0.0.1:7897` |
| 查看代理配置 | `git config --global --get http.proxy` |
| 取消代理 | `git config --global --unset http.proxy` |
| 取消 HTTPS 代理 | `git config --global --unset https.proxy` |
| 查看所有配置 | `git config --global --list` |

---

## 五、常见问题

### Q1：配置了代理还是慢？
**可能原因**：
- 代理软件没有启动
- 端口号填错了
- 代理节点速度慢

**解决方法**：
1. 检查代理软件是否正常运行
2. 重新查找正确的端口号
3. 尝试切换代理节点

### Q2：只对特定仓库使用代理？
去掉 `--global`，在仓库目录下执行：
```bash
git config http.proxy http://127.0.0.1:7897
```

### Q3：公司内网需要代理，外网不需要？
可以配置代理例外：
```bash
# 内网地址不走代理
git config --global http.proxy http://127.0.0.1:7897
git config --global http.https://company-git.com.proxy ""
```

### Q4：使用 SSH 协议怎么办？
SSH 不走 HTTP 代理，需要单独配置：

编辑 `~/.ssh/config` 文件：
```
Host github.com
    Hostname github.com
    User git
    ProxyCommand connect -S 127.0.0.1:7891 %h %p
```

---

## 六、加速技巧

### 1. 浅克隆（只下载最新版本）
```bash
git clone --depth=1 https://github.com/username/repo.git
```

### 2. 只克隆单个分支
```bash
git clone --single-branch --branch main https://github.com/username/repo.git
```

### 3. 增大传输缓冲区
```bash
git config --global http.postBuffer 524288000
```

### 4. 启用压缩
```bash
git config --global core.compression 9
```

---

## 七、总结

1. **Git 默认不走系统代理**，需要手动配置
2. **关键是找到正确的代理端口**（通常是 7890、7897 或 1080）
3. **使用 `git config --global http.proxy` 设置代理**
4. **用 `git clone` 测试速度是否提升**

配置一次，永久生效，以后所有的 Git 操作都会快很多！

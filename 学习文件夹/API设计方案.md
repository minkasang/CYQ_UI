# 看板 API 设计方案

> 给用户：这是看板后端的"菜单"，定义了什么可以请求、怎么请求、返回什么。

---

## 基础信息

- 服务器地址：`http://localhost:8090`
- 数据格式：JSON
- 文件编码：UTF-8

---

## API 列表

### 1. 读取文件

```
GET /api/read?path=技术规范/感知系统规范.md
```

**返回：**
```json
{
  "ok": true,
  "path": "技术规范/感知系统规范.md",
  "content": "# 感知系统规范\n\n## 1. 概述\n...",
  "size": 12345,
  "updated": "2026-06-07"
}
```

### 2. 写入文件

```
POST /api/write
Content-Type: application/json

{
  "path": "技术规范/感知系统规范.md",
  "content": "# 感知系统规范\n\n(新的内容)..."
}
```

**返回：**
```json
{"ok": true, "path": "技术规范/感知系统规范.md", "written": 5678}
```

### 3. 列出目录

```
GET /api/list?dir=技术规范
```

**返回：**
```json
{
  "ok": true,
  "dir": "技术规范",
  "files": [
    {"name": "感知系统规范.md", "type": "file", "size": 12345},
    {"name": "社会动力学规范.md", "type": "file", "size": 23456}
  ]
}
```

不带 `?dir=` 参数时列出项目根目录。

### 4. 批量读取（多个文件）

```
POST /api/read-batch
Content-Type: application/json

{"paths": ["数据.js", "任务数据.js"]}
```

**返回：**
```json
{
  "ok": true,
  "files": [
    {"path": "数据.js", "content": "...", "ok": true},
    {"path": "任务数据.js", "content": "...", "ok": true}
  ]
}
```

### 5. 搜索文件内容

```
GET /api/search?q=性格&dir=技术规范
```

**返回：**
```json
{
  "ok": true,
  "results": [
    {
      "file": "技术规范/性格系统规范.md",
      "line": 15,
      "content": "性格系统包含 34 个维度..."
    }
  ]
}
```

---

## 安全限制

- 只能读写项目目录内的文件（`/api/read?path=../../../Windows/secret` → 拒绝）
- 写入前自动备份（`.bak` 后缀）
- 操作日志记录到 `server.log`

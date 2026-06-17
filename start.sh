#!/bin/bash
# 一键启动脚本
# 无论在哪个目录都能执行
# Ctrl+C 可同时停止两个服务

PROJECT_ROOT="/media/cyq/455E28568C7503F7/project/cyq_UI"

echo "========================================"
echo "  个人工作台 - 一键启动"
echo "========================================"

# 清理旧进程
pkill -f "python.*server.py" 2>/dev/null
pkill -f "vite.*个人工作台" 2>/dev/null
sleep 1

# 启动后端（在项目根目录）
echo "[1] 启动后端 server.py (端口 8090)..."
cd "$PROJECT_ROOT" && python server.py &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 启动前端
echo "[2] 启动前端 vite (端口 5174)..."
cd "$PROJECT_ROOT/个人工作台" && npx vite &
VITE_PID=$!

# 等待前端启动
sleep 3

echo ""
echo "========================================"
echo "  服务已启动！"
echo "========================================"
echo "  后端 API: http://localhost:8090"
echo "  前端页面: http://localhost:5174"
echo ""
echo "  按 Ctrl+C 停止所有服务"
echo "========================================"

# 捕获 Ctrl+C，停止所有进程
trap "echo ''; echo '停止所有服务...'; kill $SERVER_PID $VITE_PID 2>/dev/null; pkill -f 'python.*server.py' 2>/dev/null; pkill -f 'vite.*个人工作台' 2>/dev/null; echo '已停止'; exit 0" SIGINT SIGTERM

# 等待子进程
wait
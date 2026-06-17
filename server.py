"""
公共 API 服务器
- 静态文件服务（看板项目）
- API 接口：读文件、写文件、列目录、搜索
- 启动：python server.py
- 默认端口：8090
"""

import http.server
import json
import os
import re
import time
import urllib.parse
import shutil
import urllib.request

# 项目根目录（本文件在项目根目录 cyq_UI/ 下）
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def safe_path(path):
    """安全检查：确保路径在项目目录内，防止越权访问"""
    full = os.path.normpath(os.path.join(BASE_DIR, path))
    if not full.startswith(BASE_DIR):
        return None
    return full

def log(msg):
    """写日志"""
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line)
    try:
        log_file = os.path.join(BASE_DIR, 'server.log')
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(line + '\n')
    except:
        pass

class APIHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP 请求处理器"""

    def __init__(self, *args, **kwargs):
        # 静态文件根目录 = 看板/
        self.directory = os.path.join(BASE_DIR, '看板')
        super().__init__(*args, **kwargs, directory=self.directory)

    def end_headers(self):
        """跨域允许"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        """预检请求"""
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        """处理 GET 请求"""
        parsed = urllib.parse.urlparse(self.path)

        # API 路由
        if parsed.path == '/api/read':
            return self.api_read(parsed)
        elif parsed.path == '/api/list':
            return self.api_list(parsed)
        elif parsed.path == '/api/search':
            return self.api_search(parsed)
        elif parsed.path == '/api/image':
            return self.api_image(parsed)

        # 静态文件服务：个人工作台/data/images/
        if parsed.path.startswith('/个人工作台/data/images/'):
            return self.serve_static_image(parsed.path)

        # 静态文件服务：个人工作台/data/videos/
        if parsed.path.startswith('/个人工作台/data/videos/'):
            return self.serve_static_video(parsed.path)

        # 不是 API → 静态文件服务（看板）
        super().do_GET()

    def do_POST(self):
        """处理 POST 请求"""
        parsed = urllib.parse.urlparse(self.path)

        if parsed.path == '/api/write':
            return self.api_write()
        elif parsed.path == '/api/read-batch':
            return self.api_read_batch()
        elif parsed.path == '/api/save-image':
            return self.api_save_image()

        self.send_error(404)

    # ── API 实现 ──

    def api_read(self, parsed):
        """GET /api/read?path=xxx — 读取文件内容"""
        qs = urllib.parse.parse_qs(parsed.query)
        path = qs.get('path', [None])[0]
        if not path:
            return self.json_resp(400, {'ok': False, 'error': '缺少 path 参数'})

        full = safe_path(path)
        if not full or not os.path.isfile(full):
            return self.json_resp(404, {'ok': False, 'error': f'文件不存在: {path}'})

        try:
            with open(full, 'r', encoding='utf-8') as f:
                content = f.read()
            stat = os.stat(full)
            log(f'READ  {path}')
            return self.json_resp(200, {
                'ok': True,
                'path': path,
                'content': content,
                'size': stat.st_size,
                'updated': time.strftime('%Y-%m-%d %H:%M', time.localtime(stat.st_mtime))
            })
        except UnicodeDecodeError:
            # 二进制文件 → 返回提示
            return self.json_resp(200, {
                'ok': True,
                'path': path,
                'binary': True,
                'content': '(二进制文件，无法在浏览器中显示)',
                'size': os.path.getsize(full)
            })
        except Exception as e:
            log(f'ERROR read {path}: {e}')
            return self.json_resp(500, {'ok': False, 'error': str(e)})

    def api_write(self):
        """POST /api/write — 写入文件"""
        try:
            body = self.read_body()
            data = json.loads(body)
            path = data.get('path')
            content = data.get('content', '')
        except:
            return self.json_resp(400, {'ok': False, 'error': 'JSON 格式错误'})

        if not path:
            return self.json_resp(400, {'ok': False, 'error': '缺少 path 参数'})

        full = safe_path(path)
        if not full:
            return self.json_resp(403, {'ok': False, 'error': '路径越权'})

        # 备份旧文件
        bak = full + '.bak'
        if os.path.isfile(full):
            try:
                shutil.copy2(full, bak)
            except:
                pass

        try:
            os.makedirs(os.path.dirname(full), exist_ok=True)
            with open(full, 'w', encoding='utf-8', newline='\n') as f:
                f.write(content)
            log(f'WRITE {path} ({len(content)} bytes)')
            return self.json_resp(200, {'ok': True, 'path': path, 'written': len(content)})
        except Exception as e:
            log(f'ERROR write {path}: {e}')
            return self.json_resp(500, {'ok': False, 'error': str(e)})

    def api_list(self, parsed):
        """GET /api/list?dir=xxx — 列出目录"""
        qs = urllib.parse.parse_qs(parsed.query)
        dir_path = qs.get('dir', [''])[0]

        full = safe_path(dir_path) if dir_path else BASE_DIR
        if not full or not os.path.isdir(full):
            return self.json_resp(404, {'ok': False, 'error': f'目录不存在: {dir_path}'})

        try:
            items = []
            for name in sorted(os.listdir(full)):
                if name.startswith('.') and name != '.gitignore':
                    continue
                item_path = os.path.join(full, name)
                rel = os.path.relpath(item_path, BASE_DIR).replace('\\', '/')
                items.append({
                    'name': name,
                    'path': rel,
                    'type': 'dir' if os.path.isdir(item_path) else 'file',
                    'size': os.path.getsize(item_path) if os.path.isfile(item_path) else 0
                })
            return self.json_resp(200, {'ok': True, 'dir': dir_path or '.', 'items': items})
        except Exception as e:
            return self.json_resp(500, {'ok': False, 'error': str(e)})

    def api_read_batch(self):
        """POST /api/read-batch — 批量读取"""
        try:
            body = self.read_body()
            data = json.loads(body)
            paths = data.get('paths', [])
        except:
            return self.json_resp(400, {'ok': False, 'error': 'JSON 格式错误'})

        results = []
        for path in paths:
            full = safe_path(path)
            if not full or not os.path.isfile(full):
                results.append({'path': path, 'ok': False, 'error': '文件不存在'})
            else:
                try:
                    with open(full, 'r', encoding='utf-8') as f:
                        content = f.read()
                    results.append({'path': path, 'ok': True, 'content': content})
                except Exception as e:
                    results.append({'path': path, 'ok': False, 'error': str(e)})

        return self.json_resp(200, {'ok': True, 'files': results})

    def api_save_image(self):
        """POST /api/save-image — 下载图片并保存到本地"""
        try:
            body = self.read_body()
            data = json.loads(body)
            url = data.get('url')
            save_path = data.get('path')
        except:
            return self.json_resp(400, {'ok': False, 'error': 'JSON 格式错误'})

        if not url:
            return self.json_resp(400, {'ok': False, 'error': '缺少 url 参数'})
        if not save_path:
            return self.json_resp(400, {'ok': False, 'error': '缺少 path 参数'})

        # 安全检查
        full = safe_path(save_path)
        if not full:
            return self.json_resp(403, {'ok': False, 'error': '非法路径'})

        try:
            # 确保目录存在
            os.makedirs(os.path.dirname(full), exist_ok=True)
            
            # 下载图片
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=30) as response:
                image_data = response.read()
            
            # 保存图片
            with open(full, 'wb') as f:
                f.write(image_data)
            
            log(f'SAVE_IMAGE  {save_path} ({len(image_data)} bytes)')
            return self.json_resp(200, {
                'ok': True,
                'path': save_path,
                'size': len(image_data)
            })
        except Exception as e:
            log(f'ERROR save_image {url}: {e}')
            return self.json_resp(500, {'ok': False, 'error': str(e)})

    def serve_static_image(self, path):
        """提供图片静态文件服务"""
        # URL 解码
        decoded_path = urllib.parse.unquote(path)
        # 去掉前导 /
        if decoded_path.startswith('/'):
            decoded_path = decoded_path[1:]
        
        full = safe_path(decoded_path)
        if not full or not os.path.isfile(full):
            self.send_error(404)
            return
        
        # 根据扩展名设置 Content-Type
        ext = os.path.splitext(full)[1].lower()
        content_type = 'image/png' if ext == '.png' else 'image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/gif' if ext == '.gif' else 'application/octet-stream'
        
        try:
            with open(full, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
            log(f'IMAGE  {decoded_path}')
        except Exception as e:
            log(f'ERROR image {decoded_path}: {e}')
            self.send_error(500)

    def serve_static_video(self, path):
        """提供视频静态文件服务"""
        # URL 解码
        decoded_path = urllib.parse.unquote(path)
        # 去掉前导 /
        if decoded_path.startswith('/'):
            decoded_path = decoded_path[1:]
        
        full = safe_path(decoded_path)
        if not full or not os.path.isfile(full):
            self.send_error(404)
            return
        
        # 根据扩展名设置 Content-Type
        ext = os.path.splitext(full)[1].lower()
        content_type = 'video/mp4' if ext == '.mp4' else 'video/webm' if ext == '.webm' else 'application/octet-stream'
        
        try:
            with open(full, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
            log(f'VIDEO  {decoded_path}')
        except Exception as e:
            log(f'ERROR video {decoded_path}: {e}')
            self.send_error(500)

    def api_image(self, parsed):
        """GET /api/image?path=xxx — 返回图片"""
        qs = urllib.parse.parse_qs(parsed.query)
        path = qs.get('path', [None])[0]
        if not path:
            return self.json_resp(400, {'ok': False, 'error': '缺少 path 参数'})

        full = safe_path(path)
        if not full or not os.path.isfile(full):
            return self.json_resp(404, {'ok': False, 'error': f'文件不存在: {path}'})

        # 根据扩展名设置 Content-Type
        ext = os.path.splitext(full)[1].lower()
        content_type = 'image/png' if ext == '.png' else 'image/jpeg' if ext in ['.jpg', '.jpeg'] else 'image/gif' if ext == '.gif' else 'application/octet-stream'

        try:
            with open(full, 'rb') as f:
                data = f.read()
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', len(data))
            self.end_headers()
            self.wfile.write(data)
            log(f'IMAGE_API  {path}')
        except Exception as e:
            log(f'ERROR image_api {path}: {e}')
            self.send_error(500)

    def api_search(self, parsed):
        """GET /api/search?q=xxx&dir=xxx — 搜索文件内容"""
        qs = urllib.parse.parse_qs(parsed.query)
        query = qs.get('q', [None])[0]
        dir_path = qs.get('dir', [''])[0]

        if not query:
            return self.json_resp(400, {'ok': False, 'error': '缺少 q 参数'})

        search_dir = safe_path(dir_path) if dir_path else BASE_DIR
        if not search_dir:
            return self.json_resp(404, {'ok': False, 'error': f'目录不存在: {dir_path}'})

        results = []
        for root, dirs, files in os.walk(search_dir):
            # 跳过隐藏目录
            dirs[:] = [d for d in dirs if not d.startswith('.') or d == '.git']
            for fname in files:
                if not (fname.endswith('.md') or fname.endswith('.json') or
                        fname.endswith('.js') or fname.endswith('.ts') or fname.endswith('.tsx')):
                    continue
                fpath = os.path.join(root, fname)
                try:
                    with open(fpath, 'r', encoding='utf-8') as f:
                        for i, line in enumerate(f, 1):
                            if query.lower() in line.lower():
                                rel = os.path.relpath(fpath, BASE_DIR).replace('\\', '/')
                                results.append({
                                    'file': rel,
                                    'line': i,
                                    'content': line.strip()[:200]
                                })
                                if len(results) >= 50:
                                    break
                except:
                    pass
                if len(results) >= 50:
                    break
            if len(results) >= 50:
                break

        return self.json_resp(200, {'ok': True, 'query': query, 'count': len(results), 'results': results})

    # ── 工具方法 ──

    def json_resp(self, code, data):
        """返回 JSON 响应"""
        body = json.dumps(data, ensure_ascii=False, indent=2).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.end_headers()
        self.wfile.write(body)

    def read_body(self):
        """读取 POST 请求体"""
        length = int(self.headers.get('Content-Length', 0))
        if length > 10 * 1024 * 1024:  # 限制 10MB
            raise ValueError('请求体过大')
        return self.rfile.read(length).decode('utf-8')

    def log_message(self, format, *args):
        """重写日志格式"""
        log(f'{self.address_string()} {format % args}')


if __name__ == '__main__':
    PORT = 8090
    # 切换到 BASE_DIR，确保静态文件服务从正确的目录查找
    os.chdir(BASE_DIR)
    print(f'\n  [OK] API 服务器已启动')
    print(f'  [DIR] 项目根目录: {BASE_DIR}')
    print(f'  [URL] http://localhost:{PORT}')
    print(f'  [API] http://localhost:{PORT}/api/read?path=xxx')
    print(f'       http://localhost:{PORT}/api/list?dir=xxx')
    print(f'  [STOP] 按 Ctrl+C 停止\n')

    httpd = http.server.HTTPServer(('', PORT), APIHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n  服务器已停止')
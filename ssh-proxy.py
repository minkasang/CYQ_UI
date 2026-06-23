#!/usr/bin/env python3
import socket, sys, os, select
sock = socket.socket()
sock.connect(('127.0.0.1', 7897))
sock.sendall(f'CONNECT {sys.argv[1]}:{sys.argv[2]} HTTP/1.0\r\n\r\n'.encode())
resp = b''
while b'\r\n\r\n' not in resp:
    chunk = sock.recv(4096)
    if not chunk: sys.exit(1)
    resp += chunk
if b'200' not in resp: sys.exit(1)
fds = [sys.stdin.fileno(), sock.fileno()]
while True:
    r, _, _ = select.select(fds, [], [])
    if sys.stdin.fileno() in r:
        d = os.read(sys.stdin.fileno(), 4096)
        if not d: break
        sock.sendall(d)
    if sock.fileno() in r:
        d = sock.recv(4096)
        if not d: break
        os.write(sys.stdout.fileno(), d)

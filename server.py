#!/usr/bin/env python3
import http.server
import socketserver
import os
from pathlib import Path

PORT = 8081
DIRECTORY = str(Path(__file__).parent)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, must-revalidate')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

os.chdir(DIRECTORY)
with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"[OK] Servidor Villa Lissana activo en http://localhost:{PORT}")
    print(f"[DIR] Sirviendo desde: {DIRECTORY}")
    print("Presiona Ctrl+C para detener...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ Servidor detenido.")

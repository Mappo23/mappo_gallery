#!/usr/bin/env python3
"""Tiny static file server that binds to the PORT env var (preview-friendly).

Sends no-cache headers so edits to CSS/JS always show on reload during dev —
no more stale stylesheets cached by the browser.
"""
import os
import http.server
import socketserver

PORT = int(os.environ.get("PORT", "8000"))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"FILM OS serving on port {PORT}")
    httpd.serve_forever()

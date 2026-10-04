#!/usr/bin/env python3
"""Static dev server for omokage that disables caching, so edited ES modules always reload."""
import http.server, os, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8480
class Server(http.server.ThreadingHTTPServer):
    request_queue_size = 128   # ES modules arrive in bursts; the default backlog of 5 drops some

Server(("", port), NoCache).serve_forever()

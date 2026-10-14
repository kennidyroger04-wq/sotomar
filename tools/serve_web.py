#!/usr/bin/env python3
"""Serve a Godot Web export for local desktop or same-network device testing."""

from __future__ import annotations

import argparse
import mimetypes
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class GodotWebHandler(SimpleHTTPRequestHandler):
    extensions_map = {
        **mimetypes.types_map,
        ".wasm": "application/wasm",
        ".pck": "application/octet-stream",
        ".worklet.js": "text/javascript",
    }

    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", default="127.0.0.1", help="Bind address (use 0.0.0.0 for same-LAN testing).")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--directory", type=Path, default=Path("build/web"))
    args = parser.parse_args()
    directory = args.directory.resolve()
    if not (directory / "index.html").is_file():
        parser.error(f"{directory} does not contain index.html; run the Godot Web export first")

    handler = lambda *handler_args, **handler_kwargs: GodotWebHandler(
        *handler_args, directory=str(directory), **handler_kwargs
    )
    server = ThreadingHTTPServer((args.host, args.port), handler)
    print(f"Serving {directory} at http://{args.host}:{args.port}/")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

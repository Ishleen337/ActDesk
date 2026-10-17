#!/usr/bin/env python3
"""
ActDesk — Turnkey Server Launcher
Runs the complete fullstack application (FastAPI Backend + React Frontend SPA) on port 8000.
"""

import os
import sys
import subprocess

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")

    # Detect python executable
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = os.path.join(backend_dir, "venv", "bin", "python")
    if not os.path.exists(venv_python):
        venv_python = sys.executable

    print("=" * 70)
    print("  🚀 Starting ActDesk — Autonomous Support Agent & Operations Dial")
    print("=" * 70)
    print(f"• Working Directory: {backend_dir}")
    print(f"• Python Interpreter: {venv_python}")
    print("• Serving API & UI at: http://localhost:8000")
    print("• Interactive Swagger API Docs at: http://localhost:8000/docs")
    print("• Prometheus Metrics at: http://localhost:8000/metrics")
    print("• Staff Logins:")
    print("    - Store Admin:   admin / admin123")
    print("    - Support Agent: agent / agent123")
    print("=" * 70)
    print("\nPress Ctrl+C to terminate the server.\n")

    cmd = [
        venv_python,
        "-m",
        "uvicorn",
        "app.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--reload"
    ]

    try:
        subprocess.run(cmd, cwd=backend_dir)
    except KeyboardInterrupt:
        print("\n[ActDesk] Server shut down gracefully.")

if __name__ == "__main__":
    main()

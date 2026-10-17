#!/usr/bin/env bash
# ActDesk Linux / macOS Startup Script
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

if [ -f "backend/venv/bin/python" ]; then
    backend/venv/bin/python run_server.py
else
    python3 run_server.py
fi

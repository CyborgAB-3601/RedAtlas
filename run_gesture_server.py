#!/usr/bin/env python3
"""
Python runner script for RedAtlas HUD Gesture Server.
Ensures execution under .venv\Scripts\python.exe with proper arguments.
"""

import sys
import subprocess
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parent
    venv_python = root_dir / ".venv" / "Scripts" / "python.exe"
    gesture_server = root_dir / "gesture_server.py"

    # If running directly inside the desired venv, invoke gesture_server.py directly
    if Path(sys.executable).resolve() == venv_python.resolve():
        import gesture_server
        gesture_server.main()
        return

    if not venv_python.exists():
        print(f"[ERROR] Could not find virtual environment Python at {venv_python}")
        print("Falling back to current sys.executable...")
        python_to_run = sys.executable
    else:
        python_to_run = str(venv_python)

    cmd = [python_to_run, str(gesture_server)] + sys.argv[1:]
    print(f"[RedAtlas Launcher] Executing: {' '.join(cmd)}")
    try:
        proc = subprocess.run(cmd)
        sys.exit(proc.returncode)
    except KeyboardInterrupt:
        print("\n[RedAtlas Launcher] Server stopped by user.")
        sys.exit(0)

if __name__ == "__main__":
    main()

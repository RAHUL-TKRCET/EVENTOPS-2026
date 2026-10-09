"""EVENTOPS-2026 — Root Application Entry Point for FastAPI Cloud & Production ASGI Servers.

Exposes the canonical FastAPI `app` instance.
"""
import sys
import os

# Ensure backend directory is in the Python search path for module resolution
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import canonical FastAPI instance from backend/app/main.py
from app.main import app  # noqa: E402

if __name__ == "__main__":
    import uvicorn
    from app.core.config import settings

    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)

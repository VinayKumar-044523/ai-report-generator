"""
run.py — root-level entry point for the AI Report Generator.
Run with:  python run.py
"""
import sys
import os

# Add the backend directory to sys.path so Flask can resolve its imports
# (backend uses flat imports: `from routes import ...`, `from utils import ...`)
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.insert(0, backend_dir)

from app import app  # noqa: E402 — intentional path-first import

if __name__ == "__main__":
    print("Starting AI Report Generator on http://localhost:5000")
    print("Open http://localhost:5000 in your browser to use the app.")
    app.run(debug=True, port=5000)

"""
diagnose.py - Run this to identify exactly what's wrong with the API setup.
Usage: python diagnose.py
"""
import sys
import os
from pathlib import Path

sys.path.insert(0, "backend")
from dotenv import load_dotenv

env_path = Path(".env")
loaded = load_dotenv(dotenv_path=env_path, override=True)

key = os.getenv("GEMINI_API_KEY", "")

print("=" * 55)
print("  AI Report Generator — Setup Diagnostic")
print("=" * 55)
print()

print("[1] .env file check")
print(f"    Path     : {env_path.resolve()}")
print(f"    Exists   : {env_path.exists()}")
print(f"    Loaded   : {loaded}")
print()

print("[2] API Key check")
if not key:
    print("    STATUS   : MISSING — GEMINI_API_KEY is not set in .env")
else:
    print(f"    Length   : {len(key)} chars")
    print(f"    Prefix   : {key[:12]}...")
    if key.startswith("AIza"):
        print("    FORMAT   : OK — Standard Gemini API key")
    elif key.startswith("AQ."):
        print("    FORMAT   : WRONG TYPE — This is an OAuth2 Access Token")
        print()
        print("    The key starting with 'AQ.' is a temporary OAuth bearer")
        print("    token copied from AI Studio's 'Get API key' token page.")
        print("    It expires quickly and cannot be used as an API key.")
        print()
        print("    HOW TO GET THE CORRECT KEY:")
        print("    1. Go to: https://aistudio.google.com/apikey")
        print("    2. Click the blue 'Create API key' button")
        print("    3. Select or create a Google Cloud project")
        print("    4. Copy the key — it MUST start with 'AIza'")
        print("    5. Paste it in your .env file:")
        print("       GEMINI_API_KEY=AIza<rest-of-your-key>")
    else:
        print(f"    FORMAT   : UNKNOWN — key starts with '{key[:6]}'")
print()

print("[3] Package versions")
try:
    import google.genai as genai
    import flask
    import flask_cors
    import dotenv
    print(f"    google-genai : {genai.__version__}")
    print(f"    flask        : {flask.__version__}")
    print(f"    flask-cors   : {flask_cors.__version__}")
    import importlib.metadata
    print(f"    python-dotenv: {importlib.metadata.version('python-dotenv')}")
    print("    All packages OK")
except ImportError as e:
    print(f"    MISSING PACKAGE: {e}")
    print("    Run: pip install -r requirements.txt")
print()

if key.startswith("AIza"):
    print("[4] Live API test...")
    try:
        from google import genai as g
        client = g.Client(api_key=key)
        resp = client.models.generate_content(
            model="gemini-2.0-flash",
            contents="Reply with exactly: OK"
        )
        print(f"    STATUS   : SUCCESS")
        print(f"    Response : {resp.text.strip()}")
    except Exception as e:
        err = str(e)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            print("    STATUS   : QUOTA EXHAUSTED (429)")
            print("    The key is valid but the free-tier daily limit is reached.")
            print("    Wait 24 hours, or enable billing on your Google Cloud project.")
        elif "401" in err or "API_KEY_INVALID" in err or "UNAUTHENTICATED" in err:
            print("    STATUS   : INVALID KEY (401)")
            print("    The key exists but is rejected by Google.")
            print("    Make sure you copied it fully without spaces.")
        else:
            print(f"    STATUS   : ERROR — {err[:300]}")
else:
    print("[4] Live API test: SKIPPED (fix key format first)")

print()
print("=" * 55)

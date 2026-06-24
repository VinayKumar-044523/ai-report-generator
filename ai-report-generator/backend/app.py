import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from routes import report_routes

# Resolve the frontend folder relative to this file
FRONTEND_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path="")
CORS(app)

app.register_blueprint(report_routes, url_prefix="/api")


@app.route("/")
def index():
    """Serve the frontend index.html at the root URL."""
    return send_from_directory(FRONTEND_DIR, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)

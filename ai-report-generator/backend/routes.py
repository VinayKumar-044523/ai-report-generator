from flask import Blueprint, request, jsonify
from utils import generate_report

report_routes = Blueprint("report_routes", __name__)


@report_routes.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "message": "AI Report Generator API is running"})


@report_routes.route("/generate-report", methods=["POST"])
def create_report():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"success": False, "error": "Request body must be JSON."}), 400

    topic = (data.get("topic") or "").strip()
    notes = (data.get("notes") or "").strip()
    style = (data.get("style") or "business").strip()
    length = (data.get("length") or "medium").strip()

    if not topic:
        return jsonify({"success": False, "error": "Topic is required"}), 400

    if len(topic) > 500:
        return jsonify({"success": False, "error": "Topic must be under 500 characters"}), 400

    if len(notes) > 3000:
        return jsonify({"success": False, "error": "Notes must be under 3000 characters"}), 400

    valid_styles = ["academic", "business", "technical", "journalistic", "summary"]
    valid_lengths = ["short", "medium", "long"]

    if style not in valid_styles:
        style = "business"
    if length not in valid_lengths:
        length = "medium"

    result = generate_report(topic, notes, style, length)

    if result["success"]:
        return jsonify(result), 200
    else:
        return jsonify(result), 500

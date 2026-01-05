from flask import Blueprint, jsonify

main_bp = Blueprint("main", __name__)

@main_bp.route("/api", methods=["GET"])
def main_route():
    return jsonify({
        "message": "API is working"
    }), 200
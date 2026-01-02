from functools import wraps
from flask import jsonify, request
from app.database.mongo import db

faculty_collection = db["faculty_timetable"]

def is_admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        user_id = request.user_id  # set by token_required

        user = faculty_collection.find_one({"_id": user_id})

        if not user:
            return jsonify({"message": "User not found"}), 404

        if not user.get("isAdmin", False):
            return jsonify({"message": "Admin access required"}), 403

        return f(*args, **kwargs)

    return decorated
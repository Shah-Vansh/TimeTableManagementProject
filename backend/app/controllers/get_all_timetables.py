from flask import Blueprint, jsonify
from app.database.mongo import db
from datetime import datetime

get_all_timetable_bp = Blueprint("get_all_timetables", __name__)

@get_all_timetable_bp.route("/timetables", methods=["GET"])
def get_all_timetables():
    docs = db.classwise_faculty.find()

    result = []
    for d in docs:
        result.append({
            "_id": d["_id"],
            "sem": d["sem"],
            "branch": d["branch"],
            "class": d["class"],
            "allowed_faculty": d["allowed_faculty"],
            "periods_per_day": 8,
            "status": "active",
            "createdBy": "Admin",
            "updatedAt": datetime.utcnow().isoformat(),
            "color": "blue"
        })

    return jsonify(result)
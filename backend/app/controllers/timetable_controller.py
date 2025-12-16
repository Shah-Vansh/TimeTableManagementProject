import json
from flask import request, jsonify
from collections import defaultdict
from app.database.mongo import db

DAYS_MAP = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat",
    "Sunday": "sun"
}

def save_timetable():
    try:
        sem = request.form.get("sem")
        class_name = request.form.get("class")
        schedule_raw = request.form.get("schedule")

        if not sem or not class_name or not schedule_raw:
            return jsonify({"error": "Missing sem, class or schedule"}), 400

        schedule = json.loads(schedule_raw)

        sem = int(sem)
        if sem < 1 or sem > 8:
            return jsonify({"error": "Invalid semester"}), 400

        classwise_col = db.classwise_faculty
        faculty_tt_col = db.faculty_timetable

        # ===============================
        # 1️⃣ CLASSWISE FACULTY
        # ===============================
        allowed_faculty = set()

        for day in schedule.values():
            for faculty in day.values():
                if faculty != "free":
                    allowed_faculty.add(faculty)

        class_id = f"sem{sem}{class_name.lower()}"

        classwise_col.update_one(
            {"_id": class_id},
            {
                "$set": {
                    "sem": sem,
                    "class": class_name,
                    "allowed_faculty": list(allowed_faculty)
                }
            },
            upsert=True
        )

        # ===============================
        # 2️⃣ FACULTY TIMETABLE
        # ===============================
        faculty_tables = defaultdict(lambda: {
            "mon": [], "tue": [], "wed": [],
            "thu": [], "fri": [], "sat": []
        })

        for day_name, slots in schedule.items():
            day_key = DAYS_MAP.get(day_name)
            if not day_key or day_key == "sun":
                continue

            for time_slot, faculty in slots.items():
                if faculty != "free":
                    faculty_tables[faculty][day_key].append(
                        f"{class_name}-Sem{sem}"
                    )

        for faculty_id, timetable in faculty_tables.items():
            faculty_tt_col.update_one(
                {"_id": faculty_id},
                {
                    "$set": {
                        "name": faculty_id,
                        "timetable": timetable
                    }
                },
                upsert=True
            )

        return jsonify({
            "message": "Timetable saved successfully",
            "class_id": class_id,
            "faculty_updated": list(faculty_tables.keys())
        }), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500

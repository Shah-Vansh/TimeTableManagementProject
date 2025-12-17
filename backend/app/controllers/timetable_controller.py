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

ALLOWED_BRANCHES = ["CSE", "CSE(AIML)", "DS"]

# Define time slots and their order
TIME_SLOTS = [
    "Time Slot 1", "Time Slot 2", "Time Slot 3", "Time Slot 4",
    "Time Slot 5", "Time Slot 6", "Time Slot 7", "Time Slot 8"
]
TIME_SLOT_INDEX = {slot: idx for idx, slot in enumerate(TIME_SLOTS)}

def save_timetable():
    try:
        sem = request.form.get("sem")
        branch = request.form.get("branch")
        class_name = request.form.get("class")
        schedule_raw = request.form.get("schedule")

        # ===============================
        # 🔹 BASIC VALIDATION
        # ===============================
        if not sem or not branch or not class_name or not schedule_raw:
            return jsonify({"error": "Missing sem, branch, class or schedule"}), 400

        if branch not in ALLOWED_BRANCHES:
            return jsonify({"error": "Invalid branch"}), 400

        sem = int(sem)
        if sem < 1 or sem > 8:
            return jsonify({"error": "Invalid semester"}), 400

        schedule = json.loads(schedule_raw)

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

        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"

        classwise_col.update_one(
            {"_id": class_id},
            {
                "$set": {
                    "sem": sem,
                    "branch": branch,
                    "class": class_name,
                    "allowed_faculty": list(allowed_faculty)
                }
            },
            upsert=True
        )

        # ===============================
        # 2️⃣ BUILD FACULTY TABLES (INDEX-BASED)
        # ===============================
        faculty_tables = defaultdict(lambda: {
            "mon": [None]*len(TIME_SLOTS),
            "tue": [None]*len(TIME_SLOTS),
            "wed": [None]*len(TIME_SLOTS),
            "thu": [None]*len(TIME_SLOTS),
            "fri": [None]*len(TIME_SLOTS),
            "sat": [None]*len(TIME_SLOTS)
        })

        for day_name, slots in schedule.items():
            day_key = DAYS_MAP.get(day_name)
            if not day_key or day_key == "sun":
                continue

            for time_slot, faculty in slots.items():
                if faculty != "free":
                    idx = TIME_SLOT_INDEX.get(time_slot)
                    if idx is not None:
                        faculty_tables[faculty][day_key][idx] = f"{branch}-{class_name}-Sem{sem}-{time_slot}"

        # ===============================
        # 3️⃣ MERGE WITH EXISTING FACULTY TIMETABLE
        # ===============================
        for faculty_id, new_tt in faculty_tables.items():

            existing = faculty_tt_col.find_one({"_id": faculty_id}) or {}
            existing_tt = existing.get("timetable", {
                "mon": [None]*len(TIME_SLOTS),
                "tue": [None]*len(TIME_SLOTS),
                "wed": [None]*len(TIME_SLOTS),
                "thu": [None]*len(TIME_SLOTS),
                "fri": [None]*len(TIME_SLOTS),
                "sat": [None]*len(TIME_SLOTS)
            })

            # Merge: replace only slots that are not None
            for day in new_tt:
                for i in range(len(TIME_SLOTS)):
                    if new_tt[day][i] is not None:
                        existing_tt[day][i] = new_tt[day][i]

            faculty_tt_col.update_one(
                {"_id": faculty_id},
                {"$set": {"name": faculty_id, "timetable": existing_tt}},
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

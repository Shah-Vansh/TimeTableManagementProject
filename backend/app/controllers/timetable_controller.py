import json
from flask import request, jsonify
from collections import defaultdict
from app.database.mongo import db

# ===============================
# 🔹 CONSTANTS
# ===============================
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

TIME_SLOT_INDEX = {
    "Time Slot 1": 0,
    "Time Slot 2": 1,
    "Time Slot 3": 2,
    "Time Slot 4": 3,
    "Time Slot 5": 4,
    "Time Slot 6": 5,
    "Time Slot 7": 6,
    "Time Slot 8": 7,
}

TOTAL_SLOTS = 8


# ===============================
# 🔹 HELPERS
# ===============================
def normalize_day_slots(day_list, total_slots=TOTAL_SLOTS):
    """
    Ensures a day timetable always has fixed length.
    Pads with 'free' or trims safely.
    """
    if not isinstance(day_list, list):
        return ["free"] * total_slots

    if len(day_list) < total_slots:
        return day_list + ["free"] * (total_slots - len(day_list))

    return day_list[:total_slots]


# ===============================
# 🔹 MAIN CONTROLLER
# ===============================
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
        # 2️⃣ BUILD FACULTY TABLES (FIXED INDEX)
        # ===============================
        faculty_tables = defaultdict(lambda: {
            "mon": ["free"] * TOTAL_SLOTS,
            "tue": ["free"] * TOTAL_SLOTS,
            "wed": ["free"] * TOTAL_SLOTS,
            "thu": ["free"] * TOTAL_SLOTS,
            "fri": ["free"] * TOTAL_SLOTS,
            "sat": ["free"] * TOTAL_SLOTS,
        })

        for day_name, slots in schedule.items():
            day_key = DAYS_MAP.get(day_name)
            if not day_key or day_key == "sun":
                continue

            for time_slot, faculty in slots.items():
                if faculty == "free":
                    continue

                slot_index = TIME_SLOT_INDEX.get(time_slot)
                if slot_index is None:
                    continue

                faculty_tables[faculty][day_key][slot_index] = (
                    f"{branch}-{class_name}-Sem{sem}-{time_slot}"
                )

        # ===============================
        # 3️⃣ MERGE WITH EXISTING FACULTY TIMETABLE (WITH CONFLICT CHECK)
        # ===============================
        for faculty_id, new_tt in faculty_tables.items():

            existing = faculty_tt_col.find_one({"_id": faculty_id}) or {}
            existing_tt = existing.get("timetable", {})

            # 🔹 normalize old data
            normalized_tt = {
                "mon": normalize_day_slots(existing_tt.get("mon")),
                "tue": normalize_day_slots(existing_tt.get("tue")),
                "wed": normalize_day_slots(existing_tt.get("wed")),
                "thu": normalize_day_slots(existing_tt.get("thu")),
                "fri": normalize_day_slots(existing_tt.get("fri")),
                "sat": normalize_day_slots(existing_tt.get("sat")),
            }

            # 🔴 CONFLICT DETECTION
            for day in new_tt:
                for i in range(TOTAL_SLOTS):

                    new_val = new_tt[day][i]
                    old_val = normalized_tt[day][i]

                    # ❌ conflict found
                    if new_val != "free" and old_val != "free" and old_val!=new_val:
                        return jsonify({
                            "error": "Faculty lecture conflict",
                            "faculty": faculty_id,
                            "day": day,
                            "time_slot": f"Time Slot {i + 1}",
                            "existing_lecture": old_val
                        }), 409

            # ✅ NO CONFLICT → SAFE TO MERGE
            for day in new_tt:
                for i in range(TOTAL_SLOTS):
                    if new_tt[day][i] != "free":
                        normalized_tt[day][i] = new_tt[day][i]

            faculty_tt_col.update_one(
                {"_id": faculty_id},
                {
                    "$set": {
                        "name": faculty_id,
                        "timetable": normalized_tt
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

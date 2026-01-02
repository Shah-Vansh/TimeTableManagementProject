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

        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"

        # ===============================
        # 🔹 CHECK IF TIMETABLE EXISTS
        # ===============================
        existing_class = classwise_col.find_one({"_id": class_id})
        is_new = existing_class is None

        # ===============================
        # 1️⃣ GET OLD AND NEW FACULTY LISTS
        # ===============================
        old_faculty = set(existing_class.get("allowed_faculty", [])) if existing_class else set()
        
        new_faculty = set()
        for day in schedule.values():
            for faculty in day.values():
                if faculty != "free":
                    new_faculty.add(faculty)

        # Faculty who are removed from this class (only relevant for edits)
        removed_faculty = old_faculty - new_faculty
        # Faculty who remain or are added
        active_faculty = new_faculty

        # ===============================
        # 2️⃣ BUILD NEW FACULTY TABLES
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
        # 3️⃣ REMOVE OLD LECTURES FOR REMOVED FACULTY (only for edits)
        # ===============================
        if not is_new:
            for faculty_id in removed_faculty:
                existing = faculty_tt_col.find_one({"_id": faculty_id})
                if not existing:
                    continue

                existing_tt = existing.get("timetable", {})
                normalized_tt = {
                    "mon": normalize_day_slots(existing_tt.get("mon")),
                    "tue": normalize_day_slots(existing_tt.get("tue")),
                    "wed": normalize_day_slots(existing_tt.get("wed")),
                    "thu": normalize_day_slots(existing_tt.get("thu")),
                    "fri": normalize_day_slots(existing_tt.get("fri")),
                    "sat": normalize_day_slots(existing_tt.get("sat")),
                }

                # Remove lectures matching this class pattern
                class_pattern = f"{branch}-{class_name}-Sem{sem}-"
                
                for day in normalized_tt:
                    for i in range(TOTAL_SLOTS):
                        if normalized_tt[day][i].startswith(class_pattern):
                            normalized_tt[day][i] = "free"

                faculty_tt_col.update_one(
                    {"_id": faculty_id},
                    {"$set": {"timetable": normalized_tt}},
                    upsert=True
                )

        # ===============================
        # 4️⃣ UPDATE ACTIVE FACULTY TIMETABLES
        # ===============================
        for faculty_id in active_faculty:
            existing = faculty_tt_col.find_one({"_id": faculty_id}) or {}
            existing_tt = existing.get("timetable", {})

            normalized_tt = {
                "mon": normalize_day_slots(existing_tt.get("mon")),
                "tue": normalize_day_slots(existing_tt.get("tue")),
                "wed": normalize_day_slots(existing_tt.get("wed")),
                "thu": normalize_day_slots(existing_tt.get("thu")),
                "fri": normalize_day_slots(existing_tt.get("fri")),
                "sat": normalize_day_slots(existing_tt.get("sat")),
            }

            # For edits, remove old lectures for this class first
            if not is_new:
                class_pattern = f"{branch}-{class_name}-Sem{sem}-"
                
                for day in normalized_tt:
                    for i in range(TOTAL_SLOTS):
                        if normalized_tt[day][i].startswith(class_pattern):
                            normalized_tt[day][i] = "free"

            # Now check for conflicts with new schedule
            new_tt = faculty_tables[faculty_id]
            
            for day in new_tt:
                for i in range(TOTAL_SLOTS):
                    new_val = new_tt[day][i]
                    old_val = normalized_tt[day][i]

                    # ❌ conflict with OTHER classes
                    if new_val != "free" and old_val != "free":
                        return jsonify({
                            "error": "Faculty lecture conflict",
                            "faculty": faculty_id,
                            "day": day,
                            "time_slot": f"Time Slot {i + 1}",
                            "existing_lecture": old_val
                        }), 409

            # ✅ NO CONFLICT → MERGE NEW SCHEDULE
            for day in new_tt:
                for i in range(TOTAL_SLOTS):
                    if new_tt[day][i] != "free":
                        normalized_tt[day][i] = new_tt[day][i]

            faculty_tt_col.update_one(
                {"_id": faculty_id},
                {
                    "$set": {
                        "_id": faculty_id,
                        "timetable": normalized_tt
                    }
                },
                upsert=True
            )

        # ===============================
        # 5️⃣ UPDATE/INSERT CLASSWISE FACULTY
        # ===============================
        classwise_col.update_one(
            {"_id": class_id},
            {
                "$set": {
                    "sem": sem,
                    "branch": branch,
                    "class": class_name,
                    "allowed_faculty": list(new_faculty)
                }
            },
            upsert=True  # This allows both insert and update
        )

        action = "created" if is_new else "updated"
        
        return jsonify({
            "message": f"Timetable {action} successfully",
            "class_id": class_id,
            "action": action,
            "faculty_updated": list(active_faculty),
            "faculty_removed": list(removed_faculty) if not is_new else []
        }), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
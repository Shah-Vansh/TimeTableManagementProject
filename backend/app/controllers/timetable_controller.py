import json
from flask import request, jsonify
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
    "Sunday": "sun",
}

ALLOWED_BRANCHES = ["CSE", "CSE(AIML)", "DS", "IT"]

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
# 🔹 GET ALL FACULTIES
# ===============================
def get_all_faculties():
    """
    Fetches all faculties from faculty_timetable collection
    """
    try:
        faculty_tt_col = db.faculty_timetable

        # Fetch all faculty documents
        faculties = list(faculty_tt_col.find({}, {"_id": 1, "name": 1}))

        # Format the response
        faculty_list = []
        for faculty in faculties:
            faculty_list.append(
                {
                    "id": faculty.get("_id"),
                    "name": faculty.get("name", faculty.get("_id")),
                }
            )

        return jsonify({"success": True, "faculties": faculty_list}), 200

    except Exception as e:
        print("ERROR fetching faculties:", e)
        return jsonify({"success": False, "error": "Failed to fetch faculties"}), 500


# ===============================
# 🔹 MAIN CONTROLLER
# ===============================
def save_timetable():
    try:
        sem = request.form.get("sem")
        branch = request.form.get("branch")
        class_name = request.form.get("class")
        schedule_raw = request.form.get("schedule")

        # Get Telegram Chat IDs from form data (array)
        telegram_chat_ids = []
        i = 0
        while True:
            chat_id = request.form.get(f"telegram_chat_ids[{i}]")
            if chat_id is None:
                break
            if str(chat_id).strip():
                telegram_chat_ids.append(str(chat_id).strip())
            i += 1

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
        # 1️⃣ EXTRACT ALLOWED FACULTY & UPDATE CLASSWISE
        # ===============================
        allowed_faculty = set()

        for day in schedule.values():
            for faculty in day.values():
                if faculty != "free":
                    allowed_faculty.add(faculty)

        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"

        # Prepare update data
        update_data = {
            "sem": sem,
            "branch": branch,
            "class": class_name,
            "allowed_faculty": list(allowed_faculty),
        }

        # Add Telegram Chat IDs if provided
        if telegram_chat_ids:
            update_data["telegram_chat_ids"] = telegram_chat_ids
        else:
            # If no chat IDs provided, set empty array
            update_data["telegram_chat_ids"] = []

        classwise_col.update_one({"_id": class_id}, {"$set": update_data}, upsert=True)

        # ===============================
        # 2️⃣ VALIDATE FACULTIES EXIST
        # ===============================
        # for faculty_id in allowed_faculty:
        #     existing_faculty = faculty_tt_col.find_one({"_id": faculty_id})
        #     if not existing_faculty:
        #         return jsonify({
        #             "error": f"Faculty {faculty_id} does not exist in database"
        #         }), 400

        # ===============================
        # 3️⃣ DIRECTLY UPDATE FACULTY TIMETABLES
        # ===============================
        faculty_updates = {}

        # Process schedule and prepare updates for each faculty
        for day_name, slots in schedule.items():
            day_key = DAYS_MAP.get(day_name)
            if not day_key or day_key == "sun":
                continue

            for time_slot, faculty_id in slots.items():
                if faculty_id == "free":
                    continue

                slot_index = TIME_SLOT_INDEX.get(time_slot)
                if slot_index is None:
                    continue

                # Initialize faculty update structure if needed
                if faculty_id not in faculty_updates:
                    faculty_updates[faculty_id] = {}

                if day_key not in faculty_updates[faculty_id]:
                    faculty_updates[faculty_id][day_key] = {}

                # Store the class assignment for this slot
                faculty_updates[faculty_id][day_key][
                    slot_index
                ] = f"{branch}-{class_name}-Sem{sem}-{time_slot}"

        # ===============================
        # 4️⃣ MERGE WITH EXISTING TIMETABLES (WITH CONFLICT CHECK)
        # ===============================
        for faculty_id, new_assignments in faculty_updates.items():

            # Get existing timetable
            existing = faculty_tt_col.find_one({"_id": faculty_id}) or {}
            existing_tt = existing.get("timetable", {})

            # Normalize existing timetable
            normalized_tt = {
                "mon": normalize_day_slots(existing_tt.get("mon")),
                "tue": normalize_day_slots(existing_tt.get("tue")),
                "wed": normalize_day_slots(existing_tt.get("wed")),
                "thu": normalize_day_slots(existing_tt.get("thu")),
                "fri": normalize_day_slots(existing_tt.get("fri")),
                "sat": normalize_day_slots(existing_tt.get("sat")),
            }

            # 🔴 CONFLICT DETECTION & MERGE
            for day_key, slot_assignments in new_assignments.items():
                for slot_index, new_class in slot_assignments.items():
                    old_class = normalized_tt[day_key][slot_index]

                    # ❌ Conflict found
                    if old_class != "free" and old_class != new_class:
                        return (
                            jsonify(
                                {
                                    "error": "Faculty lecture conflict",
                                    "faculty": faculty_id,
                                    "day": day_key,
                                    "time_slot": f"Time Slot {slot_index + 1}",
                                    "existing_lecture": old_class,
                                    "new_lecture": new_class,
                                }
                            ),
                            409,
                        )

                    # ✅ Safe to assign
                    normalized_tt[day_key][slot_index] = new_class

            # Update faculty timetable in database
            faculty_tt_col.update_one(
                {"_id": faculty_id},
                {"$set": {"timetable": normalized_tt}},
                upsert=False,
            )

            return (
                jsonify(
                    {
                        "message": "Timetable saved successfully",
                        "class_id": class_id,
                        "faculty_updated": list(faculty_updates.keys()),
                        "telegram_chat_ids": (
                            telegram_chat_ids if telegram_chat_ids else []
                        ),
                    }
                ),
                200,
            )

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
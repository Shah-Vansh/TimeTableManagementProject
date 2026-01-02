import json
from flask import request, jsonify
from app.database.mongo import db

# ===============================
# 🔹 CONSTANTS
# ===============================
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
DAYS_MAP = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat",
    "Sunday": "sun"  # Optional, if needed
}

TOTAL_SLOTS = 8
TIME_SLOT_KEYS = [
    "Time Slot 1",
    "Time Slot 2",
    "Time Slot 3",
    "Time Slot 4",
    "Time Slot 5",
    "Time Slot 6",
    "Time Slot 7",
    "Time Slot 8",
]

# ===============================
# 🔹 HELPERS
# ===============================
def normalize_faculty_slots(day_list):
    """Ensure each day's timetable has exactly TOTAL_SLOTS slots."""
    if not isinstance(day_list, list):
        return ["free"] * TOTAL_SLOTS
    return (day_list + ["free"] * TOTAL_SLOTS)[:TOTAL_SLOTS]

# ===============================
# 🔹 CONTROLLER
# ===============================
def fetch_timetable():
    try:
        sem = request.args.get("sem")
        branch = request.args.get("branch")
        class_name = request.args.get("class")

        # -------------------------------
        # Validation
        # -------------------------------
        if not sem or not branch or not class_name:
            return jsonify({"error": "Missing sem, branch, or class"}), 400

        sem = int(sem)
        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"

        # -------------------------------
        # Fetch classwise faculty
        # -------------------------------
        classwise_doc = db.classwise_faculty.find_one({"_id": class_id})
        if not classwise_doc:
            return jsonify({"error": "Class not found"}), 404

        allowed_faculty = classwise_doc.get("allowed_faculty", [])
        
        # Get Telegram Chat IDs (support both old and new format)
        telegram_chat_ids = classwise_doc.get('telegram_chat_ids', [])
        # If it's a single string (old format), convert to array
        if isinstance(telegram_chat_ids, str):
            telegram_chat_ids = [telegram_chat_ids] if telegram_chat_ids.strip() else []
        # If it's None, use empty array
        elif telegram_chat_ids is None:
            telegram_chat_ids = []

        # -------------------------------
        # Fetch faculty timetables
        # -------------------------------
        faculty_tt_col = db.faculty_timetable

        # Initialize empty schedule
        schedule = {day: {slot: "free" for slot in TIME_SLOT_KEYS} for day in DAYS}

        for faculty in allowed_faculty:
            doc = faculty_tt_col.find_one({"_id": faculty})
            if not doc:
                continue
            tt = doc.get("timetable", {})
            for day_name in DAYS:
                day_key = DAYS_MAP[day_name]
                slots = normalize_faculty_slots(tt.get(day_key, []))
                for i, val in enumerate(slots):
                    # Check if this faculty is assigned to this class in this slot
                    if val.startswith(f"{branch}-{class_name}-Sem{sem}"):
                        schedule[day_name][TIME_SLOT_KEYS[i]] = faculty

        # Prepare response data
        response_data = {
            "sem": sem,
            "branch": branch,
            "class": class_name,
            "schedule": schedule
        }
        
        # Add Telegram Chat IDs if available
        if telegram_chat_ids:
            response_data["telegram_chat_ids"] = telegram_chat_ids

        return jsonify(response_data), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
from flask import Blueprint, request, jsonify
from app.database.mongo import db
from datetime import date

fetch_all_changes_bp = Blueprint("fetch_all_changes", __name__)

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
DAYS_MAP = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat",
    "Sunday": "sun",  # Optional, if needed
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


def fetch_all_changes():
    try:
        temp_col = db.temp_faculty_timetable

        # -------------------------------
        # Initialize empty schedule
        # -------------------------------
        schedule = {day: {slot: [] for slot in TIME_SLOT_KEYS} for day in DAYS}

        # -------------------------------
        # Fetch all temp changes
        # -------------------------------
        changes = temp_col.find({})

        for change in changes:
            faculty_id = change.get("faculty_id")
            assigned_to = change.get("assigned_to")
            day_key = change.get("day")  # mon, tue, etc.
            lec_no = change.get("lec_no")  # 0-based index
            date = change.get("date")

            # Map day_key → Day name
            day_name = next((d for d, k in DAYS_MAP.items() if k == day_key), None)

            if not day_name or lec_no is None or lec_no >= TOTAL_SLOTS:
                continue

            slot_key = TIME_SLOT_KEYS[lec_no]

            schedule[day_name][slot_key].append(
                {
                    "faculty": faculty_id,
                    "assigned_to": assigned_to,
                    "date": date,
                    "lec_no": lec_no,
                }
            )

        return (
            jsonify(
                {"total_changes": temp_col.count_documents({}), "changes": schedule}
            ),
            200,
        )

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500


def delete_temp_change():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ["faculty_id", "date", "day", "lec_no"]

        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        faculty_id = data["faculty_id"]
        date = data["date"]
        day = data["day"]
        lec_no = data["lec_no"]
        assigned_to = data.get("assigned_to")

        # Get the temporary timetable collection
        temp_col = db.temp_faculty_timetable

        # Build query to find the exact record
        query = {"faculty_id": faculty_id, "date": date, "day": day, "lec_no": lec_no}

        # If assigned_to is provided, include it in the query for more specificity
        if assigned_to:
            query["assigned_to"] = assigned_to

        # Find the document to delete
        document = temp_col.find_one(query)

        if not document:
            return jsonify({"error": "Temporary change not found"}), 404

        # Delete the document
        result = temp_col.delete_one(query)

        if result.deleted_count > 0:
            # Also check if we should delete from regular timetable if it exists
            # This is optional - depends on your business logic
            regular_col = db.faculty_timetable

            # Build query for regular timetable
            regular_query = {"faculty_id": faculty_id, "day": day, "lec_no": lec_no}

            # Check if there's a regular timetable entry for this slot
            regular_entry = regular_col.find_one(regular_query)

            if regular_entry:
                # You could choose to restore the regular timetable here
                # For now, just log it
                print(
                    f"Note: Faculty {faculty_id} has a regular timetable entry for {day} slot {lec_no}"
                )

            return (
                jsonify(
                    {
                        "success": True,
                        "message": "Temporary change deleted successfully",
                        "deleted_count": result.deleted_count,
                    }
                ),
                200,
            )
        else:
            return jsonify({"error": "Failed to delete temporary change"}), 500

    except Exception as e:
        print(f"Error deleting temporary change: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

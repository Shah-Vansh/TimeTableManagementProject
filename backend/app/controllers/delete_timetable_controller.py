from flask import request, jsonify
from app.database.mongo import db
from app.controllers.timetable_controller import (
    ALLOWED_BRANCHES,
    TOTAL_SLOTS,
    normalize_day_slots
)

def delete_timetable():
    try:
        sem = request.form.get("sem")
        branch = request.form.get("branch")
        class_name = request.form.get("class")

        if not sem or not branch or not class_name:
            return jsonify({"error": "Missing sem, branch or class"}), 400

        if branch not in ALLOWED_BRANCHES:
            return jsonify({"error": "Invalid branch"}), 400

        sem = int(sem)
        if sem < 1 or sem > 8:
            return jsonify({"error": "Invalid semester"}), 400

        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"

        classwise_col = db.classwise_faculty
        faculty_tt_col = db.faculty_timetable

        class_doc = classwise_col.find_one({"_id": class_id})
        if not class_doc:
            return jsonify({"error": "Timetable not found"}), 404

        allowed_faculty = class_doc.get("allowed_faculty", [])
        lecture_prefix = f"{branch}-{class_name}-Sem{sem}-"

        for faculty_id in allowed_faculty:
            faculty_doc = faculty_tt_col.find_one({"_id": faculty_id})
            if not faculty_doc:
                continue

            timetable = faculty_doc.get("timetable", {})
            updated = False

            for day, slots in timetable.items():
                slots = normalize_day_slots(slots)

                for i in range(TOTAL_SLOTS):
                    if isinstance(slots[i], str) and slots[i].startswith(lecture_prefix):
                        slots[i] = "free"
                        updated = True

                timetable[day] = slots

            if updated:
                faculty_tt_col.update_one(
                    {"_id": faculty_id},
                    {"$set": {"timetable": timetable}}
                )

        classwise_col.delete_one({"_id": class_id})

        return jsonify({
            "message": "Timetable deleted successfully",
            "class_id": class_id
        }), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500

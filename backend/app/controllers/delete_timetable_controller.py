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

        # ===============================
        # 🔹 BASIC VALIDATION
        # ===============================
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

        # ===============================
        # 🔹 CHECK IF TIMETABLE EXISTS
        # ===============================
        class_doc = classwise_col.find_one({"_id": class_id})
        if not class_doc:
            return jsonify({"error": "Timetable not found"}), 404

        allowed_faculty = class_doc.get("allowed_faculty", [])
        lecture_prefix = f"{branch}-{class_name}-Sem{sem}-"

        # ===============================
        # 🔹 REMOVE LECTURES FROM FACULTY TIMETABLES
        # ===============================
        faculty_updated = []
        
        for faculty_id in allowed_faculty:
            faculty_doc = faculty_tt_col.find_one({"_id": faculty_id})
            if not faculty_doc:
                continue

            existing_tt = faculty_doc.get("timetable", {})
            
            # Normalize all days
            normalized_tt = {
                "mon": normalize_day_slots(existing_tt.get("mon")),
                "tue": normalize_day_slots(existing_tt.get("tue")),
                "wed": normalize_day_slots(existing_tt.get("wed")),
                "thu": normalize_day_slots(existing_tt.get("thu")),
                "fri": normalize_day_slots(existing_tt.get("fri")),
                "sat": normalize_day_slots(existing_tt.get("sat")),
            }

            updated = False

            # Remove lectures matching this class
            for day in normalized_tt:
                for i in range(TOTAL_SLOTS):
                    if normalized_tt[day][i].startswith(lecture_prefix):
                        normalized_tt[day][i] = "free"
                        updated = True

            # Only update if changes were made
            if updated:
                faculty_tt_col.update_one(
                    {"_id": faculty_id},
                    {"$set": {"timetable": normalized_tt}}
                )
                faculty_updated.append(faculty_id)

        # ===============================
        # 🔹 DELETE CLASSWISE FACULTY DOCUMENT
        # ===============================
        classwise_col.delete_one({"_id": class_id})

        return jsonify({
            "message": "Timetable deleted successfully",
            "class_id": class_id,
            "faculty_updated": faculty_updated
        }), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
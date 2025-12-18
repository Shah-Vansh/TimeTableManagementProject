from flask import Blueprint, request, jsonify
from app.database.mongo import db
from datetime import date

rearrange_lecture_bp = Blueprint("rearrange_lecture", __name__)

def replace_lecture_helper(day, class_name, sem, branch, lec_no):
    """
    Helper function to try replacing a lecture.
    Returns dict with success status and assigned_faculty if successful.
    """
    # Fetch classwise faculty configuration
    class_doc = db.classwise_faculty.find_one({
        "class": class_name,
        "sem": sem,
        "branch": branch
    })

    if not class_doc:
        return {
            "success": False,
            "message": f"No class found for {class_name}, Sem {sem}, {branch}"
        }

    allowed_faculty = class_doc.get("allowed_faculty", [])

    # Iterate over allowed faculty
    for fac_id in allowed_faculty:
        faculty_doc = db.faculty_timetable.find_one({"_id": fac_id})
        if not faculty_doc:
            continue

        timetable = faculty_doc.get("timetable", {})

        if day not in timetable:
            continue

        # Safety: lecture index range
        if lec_no < 0 or lec_no >= len(timetable[day]):
            continue

        # Check if faculty is free
        if timetable[day][lec_no] == "free":
            # Don't update DB here, just return success
            return {
                "success": True,
                "assigned_faculty": fac_id
            }

    # No faculty available
    return {
        "success": False,
        "message": f"No faculty free for {class_name} at lecture {lec_no} on {day}"
    }


@rearrange_lecture_bp.route("/rearrange-lecture", methods=["POST", "OPTIONS"])
def rearrange_lecture():
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    # Extract fields
    day = data.get("day")              # "mon"
    class_name = data.get("class")     # "D1"
    sem = data.get("sem")              # 4
    branch = data.get("branch")        # "CSE(AIML)"
    lec_no = data.get("lec_no")        # 0-based index

    if not all([day, class_name, sem, branch, lec_no is not None]):
        return jsonify({
            "success": False,
            "message": "Missing required fields"
        }), 400

    try:
        lec_no = int(lec_no)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "lec_no must be an integer"
        }), 400

    # 1️⃣ FIRST TRY — Normal replace
    first_try = replace_lecture_helper(day, class_name, sem, branch, lec_no)

    if first_try["success"]:
        # Assign the lecture
        assigned_fac = first_try["assigned_faculty"]
        db.faculty_timetable.update_one(
            {"_id": assigned_fac},
            {"$set": {
                f"timetable.{day}.{lec_no}":
                f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}"
            }}
        )

        return jsonify({
            "success": True,
            "assigned_faculty": assigned_fac,
            "type": "direct",
            "message": (
                f"@ {branch}_{class_name}\n"
                f"Change in Lecture\n"
                f"Date: {date.today().strftime('%d/%m/%Y')}\n"
                f"Subject: subject\n"
                f"Lecture no.: {lec_no+1}\n"
                f"Time: time\n"
                f"Location: Same as per timetable"
            )
        }), 200

    # 2️⃣ SECOND TRY — Rearrangement
    # Get allowed faculty for the target class
    class_doc = db.classwise_faculty.find_one({
        "class": class_name,
        "sem": sem,
        "branch": branch
    })

    if not class_doc:
        return jsonify({
            "success": False,
            "message": "Class configuration not found"
        }), 404

    allowed_faculty = class_doc.get("allowed_faculty", [])

    # Try to rearrange: for each allowed faculty, see if we can move their current class elsewhere
    for fac_id in allowed_faculty:
        fac_doc = db.faculty_timetable.find_one({"_id": fac_id})
        if not fac_doc:
            continue

        timetable = fac_doc.get("timetable", {})
        if day not in timetable:
            continue

        if lec_no < 0 or lec_no >= len(timetable[day]):
            continue

        # Get what this faculty is currently teaching
        current_slot = timetable[day][lec_no]

        # Skip if already free (already tried in first_try)
        if current_slot == "free":
            continue

        # Parse the current slot to extract class info
        # Format: "branch-class-SemX-Time Slot Y"
        try:
            parts = current_slot.split("-")
            if len(parts) >= 3:
                occupied_branch = parts[0]
                occupied_class = parts[1]
                occupied_sem = int(parts[2].replace("Sem", ""))
            else:
                continue
        except (ValueError, IndexError):
            continue

        # Try to find another faculty for the occupied class
        reassign_attempt = replace_lecture_helper(
            day, occupied_class, occupied_sem, occupied_branch, lec_no
        )

        if reassign_attempt["success"]:
            # Found someone to take the occupied class!
            new_fac = reassign_attempt["assigned_faculty"]

            # Update new faculty with the occupied class
            db.faculty_timetable.update_one(
                {"_id": new_fac},
                {"$set": {f"timetable.{day}.{lec_no}": current_slot}}
            )

            # Update original faculty with the target class
            db.faculty_timetable.update_one(
                {"_id": fac_id},
                {"$set": {
                    f"timetable.{day}.{lec_no}":
                    f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}"
                }}
            )

            return jsonify({
                "success": True,
                "assigned_faculty": fac_id,
                "type": "rearranged",
                "message": (
                    f"@ {branch}_{class_name}\n"
                    f"Lecture Rearranged\n"
                    f"Date: {date.today().strftime('%d/%m/%Y')}\n"
                    f"Lecture no.: {lec_no+1}\n"
                    f"Location: Same as per timetable"
                )
            }), 200

    # ❌ Failure
    return jsonify({
        "success": False,
        "message": "Rearrangement failed: no possible swap found"
    }), 409
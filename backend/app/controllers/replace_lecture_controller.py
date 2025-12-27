from flask import Blueprint, request, jsonify
from app.database.mongo import db
from datetime import date

# Blueprint
replace_lecture_bp = Blueprint("replace_lecture", __name__)


def is_faculty_free(fac_id, day, lec_no):
    today = date.today().isoformat()

    # 1️⃣ Check temp timetable FIRST
    temp = db.temp_faculty_timetable.find_one(
        {"faculty_id": fac_id, "date": today, "day": day, "lec_no": lec_no}
    )
    if temp:
        return False

    # 2️⃣ Check permanent timetable
    faculty_doc = db.faculty_timetable.find_one({"_id": fac_id})
    if not faculty_doc:
        return False

    timetable = faculty_doc.get("timetable", {})
    return (
        day in timetable
        and 0 <= lec_no < len(timetable[day])
        and timetable[day][lec_no] == "free"
    )


@replace_lecture_bp.route("/get-available-faculty", methods=["POST", "OPTIONS"])
def get_available_faculty():
    """Fetch all available free faculty for a given lecture slot"""
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    day = data.get("day")
    class_name = data.get("class")
    sem = data.get("sem")
    branch = data.get("branch")
    lec_no = data.get("lec_no")

    if not all([day, class_name, sem, branch, lec_no is not None]):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    lec_no = int(lec_no)

    # Find class document with allowed faculty
    class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )

    if not class_doc:
        return jsonify({"success": False, "message": "Class not found"}), 404

    # Get all free faculty from allowed list
    available_faculty = []
    for fac_id in class_doc.get("allowed_faculty", []):
        if is_faculty_free(fac_id, day, lec_no):
            # Get faculty details (name, department, etc.)
            faculty_doc = db.faculty_timetable.find_one({"_id": fac_id})

            faculty_info = {
                "faculty_id": fac_id,
                "name": faculty_doc.get("name", fac_id) if faculty_doc else fac_id,
                "department": (
                    faculty_doc.get("department", "N/A") if faculty_doc else "N/A"
                ),
            }
            available_faculty.append(faculty_info)

    if not available_faculty:
        return (
            jsonify(
                {"success": False, "message": "No faculty available for this time slot"}
            ),
            409,
        )

    return (
        jsonify(
            {
                "success": True,
                "available_faculty": available_faculty,
                "count": len(available_faculty),
            }
        ),
        200,
    )


@replace_lecture_bp.route("/assign-faculty", methods=["POST", "OPTIONS"])
def assign_faculty():
    """Assign a selected faculty to the lecture slot"""
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    day = data.get("day")
    class_name = data.get("class")
    sem = data.get("sem")
    branch = data.get("branch")
    lec_no = data.get("lec_no")
    faculty_id = data.get("faculty_id")

    if not all([day, class_name, sem, branch, lec_no is not None, faculty_id]):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    lec_no = int(lec_no)
    today = date.today().isoformat()

    # Verify the class exists
    class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )

    if not class_doc:
        return jsonify({"success": False, "message": "Class not found"}), 404

    # Verify faculty is in allowed list
    if faculty_id not in class_doc.get("allowed_faculty", []):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Faculty not in allowed list for this class",
                }
            ),
            403,
        )

    # Double-check faculty is still free
    if not is_faculty_free(faculty_id, day, lec_no):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Faculty is no longer available (may have been assigned to another lecture)",
                }
            ),
            409,
        )

    # ✅ STORE IN TEMP TIMETABLE
    db.temp_faculty_timetable.insert_one(
        {
            "faculty_id": faculty_id,
            "date": today,
            "day": day,
            "lec_no": lec_no,
            "assigned_to": f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}",
        }
    )

    # Get faculty name for confirmation message
    faculty_doc = db.faculty_timetable.find_one({"_id": faculty_id})
    faculty_name = faculty_doc.get("name", faculty_id) if faculty_doc else faculty_id

    return (
        jsonify(
            {
                "success": True,
                "assigned_faculty": faculty_id,
                "faculty_name": faculty_name,
                "message": (
                    f"@ {branch}_{class_name}\t"
                    f"Change in Lecture\n\n"
                    f"Date: {date.today().strftime('%d/%m/%Y')}\n\n"
                    f"Lecture no.: {lec_no+1}\n\n"
                    f"Faculty: {faculty_name}\n\n"
                    f"Location: Same as per timetable"
                ),
            }
        ),
        200,
    )


@replace_lecture_bp.route("/replace-lecture", methods=["POST", "OPTIONS"])
def replace_lecture():
    """Legacy endpoint - auto-assigns first available faculty"""
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    day = data.get("day")
    class_name = data.get("class")
    sem = data.get("sem")
    branch = data.get("branch")
    lec_no = data.get("lec_no")

    if not all([day, class_name, sem, branch, lec_no is not None]):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    lec_no = int(lec_no)
    today = date.today().isoformat()

    class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )

    if not class_doc:
        return jsonify({"success": False, "message": "Class not found"}), 404

    for fac_id in class_doc.get("allowed_faculty", []):

        if not is_faculty_free(fac_id, day, lec_no):
            continue

        # ✅ STORE IN TEMP TIMETABLE (NOT PERMANENT)
        db.temp_faculty_timetable.insert_one(
            {
                "faculty_id": fac_id,
                "date": today,
                "day": day,
                "lec_no": lec_no,
                "assigned_to": f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}",
            }
        )

        return (
            jsonify(
                {
                    "success": True,
                    "assigned_faculty": fac_id,
                    "message": (
                        f"@ {branch}_{class_name}\t"
                        f"Change in Lecture\n\n"
                        f"Date: {date.today().strftime('%d/%m/%Y')}\n\n"
                        f"Lecture no.: {lec_no+1}\n\n"
                        f"Location: Same as per timetable"
                    ),
                }
            ),
            200,
        )

    return jsonify({"success": False, "message": "No faculty free"}), 409

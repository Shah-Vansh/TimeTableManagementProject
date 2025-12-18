from flask import Blueprint, request, jsonify
from app.database.mongo import db
from datetime import date

# Blueprint
replace_lecture_bp = Blueprint("replace_lecture", __name__)

@replace_lecture_bp.route("/replace-lecture", methods=["POST", "OPTIONS"])
def replace_lecture():
    # Handle preflight request explicitly (safe even with flask-cors)
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    # Extract fields
    day = data.get("day")              # "mon", "tue", ...
    class_name = data.get("class")     # "D1"
    sem = data.get("sem")              # 4
    branch = data.get("branch")        # "CSE(AIML)"
    lec_no = data.get("lec_no")        # index (0-based)

    # Basic validation
    if not all([day, class_name, sem, branch, lec_no is not None]):
        return jsonify({
            "success": False,
            "message": "Missing required fields"
        }), 400

    # Convert lecture number to int (IMPORTANT FIX)
    try:
        lec_no = int(lec_no)
    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "lec_no must be an integer"
        }), 400

    # 1️⃣ Fetch classwise faculty configuration
    class_doc = db.classwise_faculty.find_one({
        "class": class_name,
        "sem": sem,
        "branch": branch
    })

    if not class_doc:
        return jsonify({
            "success": False,
            "message": f"No class found for {class_name}, Sem {sem}, {branch}"
        }), 404

    allowed_faculty = class_doc.get("allowed_faculty", [])

    # 2️⃣ Iterate over allowed faculty
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

        # 3️⃣ Assign lecture if free
        if timetable[day][lec_no] == "free":
            db.faculty_timetable.update_one(
                {"_id": fac_id},
                {"$set": {f"timetable.{day}.{lec_no}": f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}"}}
            )

            return jsonify({
                "success": True,
                "assigned_faculty": fac_id,
                "day": day,
                "lecture": lec_no,
                "class": class_name,
                # "message": f"Lecture {lec_no+1} on {day} assigned to {fac_id}"
                # "message": f"@ {branch}_{class_name} \nChange in  Lecture \nDate: {date.today().strftime("%d/%m/%Y")} \nSubject: subject\n Lecture no. : {lec_no}\nTime: time Location:same as per time table"
                "message" : (
                    f"@ {branch}_{class_name}\n"
                    f"Change in Lecture\n"
                    f"Date: {date.today().strftime('%d/%m/%Y')}\n"
                    f"Subject: subject\n"
                    f"Lecture no.: {lec_no+1}\n"
                    f"Time: time\n"
                    f"Location: Same as per timetable"
                )
            }), 200

    # 4️⃣ No faculty available
    return jsonify({
        "success": False,
        "message": f"No faculty free for {class_name} at lecture {lec_no} on {day}"
    }), 409

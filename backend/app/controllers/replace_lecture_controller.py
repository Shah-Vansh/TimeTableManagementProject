from flask import Blueprint, request, jsonify
from app.database.mongo import db
from datetime import datetime
from app.utils.telegram_messanger import send_telegram_message

# Blueprint
replace_lecture_bp = Blueprint("replace_lecture", __name__)


def send_telegram_notifications(
    class_message, faculty_message, class_chat_ids, faculty_chat_id, faculty_name
):
    """Send notifications to both class and faculty chat IDs"""

    class_sent = []
    faculty_sent = False

    # Send to class chat IDs
    if class_chat_ids:
        for chat_id in class_chat_ids:
            if chat_id and str(chat_id).strip():
                try:
                    send_telegram_message(class_message, str(chat_id).strip())
                    class_sent.append(str(chat_id).strip())
                except Exception as e:
                    print(f"Failed to send to class chat_id {chat_id}: {e}")

    # Send to faculty chat ID
    if faculty_chat_id and str(faculty_chat_id).strip():
        try:
            send_telegram_message(faculty_message, str(faculty_chat_id).strip())
            faculty_sent = True
        except Exception as e:
            print(
                f"Failed to send to faculty {faculty_name} (chat_id: {faculty_chat_id}): {e}"
            )

    return {
        "class_sent": class_sent,
        "faculty_sent": faculty_sent,
        "total_sent": len(class_sent) + (1 if faculty_sent else 0),
    }


def is_faculty_free(fac_id, day, lec_no, target_date):
    # 1️⃣ Check temp timetable FIRST
    temp = db.temp_faculty_timetable.find_one(
        {"faculty_id": fac_id, "date": target_date, "day": day, "lec_no": lec_no}
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
    target_date = data.get("date")  # Get date from frontend

    if not all([day, class_name, sem, branch, lec_no is not None, target_date]):
        return (
            jsonify({"success": False, "message": "Missing fields (including date)"}),
            400,
        )

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
        if is_faculty_free(fac_id, day, lec_no, target_date):
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
    target_date = data.get("date")  # Get date from frontend

    if not all(
        [day, class_name, sem, branch, lec_no is not None, faculty_id, target_date]
    ):
        return (
            jsonify({"success": False, "message": "Missing fields (including date)"}),
            400,
        )

    lec_no = int(lec_no)

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
    if not is_faculty_free(faculty_id, day, lec_no, target_date):
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
            "date": target_date,
            "day": day,
            "lec_no": lec_no,
            "assigned_to": f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}",
        }
    )

    # Get faculty name for confirmation message
    faculty_doc = db.faculty_timetable.find_one({"_id": faculty_id})
    faculty_name = faculty_doc.get("name", faculty_id) if faculty_doc else faculty_id

    # Format the date for display
    try:
        date_obj = datetime.fromisoformat(target_date)
        formatted_date = date_obj.strftime("%d/%m/%Y")
    except:
        formatted_date = target_date

    message = (
        f"@ {branch}_{class_name}\t"
        f"Change in Lecture\n\n"
        f"Date: {formatted_date}\n\n"
        f"Lecture no.: {lec_no+1}\n\n"
        f"Faculty: {faculty_id}\n\n"
        f"Location: Same as per timetable"
    )

    # Get faculty's personal Telegram chat ID
    faculty_chat_id = None
    if faculty_doc:
        faculty_chat_id = faculty_doc.get("telegram_chat_id")

    # Get Telegram Chat IDs for this class
    telegram_chat_ids = class_doc.get("telegram_chat_ids", [])

    # Handle both old and new formats
    if isinstance(telegram_chat_ids, str):
        telegram_chat_ids = [telegram_chat_ids] if telegram_chat_ids.strip() else []
    elif telegram_chat_ids is None:
        telegram_chat_ids = []

    notification_result = send_telegram_notifications(
        class_message=message,
        faculty_message=message,
        class_chat_ids=telegram_chat_ids,
        faculty_chat_id=faculty_chat_id,
        faculty_name=faculty_name,
    )

    return (
        jsonify(
            {
                "success": True,
                "assigned_faculty": faculty_id,
                "faculty_name": faculty_name,
                "message": (
                    f"@ {branch}_{class_name}\t"
                    f"Change in Lecture\n\n"
                    f"Date: {formatted_date}\n\n"
                    f"Lecture no.: {lec_no+1}\n\n"
                    f"Faculty: {faculty_id}\n\n"
                    f"Location: Same as per timetable"
                ),
            }
        ),
        200,
    )


# [Auto Replace]
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
    target_date = data.get("date")  # Get date from frontend

    if not all([day, class_name, sem, branch, lec_no is not None, target_date]):
        return (
            jsonify({"success": False, "message": "Missing fields (including date)"}),
            400,
        )

    lec_no = int(lec_no)

    class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )

    if not class_doc:
        return jsonify({"success": False, "message": "Class not found"}), 404

    assigned_faculty = None
    faculty_name = None

    for fac_id in class_doc.get("allowed_faculty", []):

        if not is_faculty_free(fac_id, day, lec_no, target_date):
            continue

        # ✅ STORE IN TEMP TIMETABLE (NOT PERMANENT)
        db.temp_faculty_timetable.insert_one(
            {
                "faculty_id": fac_id,
                "date": target_date,
                "day": day,
                "lec_no": lec_no,
                "assigned_to": f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}",
            }
        )

        # Get faculty name for confirmation message
        faculty_doc = db.faculty_timetable.find_one({"_id": fac_id})
        faculty_name = faculty_doc.get("name", fac_id) if faculty_doc else fac_id
        assigned_faculty = fac_id

        # Format the date for display
        try:
            date_obj = datetime.fromisoformat(target_date)
            formatted_date = date_obj.strftime("%d/%m/%Y")
        except:
            formatted_date = target_date

        message = (
            f"@ {branch}_{class_name}\t\n"
            f"Change in Lecture\n\n"
            f"Date: {formatted_date}\n\n"
            f"Lecture no.: {lec_no+1}\n\n"
            f"Faculty: {assign_faculty}\n\n"
            f"Location: Same as per timetable"
        )

        # Get faculty's personal Telegram chat ID
        faculty_chat_id = None
        if faculty_doc:
            faculty_chat_id = faculty_doc.get("telegram_chat_id")

        # Get Telegram Chat IDs for this class
        telegram_chat_ids = class_doc.get("telegram_chat_ids", [])

        # Handle both old and new formats
        if isinstance(telegram_chat_ids, str):
            telegram_chat_ids = [telegram_chat_ids] if telegram_chat_ids.strip() else []
        elif telegram_chat_ids is None:
            telegram_chat_ids = []

        notification_result = send_telegram_notifications(
            class_message=message,
            faculty_message=message,
            class_chat_ids=telegram_chat_ids,
            faculty_chat_id=faculty_chat_id,
            faculty_name=faculty_name,
        )

        # # Send message to ALL Telegram Chat IDs
        # if telegram_chat_ids:
        #     for chat_id in telegram_chat_ids:
        #         if chat_id.strip():  # Only send if chat_id is not empty
        #             try:
        #                 send_telegram_message(message, chat_id.strip())
        #                 print(f"Message sent to chat_id: {chat_id}")
        #             except Exception as e:
        #                 print(f"Failed to send to chat_id {chat_id}: {e}")
        # else:
        #     print("No Telegram Chat IDs configured for this class")

        return (
            jsonify(
                {
                    "success": True,
                    "assigned_faculty": fac_id,
                    "faculty_name": faculty_name,
                    "telegram_chat_ids": telegram_chat_ids,
                    "message": message,
                    "sent_to": len(telegram_chat_ids) if telegram_chat_ids else 0,
                }
            ),
            200,
        )

    return jsonify({"success": False, "message": "No faculty free"}), 409

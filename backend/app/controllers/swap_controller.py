from flask import Blueprint, request, jsonify
from app.database.mongo import db
from datetime import datetime
from app.utils.telegram_messanger import send_telegram_message
from bson import ObjectId


# ===============================
# =         CONSTANTS           =
# ===============================
DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
DAYS_MAP = {
    "Monday": "mon",
    "Tuesday": "tue",
    "Wednesday": "wed",
    "Thursday": "thu",
    "Friday": "fri",
    "Saturday": "sat",
}

TOTAL_SLOTS = 5
TIME_SLOT_KEYS = [
    "Time Slot 1",
    "Time Slot 2",
    "Time Slot 3",
    "Time Slot 4",
    "Time Slot 5"
]


# ===============================
# =          HELPERS            =
# ===============================

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
    # 1. Check temp timetable FIRST
    temp = db.temp_faculty_timetable.find_one(
        {"faculty_id": fac_id, "date": target_date, "day": day, "lec_no": lec_no}
    )
    if temp:
        return False

    # 2. Check permanent timetable
    faculty_doc = db.faculty_timetable.find_one({"_id": fac_id})
    if not faculty_doc:
        return False

    timetable = faculty_doc.get("timetable", {})
    return (
        day in timetable
        and 0 <= lec_no < len(timetable[day])
        and timetable[day][lec_no] == "free"
    )

def get_faculty_info(fac_id):
    faculty = db.faculty_timetable.find_one({"_id": fac_id})

    if not faculty:
        return fac_id, None  # faculty not found

    name = faculty.get("name", fac_id)
    telegram_chat_id = faculty.get("telegram_chat_id")  # could be None
    return name, telegram_chat_id


def assign_temp(fac_id, day, lec_no, assignment, selected_date):
    db.temp_faculty_timetable.insert_one(
        {
            "faculty_id": fac_id,
            "date": selected_date,
            "day": day,
            "lec_no": lec_no,
            "assigned_to": assignment,
        }
    )

def replace_lecture_helper(selected_date, day, class_name, sem, branch, lec_no):
    class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )

    if not class_doc:
        return {"success": False}

    for fac_id in class_doc.get("allowed_faculty", []):
        if is_faculty_free(fac_id, day, lec_no, selected_date):
            return {"success": True, "assigned_faculty": fac_id}

    return {"success": False}

def extract_subject_code_from_assignment(assignment):
    """Extract subject code from assignment string like 'CSE(AIML)-D1-Sem6-Time Slot 1-CS601-101'"""
    if not assignment or assignment == "free":
        return None
    
    parts = assignment.split("-")
    if len(parts) >= 5:
        # Subject code is the second-to-last element
        return parts[-2]
    return None

def get_subject_info_from_code(subject_code):
    """Get subject info (name, slug) from subjects collection using subject code (_id)"""
    if not subject_code:
        return {"name": "Subject Not Found", "slug": "N/A"}
    
    subject_doc = db.subjects.find_one({"_id": subject_code})
    if subject_doc:
        return {
            "name": subject_doc.get("name", subject_code),
            "slug": subject_doc.get("slug", subject_code[:6])  # Use slug if exists, otherwise use first 6 chars of code
        }
    return {"name": subject_code, "slug": subject_code[:6] if len(subject_code) > 6 else subject_code}

def get_room_number_from_assignment(assignment):
    """Extract room number from assignment string"""
    if not assignment or assignment == "free":
        return "Room Not Specified"
    
    parts = assignment.split("-")
    if len(parts) >= 6:
        # Room is the last element
        return parts[-1]
    return "Room Not Specified"

def get_subject_code_for_class(class_name, sem, branch, day, lec_no, faculty_id=None):
    """Get subject code for a class from faculty timetable"""
    if faculty_id:
        # Try to get from specific faculty's timetable first
        faculty_doc = db.faculty_timetable.find_one({"_id": faculty_id})
        if faculty_doc:
            timetable = faculty_doc.get("timetable", {})
            if day in timetable and lec_no < len(timetable[day]):
                slot = timetable[day][lec_no]
                if slot != "free":
                    subject_code = extract_subject_code_from_assignment(slot)
                    if subject_code:
                        return subject_code
    
    # If not found, try to find from any faculty teaching this class
    class_assignment = f"{branch}-{class_name}-Sem{sem}"
    
    # Search in faculty timetables for matching assignment
    faculty_cursor = db.faculty_timetable.find({})
    for faculty in faculty_cursor:
        timetable = faculty.get("timetable", {})
        if day in timetable and lec_no < len(timetable[day]):
            slot = timetable[day][lec_no]
            if slot != "free" and class_assignment in slot:
                subject_code = extract_subject_code_from_assignment(slot)
                if subject_code:
                    return subject_code
    
    return None


# ===============================
# =      MAIN CONTROLLER        =
# ===============================

# ----- / CREATE Functions /------


# POST: /api/assign-faculty/
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

    # Get subject code for this class from original timetable
    subject_code = get_subject_code_for_class(class_name, sem, branch, day, lec_no, faculty_id)
    
    # Get subject info (name and slug) from subjects collection
    subject_info = get_subject_info_from_code(subject_code) if subject_code else {"name": "Subject Not Found", "slug": "N/A"}
    subject_slug = subject_info["slug"]
    
    # Get room number (default to 101 if not found)
    room = get_room_number_from_assignment(f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}-{subject_code if subject_code else 'UNKNOWN'}-101")
    
    # STORE IN TEMP TIMETABLE with subject code and room
    assignment = f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}-{subject_code if subject_code else 'UNKNOWN'}-{room}"
    db.temp_faculty_timetable.insert_one(
        {
            "faculty_id": faculty_id,
            "date": target_date,
            "day": day,
            "lec_no": lec_no,
            "assigned_to": assignment,
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
        f"Subject: {subject_slug}\n\n"  # Show subject slug instead of full name
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
                "subject_code": subject_code,
                "subject_name": subject_info["name"],
                "subject_slug": subject_slug,
                "room": room,
                "assignment": assignment,
                "message": message,
            }
        ),
        200,
    )
    
# [Auto Replace]
# POST,OPTIONS: /api/replace-lecture/
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

        # Get subject code for this class from original timetable
        subject_code = get_subject_code_for_class(class_name, sem, branch, day, lec_no, fac_id)
        
        # Get subject info (name and slug) from subjects collection
        subject_info = get_subject_info_from_code(subject_code) if subject_code else {"name": "Subject Not Found", "slug": "N/A"}
        subject_slug = subject_info["slug"]
        
        # Get room number (default to 101 if not found)
        room = get_room_number_from_assignment(f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}-{subject_code if subject_code else 'UNKNOWN'}-101")
        
        # STORE IN TEMP TIMETABLE (NOT PERMANENT) with subject code and room
        assignment = f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}-{subject_code if subject_code else 'UNKNOWN'}-{room}"
        db.temp_faculty_timetable.insert_one(
            {
                "faculty_id": fac_id,
                "date": target_date,
                "day": day,
                "lec_no": lec_no,
                "assigned_to": assignment,
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
            f"Subject: {subject_slug}\n\n"  # Show subject slug instead of full name
            f"Faculty: {fac_id}\n\n"
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
                    "assigned_faculty": fac_id,
                    "faculty_name": faculty_name,
                    "subject_code": subject_code,
                    "subject_name": subject_info["name"],
                    "subject_slug": subject_slug,
                    "room": room,
                    "assignment": assignment,
                    "telegram_chat_ids": telegram_chat_ids,
                    "message": message,
                    "sent_to": len(telegram_chat_ids) if telegram_chat_ids else 0,
                }
            ),
            200,
        )

    return jsonify({"success": False, "message": "No faculty free"}), 409

# POST,OPTIONS: /api/execute-rearrange/
def execute_rearrange():
    """Execute a selected rearrangement option on a specific date"""
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    # Extract fields
    selected_date = data.get("date")
    day = data.get("day")
    class_name = data.get("class")
    sem = data.get("sem")
    branch = data.get("branch")
    lec_no = data.get("lec_no")
    primary_faculty_id = data.get("primary_faculty_id")
    secondary_faculty_id = data.get("secondary_faculty_id")

    if not all(
        [
            selected_date,
            day,
            class_name,
            sem,
            branch,
            lec_no is not None,
            primary_faculty_id,
            secondary_faculty_id,
        ]
    ):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        lec_no = int(lec_no)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "lec_no must be an integer"}), 400

    # Get primary faculty's current assignment
    fac_doc = db.faculty_timetable.find_one({"_id": primary_faculty_id})
    if not fac_doc:
        return (
            jsonify({"success": False, "message": "Primary faculty not found"}),
            404,
        )

    timetable = fac_doc.get("timetable", {})
    if day not in timetable or lec_no >= len(timetable[day]):
        return (
            jsonify({"success": False, "message": "Invalid time slot"}),
            400,
        )

    current_slot = timetable[day][lec_no]
    if current_slot == "free":
        return (
            jsonify({"success": False, "message": "Primary faculty is already free"}),
            409,
        )

    # Parse current slot to get occupied class details
    try:
        parts = current_slot.split("-")
        occupied_branch = parts[0]
        occupied_class = parts[1]
        occupied_sem = int(parts[2].replace("Sem", ""))
        time_slot_str = parts[3]  # "Time Slot X"
        occupied_subject_code = extract_subject_code_from_assignment(current_slot)
        occupied_room = get_room_number_from_assignment(current_slot)
    except Exception as e:
        return (
            jsonify(
                {"success": False, "message": "Could not parse current assignment"}
            ),
            400,
        )

    # Get subject info for occupied class
    occupied_subject_info = get_subject_info_from_code(occupied_subject_code) if occupied_subject_code else {"name": "Subject Not Found", "slug": "N/A"}
    occupied_subject_slug = occupied_subject_info["slug"]

    # Verify secondary faculty is free
    if not is_faculty_free(secondary_faculty_id, day, lec_no, selected_date):
        return (
            jsonify(
                {
                    "success": False,
                    "message": "Secondary faculty is no longer available",
                }
            ),
            409,
        )

    # Get subject code for target class
    target_subject_code = get_subject_code_for_class(class_name, sem, branch, day, lec_no, primary_faculty_id)
    
    # Get subject info for target class
    target_subject_info = get_subject_info_from_code(target_subject_code) if target_subject_code else {"name": "Subject Not Found", "slug": "N/A"}
    target_subject_slug = target_subject_info["slug"]
    
    # Execute the swap
    # 1. Assign the occupied class to secondary faculty with full details
    assign_temp(secondary_faculty_id, day, lec_no, current_slot, selected_date)

    # 2. Assign the target class to primary faculty with full details
    target_assignment = f"{branch}-{class_name}-Sem{sem}-{time_slot_str}-{target_subject_code if target_subject_code else 'UNKNOWN'}-{occupied_room}"
    assign_temp(primary_faculty_id, day, lec_no, target_assignment, selected_date)

    # Get faculty names and chat IDs
    primary_fac_name, primary_chat_id = get_faculty_info(primary_faculty_id)
    secondary_fac_name, secondary_chat_id = get_faculty_info(secondary_faculty_id)
    
    # Create separate messages for both affected classes
    target_class_message = (
        f"@ {branch}_{class_name}\t"
        f"Change in Lecture\n\n"
        f"Date: {selected_date}\n\n"
        f"Lecture no.: {lec_no+1}\n\n"
        f"Subject: {target_subject_slug}\n\n"  # Show subject slug instead of full name
        f"Faculty: {primary_faculty_id}\n\n"
        f"Location: Same as per timetable"
    )

    occupied_class_message = (
        f"@ {occupied_branch}_{occupied_class}\t"
        f"Change in Lecture\n\n"
        f"Date: {selected_date}\n\n"
        f"Lecture no.: {lec_no+1}\n\n"
        f"Subject: {occupied_subject_slug}\n\n"  # Show subject slug instead of full name
        f"Faculty: {secondary_faculty_id}\n\n"
        f"Location: Same as per timetable"
    )

    # Get Telegram Chat IDs for TARGET class
    target_class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )
    target_telegram_chat_ids = []
    if target_class_doc:
        target_telegram_chat_ids = target_class_doc.get("telegram_chat_ids", [])
        # Handle both old and new formats
        if isinstance(target_telegram_chat_ids, str):
            target_telegram_chat_ids = (
                [target_telegram_chat_ids] if target_telegram_chat_ids.strip() else []
            )
        elif target_telegram_chat_ids is None:
            target_telegram_chat_ids = []

    # Get Telegram Chat IDs for OCCUPIED class
    occupied_class_doc = db.classwise_faculty.find_one(
        {"class": occupied_class, "sem": occupied_sem, "branch": occupied_branch}
    )
    occupied_telegram_chat_ids = []
    if occupied_class_doc:
        occupied_telegram_chat_ids = occupied_class_doc.get("telegram_chat_ids", [])
        # Handle both old and new formats
        if isinstance(occupied_telegram_chat_ids, str):
            occupied_telegram_chat_ids = (
                [occupied_telegram_chat_ids]
                if occupied_telegram_chat_ids.strip()
                else []
            )
        elif occupied_telegram_chat_ids is None:
            occupied_telegram_chat_ids = []

    # Send notifications for TARGET class
    target_notification_result = send_telegram_notifications(
        class_message=target_class_message,
        faculty_message=target_class_message,
        class_chat_ids=target_telegram_chat_ids,
        faculty_chat_id=primary_chat_id,
        faculty_name=primary_fac_name,
    )

    # Send notifications for OCCUPIED class
    occupied_notification_result = send_telegram_notifications(
        class_message=occupied_class_message,
        faculty_message=occupied_class_message,
        class_chat_ids=occupied_telegram_chat_ids,
        faculty_chat_id=secondary_chat_id,
        faculty_name=secondary_fac_name,
    )

    return (
        jsonify(
            {
                "success": True,
                "assigned_faculty": primary_faculty_id,
                "faculty_name": primary_fac_name,
                "secondary_faculty_id": secondary_faculty_id,
                "secondary_faculty_name": secondary_fac_name,
                "target_subject_code": target_subject_code,
                "target_subject_name": target_subject_info["name"],
                "target_subject_slug": target_subject_slug,
                "occupied_subject_code": occupied_subject_code,
                "occupied_subject_name": occupied_subject_info["name"],
                "occupied_subject_slug": occupied_subject_slug,
                "target_assignment": target_assignment,
                "occupied_assignment": current_slot,
                "type": "rearranged",
                "affected_classes": [
                    {
                        "branch": branch,
                        "class": class_name,
                        "sem": sem,
                        "subject_code": target_subject_code,
                        "subject_name": target_subject_info["name"],
                        "subject_slug": target_subject_slug,
                        "assignment": target_assignment,
                        "message": target_class_message,
                        "new_faculty": primary_fac_name,
                        "previous_faculty": secondary_fac_name,
                        "notification_result": target_notification_result,
                    },
                    {
                        "branch": occupied_branch,
                        "class": occupied_class,
                        "sem": occupied_sem,
                        "subject_code": occupied_subject_code,
                        "subject_name": occupied_subject_info["name"],
                        "subject_slug": occupied_subject_slug,
                        "assignment": current_slot,
                        "message": occupied_class_message,
                        "new_faculty": secondary_fac_name,
                        "previous_faculty": primary_fac_name,
                        "notification_result": occupied_notification_result,
                    },
                ],
                "message": "Rearrangement successful for both classes",
                "detailed_message": target_class_message,  # Keep for backward compatibility
                "notification_results": {
                    "target_class": target_notification_result,
                    "occupied_class": occupied_notification_result,
                },
            }
        ),
        200,
    )

# [Auto rearrange]
# POST,OPTIONS: /api/rearrange-lecture/
def rearrange_lecture():
    """Original auto-rearrange endpoint (kept for backward compatibility)"""
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    # Extract fields
    selected_date = data.get("date")
    day = data.get("day")
    class_name = data.get("class")
    sem = data.get("sem")
    branch = data.get("branch")
    lec_no = data.get("lec_no")

    if not all([selected_date, day, class_name, sem, branch, lec_no is not None]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        lec_no = int(lec_no)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "lec_no must be an integer"}), 400

    # 1. FIRST TRY — Normal replace
    first_try = replace_lecture_helper(
        selected_date, day, class_name, sem, branch, lec_no
    )

    if first_try["success"]:
        # Assign the lecture
        fac_id = first_try["assigned_faculty"]
        # Get subject code for this class
        subject_code = get_subject_code_for_class(class_name, sem, branch, day, lec_no, fac_id)
        
        # Get subject info (name and slug) from subjects collection
        subject_info = get_subject_info_from_code(subject_code) if subject_code else {"name": "Subject Not Found", "slug": "N/A"}
        subject_slug = subject_info["slug"]
        
        room = get_room_number_from_assignment(f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}-{subject_code if subject_code else 'UNKNOWN'}-101")
        
        assignment = f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}-{subject_code if subject_code else 'UNKNOWN'}-{room}"
        assign_temp(
            fac_id,
            day,
            lec_no,
            assignment,
            selected_date,
        )

        fac_name, fac_chat_id = get_faculty_info(fac_id)
        
        message = (
            f"@ {branch}_{class_name}\t"
            f"Change in Lecture\n\n"
            f"Date: {selected_date}\n\n"
            f"Lecture no.: {lec_no+1}\n\n"
            f"Subject: {subject_slug}\n\n"  # Show subject slug instead of full name
            f"Faculty: {fac_id}\n\n"
            f"Location: Same as per timetable"
        )

        # Get Telegram Chat IDs for target class
        target_class_doc = db.classwise_faculty.find_one(
            {"class": class_name, "sem": sem, "branch": branch}
        )

        target_telegram_chat_ids = []
        if target_class_doc:
            target_telegram_chat_ids = target_class_doc.get("telegram_chat_ids", [])
            # Handle both old and new formats
            if isinstance(target_telegram_chat_ids, str):
                target_telegram_chat_ids = (
                    [target_telegram_chat_ids]
                    if target_telegram_chat_ids.strip()
                    else []
                )
            elif target_telegram_chat_ids is None:
                target_telegram_chat_ids = []

        # Send notifications for target class only
        notification_result = send_telegram_notifications(
            class_message=message,
            faculty_message=message,
            class_chat_ids=target_telegram_chat_ids,
            faculty_chat_id=fac_chat_id,
            faculty_name=fac_name,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "assigned_faculty": fac_id,
                    "faculty_name": fac_name,
                    "subject_code": subject_code,
                    "subject_name": subject_info["name"],
                    "subject_slug": subject_slug,
                    "room": room,
                    "assignment": assignment,
                    "type": "direct",
                    "message": message,
                    "notification_result": notification_result,
                }
            ),
            200,
        )

    # 2. SECOND TRY — Auto rearrangement (first available option)
    class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )

    if not class_doc:
        return (
            jsonify({"success": False, "message": "Class configuration not found"}),
            404,
        )

    allowed_faculty = class_doc.get("allowed_faculty", [])

    for fac_id in allowed_faculty:
        fac_doc = db.faculty_timetable.find_one({"_id": fac_id})
        if not fac_doc:
            continue

        timetable = fac_doc.get("timetable", {})
        if day not in timetable or lec_no >= len(timetable[day]):
            continue

        current_slot = timetable[day][lec_no]
        if current_slot == "free":
            continue

        try:
            parts = current_slot.split("-")
            occupied_branch = parts[0]
            occupied_class = parts[1]
            occupied_sem = int(parts[2].replace("Sem", ""))
            occupied_subject_code = extract_subject_code_from_assignment(current_slot)
            occupied_room = get_room_number_from_assignment(current_slot)
        except Exception:
            continue

        reassign_attempt = replace_lecture_helper(
            selected_date, day, occupied_class, occupied_sem, occupied_branch, lec_no
        )

        if not reassign_attempt["success"]:
            continue

        new_fac = reassign_attempt["assigned_faculty"]

        # Get subject code for target class
        target_subject_code = get_subject_code_for_class(class_name, sem, branch, day, lec_no, fac_id)
        
        # Get subject info for target class
        target_subject_info = get_subject_info_from_code(target_subject_code) if target_subject_code else {"name": "Subject Not Found", "slug": "N/A"}
        target_subject_slug = target_subject_info["slug"]
        
        # Get subject info for occupied class
        occupied_subject_info = get_subject_info_from_code(occupied_subject_code) if occupied_subject_code else {"name": "Subject Not Found", "slug": "N/A"}
        occupied_subject_slug = occupied_subject_info["slug"]

        # Execute the swap
        assign_temp(new_fac, day, lec_no, current_slot, selected_date)
        target_assignment = f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}-{target_subject_code if target_subject_code else 'UNKNOWN'}-{occupied_room}"
        assign_temp(
            fac_id,
            day,
            lec_no,
            target_assignment,
            selected_date,
        )

        # Get faculty names and chat IDs
        primary_fac_name, primary_chat_id = get_faculty_info(fac_id)
        secondary_fac_name, secondary_chat_id = get_faculty_info(new_fac)

        # Create separate messages for both affected classes
        target_class_message = (
            f"@ {branch}_{class_name}\t"
            f"Change in Lecture\n\n"
            f"Date: {selected_date}\n\n"
            f"Lecture no.: {lec_no+1}\n\n"
            f"Subject: {target_subject_slug}\n\n"  # Show subject slug instead of full name
            f"Faculty: {fac_id}\n\n"
            f"Location: Same as per timetable"
        )

        occupied_class_message = (
            f"@ {occupied_branch}_{occupied_class}\t"
            f"Change in Lecture\n\n"
            f"Date: {selected_date}\n\n"
            f"Lecture no.: {lec_no+1}\n\n"
            f"Subject: {occupied_subject_slug}\n\n"  # Show subject slug instead of full name
            f"Faculty: {new_fac}\n\n"
            f"Location: Same as per timetable"
        )

        # Get Telegram Chat IDs for TARGET class
        target_class_doc = db.classwise_faculty.find_one(
            {"class": class_name, "sem": sem, "branch": branch}
        )
        target_telegram_chat_ids = []
        if target_class_doc:
            target_telegram_chat_ids = target_class_doc.get("telegram_chat_ids", [])
            # Handle both old and new formats
            if isinstance(target_telegram_chat_ids, str):
                target_telegram_chat_ids = (
                    [target_telegram_chat_ids]
                    if target_telegram_chat_ids.strip()
                    else []
                )
            elif target_telegram_chat_ids is None:
                target_telegram_chat_ids = []

        # Get Telegram Chat IDs for OCCUPIED class
        occupied_class_doc = db.classwise_faculty.find_one(
            {"class": occupied_class, "sem": occupied_sem, "branch": occupied_branch}
        )
        occupied_telegram_chat_ids = []
        if occupied_class_doc:
            occupied_telegram_chat_ids = occupied_class_doc.get("telegram_chat_ids", [])
            # Handle both old and new formats
            if isinstance(occupied_telegram_chat_ids, str):
                occupied_telegram_chat_ids = (
                    [occupied_telegram_chat_ids]
                    if occupied_telegram_chat_ids.strip()
                    else []
                )
            elif occupied_telegram_chat_ids is None:
                occupied_telegram_chat_ids = []

        # Send notifications for TARGET class
        target_notification_result = send_telegram_notifications(
            class_message=target_class_message,
            faculty_message=target_class_message,
            class_chat_ids=target_telegram_chat_ids,
            faculty_chat_id=primary_chat_id,
            faculty_name=primary_fac_name,
        )

        # Send notifications for OCCUPIED class
        occupied_notification_result = send_telegram_notifications(
            class_message=occupied_class_message,
            faculty_message=occupied_class_message,
            class_chat_ids=occupied_telegram_chat_ids,
            faculty_chat_id=secondary_chat_id,
            faculty_name=secondary_fac_name,
        )

        return (
            jsonify(
                {
                    "success": True,
                    "assigned_faculty": fac_id,
                    "faculty_name": primary_fac_name,
                    "secondary_faculty_id": new_fac,
                    "secondary_faculty_name": secondary_fac_name,
                    "target_subject_code": target_subject_code,
                    "target_subject_name": target_subject_info["name"],
                    "target_subject_slug": target_subject_slug,
                    "occupied_subject_code": occupied_subject_code,
                    "occupied_subject_name": occupied_subject_info["name"],
                    "occupied_subject_slug": occupied_subject_slug,
                    "target_assignment": target_assignment,
                    "occupied_assignment": current_slot,
                    "type": "rearranged",
                    "affected_classes": [
                        {
                            "branch": branch,
                            "class": class_name,
                            "sem": sem,
                            "subject_code": target_subject_code,
                            "subject_name": target_subject_info["name"],
                            "subject_slug": target_subject_slug,
                            "assignment": target_assignment,
                            "message": target_class_message,
                            "new_faculty": primary_fac_name,
                            "previous_faculty": secondary_fac_name,
                            "notification_result": target_notification_result,
                        },
                        {
                            "branch": occupied_branch,
                            "class": occupied_class,
                            "sem": occupied_sem,
                            "subject_code": occupied_subject_code,
                            "subject_name": occupied_subject_info["name"],
                            "subject_slug": occupied_subject_slug,
                            "assignment": current_slot,
                            "message": occupied_class_message,
                            "new_faculty": secondary_fac_name,
                            "previous_faculty": primary_fac_name,
                            "notification_result": occupied_notification_result,
                        },
                    ],
                    "message": "Rearrangement successful for both classes",
                    "detailed_message": target_class_message,  # Keep for backward compatibility
                    "notification_results": {
                        "target_class": target_notification_result,
                        "occupied_class": occupied_notification_result,
                    },
                }
            ),
            200,
        )

    return (
        jsonify(
            {
                "success": False,
                "message": "Rearrangement failed: no possible swap found",
            }
        ),
        409,
    )


# ----- / READ Functions /------


# POST: /api/get-available-faculty/
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
    
    
# POST: /api/get-rearrange-options/
def get_rearrange_options():
    """Get all possible rearrangement options for a lecture on a specific date"""
    if request.method == "OPTIONS":
        return "", 200

    data = request.get_json()

    # Extract fields
    selected_date = data.get("date")
    day = data.get("day")
    class_name = data.get("class")
    sem = data.get("sem")
    branch = data.get("branch")
    lec_no = data.get("lec_no")

    if not all([selected_date, day, class_name, sem, branch, lec_no is not None]):
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    try:
        lec_no = int(lec_no)
    except (TypeError, ValueError):
        return jsonify({"success": False, "message": "lec_no must be an integer"}), 400

    # Get allowed faculty for the target class
    class_doc = db.classwise_faculty.find_one(
        {"class": class_name, "sem": sem, "branch": branch}
    )

    if not class_doc:
        return (
            jsonify({"success": False, "message": "Class configuration not found"}),
            404,
        )

    allowed_faculty = class_doc.get("allowed_faculty", [])
    rearrange_options = []

    # Try to find all possible rearrangements
    for fac_id in allowed_faculty:
        fac_doc = db.faculty_timetable.find_one({"_id": fac_id})
        if not fac_doc:
            continue

        timetable = fac_doc.get("timetable", {})
        if day not in timetable or lec_no >= len(timetable[day]):
            continue

        current_slot = timetable[day][lec_no]
        if current_slot == "free":
            continue

        # Parse the current slot to extract class info
        # Format: "branch-class-SemX-Time Slot Y"
        try:
            parts = current_slot.split("-")
            occupied_branch = parts[0]
            occupied_class = parts[1]
            occupied_sem = int(parts[2].replace("Sem", ""))
        except Exception:
            continue

        # Try to find another faculty for the occupied class
        reassign_attempt = replace_lecture_helper(
            selected_date, day, occupied_class, occupied_sem, occupied_branch, lec_no
        )

        if not reassign_attempt["success"]:
            continue

        new_fac = reassign_attempt["assigned_faculty"]

        # Get faculty names
        primary_fac_name, primary_chat_id = get_faculty_info(fac_id)
        secondary_fac_name, secondary_chat_id = get_faculty_info(new_fac)

        # Extract subject codes and slugs
        occupied_subject_code = extract_subject_code_from_assignment(current_slot)
        occupied_subject_info = get_subject_info_from_code(occupied_subject_code) if occupied_subject_code else {"name": "Subject Not Found", "slug": "N/A"}
        occupied_subject_slug = occupied_subject_info["slug"]
        
        target_subject_code = get_subject_code_for_class(class_name, sem, branch, day, lec_no, fac_id)
        target_subject_info = get_subject_info_from_code(target_subject_code) if target_subject_code else {"name": "Subject Not Found", "slug": "N/A"}
        target_subject_slug = target_subject_info["slug"]

        # Create option object
        option = {
            "option_id": f"{fac_id}_{new_fac}",
            "primary_faculty": {
                "id": fac_id,
                "name": primary_fac_name,
                "current_class": f"{occupied_branch}-{occupied_class}-Sem{occupied_sem}",
                "current_subject_code": occupied_subject_code,
                "current_subject_name": occupied_subject_info["name"],
                "current_subject_slug": occupied_subject_slug,
                "new_class": f"{branch}-{class_name}-Sem{sem}",
                "new_subject_code": target_subject_code,
                "new_subject_name": target_subject_info["name"],
                "new_subject_slug": target_subject_slug,
            },
            "secondary_faculty": {
                "id": new_fac,
                "name": secondary_fac_name,
                "takes_over": f"{occupied_branch}-{occupied_class}-Sem{occupied_sem}",
                "takes_over_subject_code": occupied_subject_code,
                "takes_over_subject_name": occupied_subject_info["name"],
                "takes_over_subject_slug": occupied_subject_slug,
            },
            "description": f"{primary_fac_name} moves from {occupied_branch}-{occupied_class} ({occupied_subject_slug}) to {branch}-{class_name} ({target_subject_slug}), while {secondary_fac_name} takes over {occupied_branch}-{occupied_class} ({occupied_subject_slug})",
        }

        rearrange_options.append(option)

    if not rearrange_options:
        return (
            jsonify(
                {
                    "success": False,
                    "message": "No possible rearrangement options found",
                }
            ),
            409,
        )

    return (
        jsonify(
            {
                "success": True,
                "count": len(rearrange_options),
                "options": rearrange_options,
                "message": f"Found {len(rearrange_options)} possible rearrangement option(s)",
            }
        ),
        200,
    )

    
# GET: /api/fetch-all-changes/    
def fetch_all_changes():
    try:
        temp_col = db.temp_faculty_timetable

        
        # Initialize empty schedule
        schedule = {day: {slot: [] for slot in TIME_SLOT_KEYS} for day in DAYS}

        
        # Fetch all temp changes
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

            # Extract subject code from assignment
            subject_code = extract_subject_code_from_assignment(assigned_to)
            
            # Get subject info (name and slug) from subjects collection
            subject_info = get_subject_info_from_code(subject_code) if subject_code else {"name": "Subject Not Found", "slug": "N/A"}

            schedule[day_name][slot_key].append(
                {
                    "faculty": faculty_id,
                    "assigned_to": assigned_to,
                    "subject_code": subject_code,
                    "subject_name": subject_info["name"],
                    "subject_slug": subject_info["slug"],
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

    
    
# ----- / UPDATE Functions /------

# OPTIONAL: CREATE/UPDATE ALLOWED FACULTY
# @swap_bp.route("/update-allowed-faculty", methods=["GET"])
def update_allowed_faculty():
    """Create or update allowed faculty for a class"""
    try:
        data = request.get_json()
        
        sem = data.get("sem")
        branch = data.get("branch")
        class_name = data.get("class")
        allowed_faculty = data.get("allowed_faculty")
        
        # Validation
        if not sem or not branch or not class_name:
            return jsonify({"error": "Missing sem, branch, or class"}), 400
        
        if not isinstance(allowed_faculty, list):
            return jsonify({"error": "allowed_faculty must be an array"}), 400
        
        # Ensure at least one faculty is provided (could be empty for clearing)
        sem = int(sem)
        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"
        
        # Create/update document
        result = db.classwise_faculty.update_one(
            {"_id": class_id},
            {
                "$set": {
                    "_id": class_id,
                    "class": class_name,
                    "sem": sem,
                    "branch": branch,
                    "allowed_faculty": allowed_faculty
                }
            },
            upsert=True
        )
        
        if result.upserted_id:
            message = "Allowed faculty created successfully"
        else:
            message = "Allowed faculty updated successfully"
        
        return jsonify({
            "success": True,
            "message": message,
            "data": {
                "_id": class_id,
                "class": class_name,
                "sem": sem,
                "branch": branch,
                "allowed_faculty": allowed_faculty
            }
        }), 200
        
    except ValueError as ve:
        return jsonify({"error": "Invalid semester value"}), 400
    except Exception as e:
        print("ERROR in update_allowed_faculty:", e)
        return jsonify({"error": "Internal server error", "details": str(e)}), 500



   

# ----- / DELETE Functions /------

# DELETE: /api/delete-temp-changes/
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

    
# OPTIONAL: DELETE ALLOWED FACULTY

# @swap_bp.route("/delete-allowed-faculty", methods=["DELETE"])
def delete_allowed_faculty():
    """Delete allowed faculty for a class"""
    try:
        data = request.get_json()
        
        sem = data.get("sem")
        branch = data.get("branch")
        class_name = data.get("class")
        
        # Validation
        if not sem or not branch or not class_name:
            return jsonify({"error": "Missing sem, branch, or class"}), 400
        
        sem = int(sem)
        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"
        
        # Delete document
        result = db.classwise_faculty.delete_one({"_id": class_id})
        
        if result.deleted_count == 0:
            return jsonify({"error": "Class faculty data not found"}), 404
        
        return jsonify({
            "success": True,
            "message": "Allowed faculty deleted successfully"
        }), 200
        
    except ValueError as ve:
        return jsonify({"error": "Invalid semester value"}), 400
    except Exception as e:
        print("ERROR in delete_allowed_faculty:", e)
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
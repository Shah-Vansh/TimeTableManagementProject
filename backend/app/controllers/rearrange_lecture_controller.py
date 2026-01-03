from flask import Blueprint, request, jsonify
from app.database.mongo import db
from datetime import date
from app.utils.telegram_messanger import send_telegram_message

rearrange_lecture_bp = Blueprint("rearrange_lecture", __name__)


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


def is_faculty_free(fac_id, day, lec_no, selected_date):
    # 1️⃣ Temp timetable check (highest priority) for specific date
    if db.temp_faculty_timetable.find_one(
        {"faculty_id": fac_id, "date": selected_date, "day": day, "lec_no": lec_no}
    ):
        return False

    # 2️⃣ Permanent timetable (for recurring schedule)
    fac_doc = db.faculty_timetable.find_one({"_id": fac_id})
    if not fac_doc:
        return False

    timetable = fac_doc.get("timetable", {})
    return (
        day in timetable
        and 0 <= lec_no < len(timetable[day])
        and timetable[day][lec_no] == "free"
    )


from bson import ObjectId


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


@rearrange_lecture_bp.route("/get-rearrange-options", methods=["POST", "OPTIONS"])
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

        # Create option object
        option = {
            "option_id": f"{fac_id}_{new_fac}",
            "primary_faculty": {
                "id": fac_id,
                "name": primary_fac_name,
                "current_class": f"{occupied_branch}-{occupied_class}-Sem{occupied_sem}",
                "new_class": f"{branch}-{class_name}-Sem{sem}",
            },
            "secondary_faculty": {
                "id": new_fac,
                "name": secondary_fac_name,
                "takes_over": f"{occupied_branch}-{occupied_class}-Sem{occupied_sem}",
            },
            "description": f"{primary_fac_name} moves from {occupied_branch}-{occupied_class} to {branch}-{class_name}, while {secondary_fac_name} takes over {occupied_branch}-{occupied_class}",
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


@rearrange_lecture_bp.route("/execute-rearrange", methods=["POST", "OPTIONS"])
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
    except Exception:
        return (
            jsonify(
                {"success": False, "message": "Could not parse current assignment"}
            ),
            400,
        )

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

    # Execute the swap
    # 1. Assign the occupied class to secondary faculty
    assign_temp(secondary_faculty_id, day, lec_no, current_slot, selected_date)

    # 2. Assign the target class to primary faculty
    target_assignment = f"{branch}-{class_name}-Sem{sem}-{time_slot_str}"
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
        f"Faculty: {primary_faculty_id}\n\n"
        f"Location: Same as per timetable"
    )

    occupied_class_message = (
        f"@ {occupied_branch}_{occupied_class}\t"
        f"Change in Lecture\n\n"
        f"Date: {selected_date}\n\n"
        f"Lecture no.: {lec_no+1}\n\n"
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
                "type": "rearranged",
                "affected_classes": [
                    {
                        "branch": branch,
                        "class": class_name,
                        "sem": sem,
                        "message": target_class_message,
                        "new_faculty": primary_fac_name,
                        "previous_faculty": secondary_fac_name,
                        "notification_result": target_notification_result,
                    },
                    {
                        "branch": occupied_branch,
                        "class": occupied_class,
                        "sem": occupied_sem,
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
@rearrange_lecture_bp.route("/rearrange-lecture", methods=["POST", "OPTIONS"])
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

    # 1️⃣ FIRST TRY — Normal replace
    first_try = replace_lecture_helper(
        selected_date, day, class_name, sem, branch, lec_no
    )

    if first_try["success"]:
        # Assign the lecture
        fac_id = first_try["assigned_faculty"]
        assign_temp(
            fac_id,
            day,
            lec_no,
            f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}",
            selected_date,
        )

        fac_name, fac_chat_id = get_faculty_info(fac_id)

        message = (
            f"@ {branch}_{class_name}\t"
            f"Change in Lecture\n\n"
            f"Date: {selected_date}\n\n"
            f"Lecture no.: {lec_no+1}\n\n"
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
                    "type": "direct",
                    "message": message,
                    "notification_result": notification_result,
                }
            ),
            200,
        )

    # 2️⃣ SECOND TRY — Auto rearrangement (first available option)
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
        except Exception:
            continue

        reassign_attempt = replace_lecture_helper(
            selected_date, day, occupied_class, occupied_sem, occupied_branch, lec_no
        )

        if not reassign_attempt["success"]:
            continue

        new_fac = reassign_attempt["assigned_faculty"]

        # Execute the swap
        assign_temp(new_fac, day, lec_no, current_slot, selected_date)
        assign_temp(
            fac_id,
            day,
            lec_no,
            f"{branch}-{class_name}-Sem{sem}-Time Slot {lec_no+1}",
            selected_date,
        )

        # Get faculty names and chat IDs
        primary_fac_name, primary_chat_id = get_faculty_info(fac_id)
        secondary_fac_name, secondary_chat_id = get_faculty_info(new_fac)

        print(primary_chat_id)
        print(secondary_chat_id)
        # Create separate messages for both affected classes
        target_class_message = (
            f"@ {branch}_{class_name}\t"
            f"Change in Lecture\n\n"
            f"Date: {selected_date}\n\n"
            f"Lecture no.: {lec_no+1}\n\n"
            f"Faculty: {fac_id}\n\n"
            f"Location: Same as per timetable"
        )

        occupied_class_message = (
            f"@ {occupied_branch}_{occupied_class}\t"
            f"Change in Lecture\n\n"
            f"Date: {selected_date}\n\n"
            f"Lecture no.: {lec_no+1}\n\n"
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
                    "type": "rearranged",
                    "affected_classes": [
                        {
                            "branch": branch,
                            "class": class_name,
                            "sem": sem,
                            "message": target_class_message,
                            "new_faculty": primary_fac_name,
                            "previous_faculty": secondary_fac_name,
                            "notification_result": target_notification_result,
                        },
                        {
                            "branch": occupied_branch,
                            "class": occupied_class,
                            "sem": occupied_sem,
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

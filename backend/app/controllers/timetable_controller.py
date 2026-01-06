import json
from flask import request, jsonify
from collections import defaultdict
from app.database.mongo import db
from datetime import datetime

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
    "Saturday": "sat"
}

ALLOWED_BRANCHES = ["CSE", "CSE(AIML)", "DS"]

TIME_SLOT_INDEX = {
    "Time Slot 1": 0,
    "Time Slot 2": 1,
    "Time Slot 3": 2,
    "Time Slot 4": 3,
    "Time Slot 5": 4
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
def normalize_day_slots(day_list, total_slots=TOTAL_SLOTS):
    """
    Ensures a day timetable always has fixed length.
    Pads with 'free' or trims safely.
    """
    if not isinstance(day_list, list):
        return ["free"] * total_slots

    if len(day_list) < total_slots:
        return day_list + ["free"] * (total_slots - len(day_list))

    return day_list[:total_slots]


def normalize_faculty_slots(day_list):
    """Ensure each day's timetable has exactly TOTAL_SLOTS slots."""
    if not isinstance(day_list, list):
        return ["free"] * TOTAL_SLOTS
    return (day_list + ["free"] * TOTAL_SLOTS)[:TOTAL_SLOTS]


# ===============================
# =      MAIN CONTROLLER        =
# ===============================

# ----- / CREATE Functions /------

# POST: /api/timetable/
def save_timetable():
    try:
        sem = request.form.get("sem")
        branch = request.form.get("branch")
        class_name = request.form.get("class")
        schedule_raw = request.form.get("schedule")

        
        # BASIC VALIDATION
        if not sem or not branch or not class_name or not schedule_raw:
            return jsonify({"error": "Missing sem, branch, class or schedule"}), 400

        if branch not in ALLOWED_BRANCHES:
            return jsonify({"error": "Invalid branch"}), 400

        sem = int(sem)
        if sem < 1 or sem > 8:
            return jsonify({"error": "Invalid semester"}), 400

        schedule = json.loads(schedule_raw)

        classwise_col = db.classwise_faculty
        faculty_tt_col = db.faculty_timetable

        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"

        
        # CHECK IF TIMETABLE EXISTS
        existing_class = classwise_col.find_one({"_id": class_id})
        is_new = existing_class is None

        
        # 1. GET OLD AND NEW FACULTY LISTS
        old_faculty = set(existing_class.get("allowed_faculty", [])) if existing_class else set()
        
        new_faculty = set()
        for day in schedule.values():
            for faculty in day.values():
                if faculty != "free":
                    new_faculty.add(faculty)

        # Faculty who are removed from this class (only relevant for edits)
        removed_faculty = old_faculty - new_faculty
        # Faculty who remain or are added
        active_faculty = new_faculty

        
        # 2. BUILD NEW FACULTY TABLES
        faculty_tables = defaultdict(lambda: {
            "mon": ["free"] * TOTAL_SLOTS,
            "tue": ["free"] * TOTAL_SLOTS,
            "wed": ["free"] * TOTAL_SLOTS,
            "thu": ["free"] * TOTAL_SLOTS,
            "fri": ["free"] * TOTAL_SLOTS,
            "sat": ["free"] * TOTAL_SLOTS,
        })

        for day_name, slots in schedule.items():
            day_key = DAYS_MAP.get(day_name)
            if not day_key or day_key == "sun":
                continue

            for time_slot, faculty in slots.items():
                if faculty == "free":
                    continue

                slot_index = TIME_SLOT_INDEX.get(time_slot)
                if slot_index is None:
                    continue

                faculty_tables[faculty][day_key][slot_index] = (
                    f"{branch}-{class_name}-Sem{sem}-{time_slot}"
                )

        
        # 3. REMOVE OLD LECTURES FOR REMOVED FACULTY (only for edits)
        if not is_new:
            for faculty_id in removed_faculty:
                existing = faculty_tt_col.find_one({"_id": faculty_id})
                if not existing:
                    continue

                existing_tt = existing.get("timetable", {})
                normalized_tt = {
                    "mon": normalize_day_slots(existing_tt.get("mon")),
                    "tue": normalize_day_slots(existing_tt.get("tue")),
                    "wed": normalize_day_slots(existing_tt.get("wed")),
                    "thu": normalize_day_slots(existing_tt.get("thu")),
                    "fri": normalize_day_slots(existing_tt.get("fri")),
                    "sat": normalize_day_slots(existing_tt.get("sat")),
                }

                # Remove lectures matching this class pattern
                class_pattern = f"{branch}-{class_name}-Sem{sem}-"
                
                for day in normalized_tt:
                    for i in range(TOTAL_SLOTS):
                        if normalized_tt[day][i].startswith(class_pattern):
                            normalized_tt[day][i] = "free"

                faculty_tt_col.update_one(
                    {"_id": faculty_id},
                    {"$set": {"timetable": normalized_tt}},
                    upsert=True
                )

        
        # 4. UPDATE ACTIVE FACULTY TIMETABLES
        for faculty_id in active_faculty:
            existing = faculty_tt_col.find_one({"_id": faculty_id}) or {}
            existing_tt = existing.get("timetable", {})

            normalized_tt = {
                "mon": normalize_day_slots(existing_tt.get("mon")),
                "tue": normalize_day_slots(existing_tt.get("tue")),
                "wed": normalize_day_slots(existing_tt.get("wed")),
                "thu": normalize_day_slots(existing_tt.get("thu")),
                "fri": normalize_day_slots(existing_tt.get("fri")),
                "sat": normalize_day_slots(existing_tt.get("sat")),
            }

            # For edits, remove old lectures for this class first
            if not is_new:
                class_pattern = f"{branch}-{class_name}-Sem{sem}-"
                
                for day in normalized_tt:
                    for i in range(TOTAL_SLOTS):
                        if normalized_tt[day][i].startswith(class_pattern):
                            normalized_tt[day][i] = "free"

            # Now check for conflicts with new schedule
            new_tt = faculty_tables[faculty_id]
            
            for day in new_tt:
                for i in range(TOTAL_SLOTS):
                    new_val = new_tt[day][i]
                    old_val = normalized_tt[day][i]

                    # ❌ conflict with OTHER classes
                    if new_val != "free" and old_val != "free":
                        return jsonify({
                            "error": "Faculty lecture conflict",
                            "faculty": faculty_id,
                            "day": day,
                            "time_slot": f"Time Slot {i + 1}",
                            "existing_lecture": old_val
                        }), 409

            # NO CONFLICT → MERGE NEW SCHEDULE
            for day in new_tt:
                for i in range(TOTAL_SLOTS):
                    if new_tt[day][i] != "free":
                        normalized_tt[day][i] = new_tt[day][i]

            faculty_tt_col.update_one(
                {"_id": faculty_id},
                {
                    "$set": {
                        "_id": faculty_id,
                        "timetable": normalized_tt
                    }
                },
                upsert=True
            )

        # CALCULATE AVG LECTURES PER DAY (INTEGER)
        total_lectures = 0
        total_days = 0

        for day_name in schedule:
            day_slots = schedule[day_name]
            lecture_count = sum(
                1 for val in day_slots.values() if val != "free"
            )
            total_lectures += lecture_count
            total_days += 1   # Mon–Sat always counted

        avg_lectures_per_day = (
            total_lectures // total_days
        ) if total_days > 0 else 0
        
        # 5. UPDATE/INSERT CLASSWISE FACULTY
        classwise_col.update_one(
            {"_id": class_id},
            {
                "$set": {
                    "sem": sem,
                    "branch": branch,
                    "class": class_name,
                    "allowed_faculty": list(new_faculty),
                    "avg_lectures_per_day": avg_lectures_per_day
                }
            },
            upsert=True
        )

        action = "created" if is_new else "updated"
        
        return jsonify({
            "message": f"Timetable {action} successfully",
            "class_id": class_id,
            "action": action,
            "faculty_updated": list(active_faculty),
            "faculty_removed": list(removed_faculty) if not is_new else []
        }), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500
    
    
# ----- / READ Functions /------

# GET: /api/timetable/fetchtimetable/   
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
    
    
    
# GET: /api/timetable/
def get_all_timetables():
    docs = db.classwise_faculty.find()

    result = []
    for d in docs:
        result.append({
            "_id": d["_id"],
            "sem": d["sem"],
            "branch": d["branch"],
            "class": d["class"],
            "allowed_faculty": d.get("allowed_faculty", []),
            "periods_per_day": 8,
            "avg_lectures": d.get("avg_lectures_per_day", 0),
            "status": "active",
            "createdBy": "Admin",
            "updatedAt": datetime.utcnow().isoformat(),
            "color": "blue"
        })

    return jsonify(result)   

# ----- / DELETE Functions /------

# DELETE: /api/timetable/
def delete_timetable():
    try:
        sem = request.form.get("sem")
        branch = request.form.get("branch")
        class_name = request.form.get("class")

        
        #  BASIC VALIDATION
        
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

        
        # CHECK IF TIMETABLE EXISTS
        
        class_doc = classwise_col.find_one({"_id": class_id})
        if not class_doc:
            return jsonify({"error": "Timetable not found"}), 404

        allowed_faculty = class_doc.get("allowed_faculty", [])
        lecture_prefix = f"{branch}-{class_name}-Sem{sem}-"

        
        # REMOVE LECTURES FROM FACULTY TIMETABLES
        
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

        
        # DELETE CLASSWISE FACULTY DOCUMENT
        
        classwise_col.delete_one({"_id": class_id})

        return jsonify({
            "message": "Timetable deleted successfully",
            "class_id": class_id,
            "faculty_updated": faculty_updated
        }), 200

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": "Internal server error"}), 500

# GET: /api/timetable/classwise-faculty  
def fetch_allowed_faculty():
    """Fetch allowed faculty for one or multiple classes"""
    try:
        sem = request.args.get("sem")
        branch = request.args.get("branch")
        class_name = request.args.get("class")  # Single class
        classes_param = request.args.get("classes")  # Multiple classes (comma-separated)
        
        # Check if we're fetching for single class or multiple classes
        if class_name:
            
            # SINGLE CLASS FETCH
            
            if not sem or not branch or not class_name:
                return jsonify({"error": "Missing sem, branch, or class"}), 400
            
            sem = int(sem)
            safe_branch = branch.lower().replace("(", "").replace(")", "")
            class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"
            
            # Fetch classwise faculty document
            classwise_doc = db.classwise_faculty.find_one({"_id": class_id})
            
            if not classwise_doc:
                # Return empty faculty list but not an error - class might not have faculty assigned yet
                return jsonify({
                    "_id": class_id,
                    "class": class_name,
                    "sem": sem,
                    "branch": branch,
                    "allowed_faculty": [],
                    "exists": False
                }), 200
            
            # Return the document
            return jsonify({
                "_id": classwise_doc["_id"],
                "class": classwise_doc["class"],
                "sem": classwise_doc["sem"],
                "branch": classwise_doc["branch"],
                "allowed_faculty": classwise_doc.get("allowed_faculty", []),
                "exists": True
            }), 200
            
        elif classes_param:
            
            # MULTIPLE CLASSES FETCH (BATCH)
            
            if not sem or not branch:
                return jsonify({"error": "Missing sem or branch"}), 400
            
            sem = int(sem)
            classes = [c.strip() for c in classes_param.split(",") if c.strip()]
            
            if not classes:
                return jsonify({"error": "No classes provided"}), 400
            
            safe_branch = branch.lower().replace("(", "").replace(")", "")
            
            # Create list of class IDs to fetch
            class_ids = [f"sem{sem}_{safe_branch}_{c.lower()}" for c in classes]
            
            # Fetch all classwise faculty documents
            classwise_docs = db.classwise_faculty.find({"_id": {"$in": class_ids}})
            
            # Create faculty map
            faculty_map = {}
            for doc in classwise_docs:
                original_class_name = doc["class"]
                faculty_map[original_class_name] = doc.get("allowed_faculty", [])
            
            # Ensure all requested classes are in the map (even if empty)
            for class_name in classes:
                if class_name not in faculty_map:
                    faculty_map[class_name] = []
            
            # Get all unique faculty across all classes
            all_faculty = set()
            for faculty_list in faculty_map.values():
                for faculty in faculty_list:
                    all_faculty.add(faculty)
            
            return jsonify({
                "success": True,
                "sem": sem,
                "branch": branch,
                "facultyMap": faculty_map,
                "uniqueFaculty": list(all_faculty),
                "totalClasses": len(classes),
                "classesWithFaculty": len([f for f in faculty_map.values() if f])
            }), 200
            
        else:
            
            # BRANCH-WIDE FETCH
            
            if not sem or not branch:
                return jsonify({"error": "Missing sem or branch"}), 400
            
            sem = int(sem)
            safe_branch = branch.lower().replace("(", "").replace(")", "")
            
            # Find all classes for this branch and semester
            # Query using regex to match the pattern
            regex_pattern = f"^sem{sem}_{safe_branch}_"
            classwise_docs = db.classwise_faculty.find({
                "_id": {"$regex": regex_pattern, "$options": "i"}
            })
            
            # Process results
            faculty_map = {}
            all_faculty = set()
            classes_list = []
            
            for doc in classwise_docs:
                class_name = doc["class"]
                allowed_faculty = doc.get("allowed_faculty", [])
                
                faculty_map[class_name] = allowed_faculty
                classes_list.append(class_name)
                
                for faculty in allowed_faculty:
                    all_faculty.add(faculty)
            
            return jsonify({
                "success": True,
                "sem": sem,
                "branch": branch,
                "facultyMap": faculty_map,
                "uniqueFaculty": list(all_faculty),
                "totalClasses": len(classes_list),
                "classes": classes_list,
                "classesWithFaculty": len([f for f in faculty_map.values() if f])
            }), 200
            
    except ValueError as ve:
        return jsonify({"error": "Invalid semester value"}), 400
    except Exception as e:
        print("ERROR in fetch_allowed_faculty:", e)
        return jsonify({"error": "Internal server error", "details": str(e)}), 500
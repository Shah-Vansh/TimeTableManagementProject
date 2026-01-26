from flask import request, jsonify
from collections import defaultdict
import random
from app.database.mongo import db

# Constants
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"]
TOTAL_SLOTS = 4  # Assuming 4 time slots per day
TIME_SLOTS = [f"Time Slot {i+1}" for i in range(TOTAL_SLOTS)]

def normalize_day_slots(day_data):
    """Ensure day has exactly TOTAL_SLOTS entries"""
    if not day_data:
        return ["free"] * TOTAL_SLOTS
    if len(day_data) < TOTAL_SLOTS:
        return day_data + ["free"] * (TOTAL_SLOTS - len(day_data))
    return day_data[:TOTAL_SLOTS]


class TimetableGenerator:
    def __init__(self, db):
        self.db = db
        self.faculty_tt_col = db.faculty_timetable
        self.classwise_col = db.classwise_faculty
        
    def get_faculty_availability(self, faculty_id):
        """Get faculty's current timetable"""
        faculty = self.faculty_tt_col.find_one({"_id": faculty_id})
        if not faculty or "timetable" not in faculty:
            return {day: ["free"] * TOTAL_SLOTS for day in DAYS}
        
        tt = faculty["timetable"]
        return {
            day: normalize_day_slots(tt.get(day, [])) for day in DAYS
        }
    
    def is_faculty_free(self, faculty_id, day, slot_index):
        """Check if faculty is free at given day/slot"""
        availability = self.get_faculty_availability(faculty_id)
        return availability[day][slot_index] == "free"
    
    def is_room_free(self, room, day, slot_index, occupied_rooms):
        """Check if room is free at given day/slot"""
        key = f"{day}_{slot_index}"
        return room not in occupied_rooms.get(key, set())
    
    def get_room_type(self, room):
        """Determine if room is class or lab"""
        return "lab" if "lab" in room.lower() else "class"
    
    def filter_rooms_by_type(self, rooms, subject_type):
        """Filter rooms based on subject type"""
        if subject_type == "practical":
            return [r for r in rooms if self.get_room_type(r) == "lab"]
        else:  # theory
            return [r for r in rooms if self.get_room_type(r) == "class"]
    
    def create_lecture_entry(self, branch, class_name, sem, slot_name, subject, room):
        """Create formatted lecture string"""
        return f"{branch}-{class_name}-Sem{sem}-{slot_name}-{subject}-{room}"
    
    def find_continuous_slots(self, day_schedule, required_slots):
        """Find continuous free slots in a day for practicals"""
        for i in range(len(day_schedule) - required_slots + 1):
            if all(day_schedule[i+j] == "free" for j in range(required_slots)):
                return i
        return None
    
    def count_subject_on_day(self, class_tt, day, subject_name):
        """Count how many times a subject is already scheduled on a specific day"""
        count = 0
        for slot in class_tt[day]:
            if slot != "free" and subject_name in slot:
                count += 1
        return count
    
    def try_schedule_lecture(self, class_tt, occupied_rooms, day, slot_idx, 
                            subject, faculty_id, available_rooms, branch, 
                            class_name, sem, daily_subject_count):
        """
        Try to schedule a single lecture at a specific day/slot
        Returns True if successful, False otherwise
        """
        if class_tt[day][slot_idx] != "free":
            return False
        
        subject_name = subject["subject_name"]
        
        # Check if subject already has 2 lectures on this day
        if daily_subject_count.get(f"{day}_{subject_name}", 0) >= 2:
            return False
        
        # Check faculty availability
        if not self.is_faculty_free(faculty_id, day, slot_idx):
            return False
        
        # Find an available room
        for room in available_rooms:
            if self.is_room_free(room, day, slot_idx, occupied_rooms):
                # Schedule the lecture
                slot_name = TIME_SLOTS[slot_idx]
                lecture = self.create_lecture_entry(
                    branch, class_name, sem, slot_name,
                    subject_name, room
                )
                class_tt[day][slot_idx] = lecture
                
                # Mark room as occupied
                key = f"{day}_{slot_idx}"
                occupied_rooms[key].add(room)
                
                # Update daily subject count
                count_key = f"{day}_{subject_name}"
                daily_subject_count[count_key] = daily_subject_count.get(count_key, 0) + 1
                
                return True
        
        return False
    
    def try_schedule_continuous_pair(self, class_tt, occupied_rooms, day, subject, 
                                    faculty_id, available_rooms, branch, class_name, 
                                    sem, daily_subject_count):
        """
        Try to schedule 2 continuous lectures for a subject on a specific day
        Returns True if successful, False otherwise
        """
        subject_name = subject["subject_name"]
        
        # Check if subject already has lectures on this day
        current_count = daily_subject_count.get(f"{day}_{subject_name}", 0)
        if current_count >= 2:
            return False
        
        # If already has 1, can only schedule 1 more
        slots_needed = min(2 - current_count, 2)
        
        # Try to find continuous slots
        for start_idx in range(TOTAL_SLOTS - 1):
            if slots_needed == 2:
                # Need 2 continuous slots
                if class_tt[day][start_idx] == "free" and class_tt[day][start_idx + 1] == "free":
                    # Check faculty availability for both
                    if (self.is_faculty_free(faculty_id, day, start_idx) and 
                        self.is_faculty_free(faculty_id, day, start_idx + 1)):
                        
                        # Find a room available for both slots
                        for room in available_rooms:
                            if (self.is_room_free(room, day, start_idx, occupied_rooms) and
                                self.is_room_free(room, day, start_idx + 1, occupied_rooms)):
                                
                                # Schedule both slots
                                for offset in range(2):
                                    slot_idx = start_idx + offset
                                    slot_name = TIME_SLOTS[slot_idx]
                                    lecture = self.create_lecture_entry(
                                        branch, class_name, sem, slot_name,
                                        subject_name, room
                                    )
                                    class_tt[day][slot_idx] = lecture
                                    
                                    key = f"{day}_{slot_idx}"
                                    occupied_rooms[key].add(room)
                                
                                # Update count
                                count_key = f"{day}_{subject_name}"
                                daily_subject_count[count_key] = 2
                                return True
        
        return False
    
    def generate_timetable(self, branch, class_name, sem, rooms, subjects, 
                          lectures_per_day, max_free_lectures):
        """
        Main timetable generation logic with improved algorithm
        Max 2 lectures per subject per day
        """
        
        # Initialize class timetable
        class_tt = {day: ["free"] * TOTAL_SLOTS for day in DAYS}
        
        # Track room occupancy across all time slots
        occupied_rooms = defaultdict(set)
        
        # Track daily subject count (max 2 per subject per day)
        daily_subject_count = {}
        
        # Track subject allocation count
        subject_allocation = {s["subject_name"]: 0 for s in subjects}
        subject_remaining = {s["subject_name"]: s["weekly_hours"] for s in subjects}
        
        # Create a mapping of subject names to full subject info
        subject_map = {s["subject_name"]: s for s in subjects}
        
        # Sort subjects by weekly hours (descending) for better allocation
        sorted_subjects = sorted(subjects, key=lambda x: x["weekly_hours"], reverse=True)
        
        # PHASE 1: Schedule all subjects in pairs (2 continuous lectures per day)
        for subject in sorted_subjects:
            subject_name = subject["subject_name"]
            faculty_id = subject["faculty_id"]
            available_rooms = self.filter_rooms_by_type(rooms, subject["subject_type"])
            
            if not available_rooms:
                continue
            
            # Try to schedule in pairs of 2 lectures per day
            while subject_remaining[subject_name] >= 2:
                scheduled = False
                
                # Try each day
                for day in DAYS:
                    if self.try_schedule_continuous_pair(class_tt, occupied_rooms, day,
                                                         subject, faculty_id, available_rooms,
                                                         branch, class_name, sem, 
                                                         daily_subject_count):
                        subject_allocation[subject_name] += 2
                        subject_remaining[subject_name] -= 2
                        scheduled = True
                        break
                
                if not scheduled:
                    # Can't find continuous pair, break to phase 2
                    break
        
        # PHASE 2: Schedule remaining lectures (singles or non-continuous)
        for subject in sorted_subjects:
            subject_name = subject["subject_name"]
            faculty_id = subject["faculty_id"]
            available_rooms = self.filter_rooms_by_type(rooms, subject["subject_type"])
            
            if not available_rooms:
                continue
            
            # Special handling for practicals - try continuous slots first
            if subject["subject_type"] == "practical" and subject_remaining[subject_name] >= 2:
                remaining = subject_remaining[subject_name]
                
                while remaining >= 2:
                    scheduled = False
                    
                    for day in DAYS:
                        # Check if we can still add to this day
                        current_count = daily_subject_count.get(f"{day}_{subject_name}", 0)
                        if current_count >= 2:
                            continue
                        
                        start_slot = self.find_continuous_slots(class_tt[day], 2)
                        
                        if start_slot is not None:
                            # Check faculty and room availability for both slots
                            selected_room = None
                            
                            for room in available_rooms:
                                can_schedule = True
                                for offset in range(2):
                                    slot_idx = start_slot + offset
                                    if not self.is_faculty_free(faculty_id, day, slot_idx):
                                        can_schedule = False
                                        break
                                    if not self.is_room_free(room, day, slot_idx, occupied_rooms):
                                        can_schedule = False
                                        break
                                
                                if can_schedule:
                                    selected_room = room
                                    break
                            
                            if selected_room:
                                # Check if adding 2 won't exceed daily limit
                                if current_count + 2 <= 2:
                                    # Allocate both slots
                                    for offset in range(2):
                                        slot_idx = start_slot + offset
                                        slot_name = TIME_SLOTS[slot_idx]
                                        lecture = self.create_lecture_entry(
                                            branch, class_name, sem, slot_name, 
                                            subject_name, selected_room
                                        )
                                        class_tt[day][slot_idx] = lecture
                                        
                                        key = f"{day}_{slot_idx}"
                                        occupied_rooms[key].add(room)
                                    
                                    # Update counts
                                    count_key = f"{day}_{subject_name}"
                                    daily_subject_count[count_key] = current_count + 2
                                    subject_allocation[subject_name] += 2
                                    subject_remaining[subject_name] -= 2
                                    remaining -= 2
                                    scheduled = True
                                    break
                    
                    if not scheduled:
                        break
            
            # Schedule any remaining single lectures
            while subject_remaining[subject_name] > 0:
                scheduled = False
                
                # Try all days and slots
                for day in DAYS:
                    for slot_idx in range(TOTAL_SLOTS):
                        if self.try_schedule_lecture(class_tt, occupied_rooms, day, 
                                                    slot_idx, subject, faculty_id, 
                                                    available_rooms, branch, class_name, 
                                                    sem, daily_subject_count):
                            subject_allocation[subject_name] += 1
                            subject_remaining[subject_name] -= 1
                            scheduled = True
                            break
                    
                    if scheduled:
                        break
                
                # If we couldn't schedule, break to avoid infinite loop
                if not scheduled:
                    break
        
        # Calculate statistics
        total_lectures = sum(
            1 for day in DAYS for slot in class_tt[day] if slot != "free"
        )
        free_lectures = sum(
            1 for day in DAYS for slot in class_tt[day] if slot == "free"
        )
        
        # Calculate daily lecture count
        daily_lecture_count = {}
        for day in DAYS:
            daily_lecture_count[day] = sum(
                1 for slot in class_tt[day] if slot != "free"
            )
        
        # Validation checks
        errors = []
        warnings = []
        
        # Check if all subjects got required hours
        for subject in subjects:
            name = subject["subject_name"]
            required = subject["weekly_hours"]
            allocated = subject_allocation[name]
            if allocated < required:
                errors.append(
                    f"Subject '{name}' allocated {allocated}/{required} hours"
                )
            elif allocated > required:
                warnings.append(
                    f"Subject '{name}' over-allocated: {allocated}/{required} hours"
                )
        
        # Check free lecture limit (warning, not error)
        if free_lectures > max_free_lectures:
            warnings.append(
                f"Free lectures ({free_lectures}) exceed recommended limit ({max_free_lectures})"
            )
        
        # Check if any day exceeds lectures_per_day (warning only)
        for day, count in daily_lecture_count.items():
            if count > lectures_per_day:
                warnings.append(
                    f"{day.upper()} has {count} lectures (recommended: {lectures_per_day})"
                )
        
        return {
            "timetable": class_tt,
            "total_lectures": total_lectures,
            "free_lectures": free_lectures,
            "subject_allocation": subject_allocation,
            "errors": errors,
            "warnings": warnings,
            "daily_count": daily_lecture_count
        }
    
    def update_faculty_timetables(self, class_tt, branch, class_name, sem, subjects):
        """Update faculty timetables based on generated class timetable"""
        
        # Create faculty mapping
        faculty_map = {s["subject_name"]: s["faculty_id"] for s in subjects}
        
        # Track faculty updates
        updated_faculties = set()
        
        for day in DAYS:
            for slot_idx, lecture in enumerate(class_tt[day]):
                if lecture == "free":
                    continue
                
                # Parse lecture string to get subject
                parts = lecture.split("-")
                if len(parts) >= 5:
                    subject_name = parts[4]
                    
                    if subject_name in faculty_map:
                        faculty_id = faculty_map[subject_name]
                        updated_faculties.add(faculty_id)
                        
                        # Get or create faculty timetable
                        faculty = self.faculty_tt_col.find_one({"_id": faculty_id})
                        if not faculty:
                            faculty_tt = {day: ["free"] * TOTAL_SLOTS for day in DAYS}
                        else:
                            faculty_tt = {
                                d: normalize_day_slots(faculty.get("timetable", {}).get(d, []))
                                for d in DAYS
                            }
                        
                        # Update slot
                        faculty_tt[day][slot_idx] = lecture
                        
                        # Save to database
                        self.faculty_tt_col.update_one(
                            {"_id": faculty_id},
                            {"$set": {"timetable": faculty_tt}},
                            upsert=True
                        )
        
        return list(updated_faculties)


def auto_generate_timetable():
    """
    API endpoint for automatic timetable generation
    POST /api/timetable/auto-generate
    """
    try:
        data = request.get_json()
        
        # Extract inputs
        branch = data.get("branch")
        class_name = data.get("class")
        sem = data.get("sem")
        rooms = data.get("rooms", [])
        subjects = data.get("subjects", [])
        lectures_per_day = data.get("lectures_per_day", 4)
        max_free_lectures = data.get("max_valid_free_lectures", 6)
        
        # Validation
        if not all([branch, class_name, sem, rooms, subjects]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if not isinstance(subjects, list) or len(subjects) == 0:
            return jsonify({"error": "Subjects list is empty"}), 400
        
        # Validate subject structure
        for subject in subjects:
            required_fields = ["subject_name", "weekly_hours", "subject_type", "faculty_id"]
            if not all(field in subject for field in required_fields):
                return jsonify({"error": f"Invalid subject structure"}), 400
        
        # Calculate total required lectures
        total_required_lectures = sum(s["weekly_hours"] for s in subjects)
        total_available_slots = 6 * 8  # 6 days * 8 slots
        
        if total_required_lectures > total_available_slots:
            return jsonify({
                "error": f"Cannot fit {total_required_lectures} lectures in {total_available_slots} available slots"
            }), 400
        
        # Initialize generator
        generator = TimetableGenerator(db)
        
        # Generate timetable
        result = generator.generate_timetable(
            branch, class_name, sem, rooms, subjects,
            lectures_per_day, max_free_lectures
        )
        
        # Check for critical errors (missing allocations)
        if result["errors"]:
            return jsonify({
                "success": False,
                "errors": result["errors"],
                "warnings": result.get("warnings", []),
                "partial_timetable": result["timetable"],
                "stats": {
                    "total_lectures": result["total_lectures"],
                    "free_lectures": result["free_lectures"],
                    "subject_allocation": result["subject_allocation"],
                    "daily_lecture_count": result["daily_count"]
                }
            }), 400
        
        # Update faculty timetables
        updated_faculties = generator.update_faculty_timetables(
            result["timetable"], branch, class_name, sem, subjects
        )
        
        # Calculate average lectures per day
        total_lectures = result["total_lectures"]
        avg_lectures_per_day = total_lectures // 6  # 6 working days
        
        # Update classwise_faculty collection
        class_id = f"sem{sem}_{branch.lower().replace('(', '').replace(')', '')}_{class_name.lower()}"
        
        faculty_ids = list(set(s["faculty_id"] for s in subjects))
        
        generator.classwise_col.update_one(
            {"_id": class_id},
            {
                "$set": {
                    "sem": sem,
                    "branch": branch,
                    "class": class_name,
                    "allowed_faculty": faculty_ids,
                    "avg_lectures_per_day": avg_lectures_per_day
                }
            },
            upsert=True
        )
        
        return jsonify({
            "success": True,
            "message": "Timetable generated successfully",
            "class_id": class_id,
            "class_timetable": result["timetable"],
            "stats": {
                "total_lectures": result["total_lectures"],
                "free_lectures": result["free_lectures"],
                "conflicts_avoided": True,
                "subject_allocation": result["subject_allocation"],
                "daily_lecture_count": result["daily_count"]
            },
            "warnings": result.get("warnings", []),
            "faculty_updated": updated_faculties
        }), 200
        
    except Exception as e:
        print("ERROR in auto_generate_timetable:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# Helper endpoint to get all faculties (already exists)
def get_all_faculties():
    """GET /api/faculties"""
    try:
        faculties = list(db.faculty_timetable.find({}, {"password": 0}))
        return jsonify({
            "success": True,
            "faculties": [
                {
                    "id": f["_id"],
                    "name": f.get("name", f["_id"]),
                    "timetable": f.get("timetable", {})
                }
                for f in faculties
            ]
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
from flask import request, jsonify
from collections import defaultdict
import random
from app.database.mongo import db

# Constants
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"]
TOTAL_SLOTS = 4
TIME_SLOTS = [f"Time Slot {i+1}" for i in range(TOTAL_SLOTS)]

def normalize_day_slots(day_data):
    """Ensure day has exactly TOTAL_SLOTS entries"""
    if not day_data:
        return ["free"] * TOTAL_SLOTS
    if len(day_data) < TOTAL_SLOTS:
        return day_data + ["free"] * (TOTAL_SLOTS - len(day_data))
    return day_data[:TOTAL_SLOTS]


class BranchTimetableGenerator:
    def __init__(self, db):
        self.db = db
        self.faculty_tt_col = db.faculty_timetable
        self.classwise_col = db.classwise_faculty
        
        # Global faculty availability tracker across all divisions
        self.global_faculty_availability = {}
        
    def initialize_global_faculty_availability(self):
        """Initialize global faculty availability from database"""
        all_faculties = self.faculty_tt_col.find({})
        
        for faculty in all_faculties:
            faculty_id = faculty["_id"]
            if "timetable" not in faculty:
                self.global_faculty_availability[faculty_id] = {
                    day: ["free"] * TOTAL_SLOTS for day in DAYS
                }
            else:
                self.global_faculty_availability[faculty_id] = {
                    day: normalize_day_slots(faculty["timetable"].get(day, []))
                    for day in DAYS
                }
    
    def is_faculty_free(self, faculty_id, day, slot_index):
        """Check if faculty is free at given day/slot (uses global tracker)"""
        if faculty_id not in self.global_faculty_availability:
            self.global_faculty_availability[faculty_id] = {
                d: ["free"] * TOTAL_SLOTS for d in DAYS
            }
        
        return self.global_faculty_availability[faculty_id][day][slot_index] == "free"
    
    def mark_faculty_busy(self, faculty_id, day, slot_index, lecture_info):
        """Mark faculty as busy at specific day/slot"""
        if faculty_id not in self.global_faculty_availability:
            self.global_faculty_availability[faculty_id] = {
                d: ["free"] * TOTAL_SLOTS for d in DAYS
            }
        
        self.global_faculty_availability[faculty_id][day][slot_index] = lecture_info
        print(f"Marked faculty {faculty_id} busy at {day} slot {slot_index}: {lecture_info}")
    
    def is_room_free(self, room, day, slot_index, occupied_rooms):
        """Check if room is free at given day/slot"""
        key = f"{day}_{slot_index}"
        return room not in occupied_rooms.get(key, set())
    
    def get_room_type(self, room):
        """Determine if room is class or lab"""
        return "lab" if "lab" in room.lower() else "class"
    
    def filter_rooms_by_type(self, rooms, subject_type):
        """Filter rooms based on subject type"""
        if subject_type == "practical":
            return [r for r in rooms if self.get_room_type(r) == "lab"]
        else:
            return [r for r in rooms if self.get_room_type(r) == "class"]
    
    def create_lecture_entry(self, branch, class_name, sem, slot_name, subject, room):
        """Create formatted lecture string"""
        return f"{branch}-{class_name}-Sem{sem}-{slot_name}-{subject}-{room}"
    
    def find_continuous_slots(self, day_schedule, required_slots):
        """Find continuous free slots in a day"""
        for i in range(len(day_schedule) - required_slots + 1):
            if all(day_schedule[i+j] == "free" for j in range(required_slots)):
                return i
        return None
    
    def try_schedule_lecture(self, class_tt, occupied_rooms, day, slot_idx, 
                            subject, faculty_id, available_rooms, branch, 
                            class_name, sem, daily_subject_count):
        """Try to schedule a single lecture"""
        if class_tt[day][slot_idx] != "free":
            return False
        
        subject_name = subject["subject_name"]
        
        # Check if subject already has 2 lectures on this day
        if daily_subject_count.get(f"{day}_{subject_name}", 0) >= 2:
            return False
        
        # Check global faculty availability
        if not self.is_faculty_free(faculty_id, day, slot_idx):
            return False
        
        # Find an available room
        for room in available_rooms:
            if self.is_room_free(room, day, slot_idx, occupied_rooms):
                slot_name = TIME_SLOTS[slot_idx]
                lecture = self.create_lecture_entry(
                    branch, class_name, sem, slot_name, subject_name, room
                )
                
                # Schedule the lecture
                class_tt[day][slot_idx] = lecture
                
                # Mark room as occupied
                key = f"{day}_{slot_idx}"
                occupied_rooms[key].add(room)
                
                # Mark faculty as busy globally
                self.mark_faculty_busy(faculty_id, day, slot_idx, lecture)
                
                # Update daily subject count
                count_key = f"{day}_{subject_name}"
                daily_subject_count[count_key] = daily_subject_count.get(count_key, 0) + 1
                
                return True
        
        return False
    
    def try_schedule_continuous_pair(self, class_tt, occupied_rooms, day, subject, 
                                    faculty_id, available_rooms, branch, class_name, 
                                    sem, daily_subject_count):
        """Try to schedule 2 continuous lectures"""
        subject_name = subject["subject_name"]
        
        current_count = daily_subject_count.get(f"{day}_{subject_name}", 0)
        if current_count >= 2:
            return False
        
        slots_needed = min(2 - current_count, 2)
        
        for start_idx in range(TOTAL_SLOTS - 1):
            if slots_needed == 2:
                if class_tt[day][start_idx] == "free" and class_tt[day][start_idx + 1] == "free":
                    # Check global faculty availability for both
                    if (self.is_faculty_free(faculty_id, day, start_idx) and 
                        self.is_faculty_free(faculty_id, day, start_idx + 1)):
                        
                        # Find a room available for both slots
                        for room in available_rooms:
                            if (self.is_room_free(room, day, start_idx, occupied_rooms) and
                                self.is_room_free(room, day, start_idx + 1, occupied_rooms)):
                                
                                # Schedule both slots
                                for offset in range(2):
                                    slot_idx = start_idx + offset
                                    slot_name = TIME_SLOTS[slot_idx]
                                    lecture = self.create_lecture_entry(
                                        branch, class_name, sem, slot_name, subject_name, room
                                    )
                                    class_tt[day][slot_idx] = lecture
                                    
                                    key = f"{day}_{slot_idx}"
                                    occupied_rooms[key].add(room)
                                    
                                    # Mark faculty as busy globally
                                    self.mark_faculty_busy(faculty_id, day, slot_idx, lecture)
                                
                                # Update count
                                count_key = f"{day}_{subject_name}"
                                daily_subject_count[count_key] = 2
                                return True
        
        return False
    
    def generate_division_timetable(self, branch, class_name, sem, rooms, subjects, 
                                   lectures_per_day, max_free_lectures):
        """Generate timetable for a single division"""
        
        # Initialize class timetable
        class_tt = {day: ["free"] * TOTAL_SLOTS for day in DAYS}
        
        # Track room occupancy for this division only
        occupied_rooms = defaultdict(set)
        
        # Track daily subject count for this division
        daily_subject_count = {}
        
        # Track subject allocation
        subject_allocation = {s["subject_name"]: 0 for s in subjects}
        subject_remaining = {s["subject_name"]: s["weekly_hours"] for s in subjects}
        
        # Sort subjects by weekly hours (descending)
        sorted_subjects = sorted(subjects, key=lambda x: x["weekly_hours"], reverse=True)
        
        # PHASE 1: Schedule in pairs of 2 continuous lectures per day
        for subject in sorted_subjects:
            subject_name = subject["subject_name"]
            faculty_id = subject["faculty_id"]
            available_rooms = self.filter_rooms_by_type(rooms, subject["subject_type"])
            
            if not available_rooms:
                continue
            
            while subject_remaining[subject_name] >= 2:
                scheduled = False
                
                for day in DAYS:
                    if self.try_schedule_continuous_pair(class_tt, occupied_rooms, day,
                                                         subject, faculty_id, available_rooms,
                                                         branch, class_name, sem, 
                                                         daily_subject_count):
                        subject_allocation[subject_name] += 2
                        subject_remaining[subject_name] -= 2
                        scheduled = True
                        break
                
                if not scheduled:
                    break
        
        # PHASE 2: Schedule remaining lectures
        for subject in sorted_subjects:
            subject_name = subject["subject_name"]
            faculty_id = subject["faculty_id"]
            available_rooms = self.filter_rooms_by_type(rooms, subject["subject_type"])
            
            if not available_rooms:
                continue
            
            while subject_remaining[subject_name] > 0:
                scheduled = False
                
                for day in DAYS:
                    for slot_idx in range(TOTAL_SLOTS):
                        if self.try_schedule_lecture(class_tt, occupied_rooms, day, 
                                                    slot_idx, subject, faculty_id, 
                                                    available_rooms, branch, class_name, 
                                                    sem, daily_subject_count):
                            subject_allocation[subject_name] += 1
                            subject_remaining[subject_name] -= 1
                            scheduled = True
                            break
                    
                    if scheduled:
                        break
                
                if not scheduled:
                    break
        
        # Calculate statistics
        total_lectures = sum(1 for day in DAYS for slot in class_tt[day] if slot != "free")
        free_lectures = sum(1 for day in DAYS for slot in class_tt[day] if slot == "free")
        
        daily_lecture_count = {}
        for day in DAYS:
            daily_lecture_count[day] = sum(1 for slot in class_tt[day] if slot != "free")
        
        # Validation
        errors = []
        warnings = []
        
        for subject in subjects:
            name = subject["subject_name"]
            required = subject["weekly_hours"]
            allocated = subject_allocation[name]
            if allocated < required:
                errors.append(f"Subject '{name}' allocated {allocated}/{required} hours")
        
        if free_lectures > max_free_lectures:
            warnings.append(f"Free lectures ({free_lectures}) exceed limit ({max_free_lectures})")
        
        return {
            "timetable": class_tt,
            "total_lectures": total_lectures,
            "free_lectures": free_lectures,
            "subject_allocation": subject_allocation,
            "errors": errors,
            "warnings": warnings,
            "daily_count": daily_lecture_count
        }
    
    def save_faculty_timetables(self):
        """Save all faculty timetables to database with verification"""
        updated_count = 0
        errors = []
        
        for faculty_id, timetable in self.global_faculty_availability.items():
            # Check if faculty has any actual lectures (not all "free")
            has_lectures = False
            lecture_count = 0
            
            for day in DAYS:
                for slot in timetable[day]:
                    if slot != "free":
                        has_lectures = True
                        lecture_count += 1
            
            # Only update if faculty has lectures assigned
            if has_lectures:
                try:
                    # Ensure the timetable structure is correct
                    normalized_timetable = {}
                    for day in DAYS:
                        normalized_timetable[day] = normalize_day_slots(timetable[day])
                    
                    result = self.faculty_tt_col.update_one(
                        {"_id": faculty_id},
                        {"$set": {"timetable": normalized_timetable}},
                        upsert=True
                    )
                    
                    if result.modified_count > 0 or result.upserted_id:
                        updated_count += 1
                        print(f"✓ Updated faculty {faculty_id}: {lecture_count} lectures")
                    else:
                        print(f"⚠ No change for faculty {faculty_id} (already up to date)")
                        updated_count += 1
                        
                except Exception as e:
                    error_msg = f"Failed to update faculty {faculty_id}: {str(e)}"
                    errors.append(error_msg)
                    print(f"✗ {error_msg}")
        
        print(f"\n=== Faculty Timetable Update Summary ===")
        print(f"Total faculty with lectures: {updated_count}")
        print(f"Errors: {len(errors)}")
        
        if errors:
            for error in errors:
                print(f"  - {error}")
        
        return updated_count, errors


def auto_generate_branch_timetable():
    """
    API endpoint for branch-wide timetable generation
    POST /api/timetable/auto-generate-branch
    
    Generates timetables for multiple divisions of a branch simultaneously
    """
    try:
        data = request.get_json()
        
        # Extract inputs
        branch = data.get("branch")
        sem = data.get("sem")
        divisions = data.get("divisions", [])  # List of division configs
        shared_rooms = data.get("shared_rooms", [])  # Rooms shared across divisions
        lectures_per_day = data.get("lectures_per_day", 4)
        max_free_lectures = data.get("max_valid_free_lectures", 6)
        
        # Validation
        if not all([branch, sem, divisions]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if not isinstance(divisions, list) or len(divisions) == 0:
            return jsonify({"error": "Divisions list is empty"}), 400
        
        # Validate each division
        for div in divisions:
            required_fields = ["class_name", "subjects"]
            if not all(field in div for field in required_fields):
                return jsonify({"error": "Invalid division structure"}), 400
            
            # Division-specific rooms (optional)
            if "rooms" not in div:
                div["rooms"] = []
        
        # Initialize generator
        generator = BranchTimetableGenerator(db)
        generator.initialize_global_faculty_availability()
        
        # Results for each division
        division_results = {}
        all_errors = []
        all_warnings = []
        all_faculty_updated = set()
        
        # Generate timetable for each division sequentially
        for division in divisions:
            class_name = division["class_name"]
            subjects = division["subjects"]
            
            # Combine shared rooms and division-specific rooms
            available_rooms = list(set(shared_rooms + division.get("rooms", [])))
            
            if not available_rooms:
                all_errors.append(f"No rooms available for {class_name}")
                continue
            
            # Validate subject structure
            for subject in subjects:
                required_fields = ["subject_name", "weekly_hours", "subject_type", "faculty_id"]
                if not all(field in subject for field in required_fields):
                    all_errors.append(f"Invalid subject structure in {class_name}")
                    continue
            
            # Generate timetable for this division
            result = generator.generate_division_timetable(
                branch, class_name, sem, available_rooms, subjects,
                lectures_per_day, max_free_lectures
            )
            
            # Collect results
            division_results[class_name] = result
            
            if result["errors"]:
                all_errors.extend([f"{class_name}: {err}" for err in result["errors"]])
            
            if result["warnings"]:
                all_warnings.extend([f"{class_name}: {warn}" for warn in result["warnings"]])
            
            # Track faculty
            faculty_ids = set(s["faculty_id"] for s in subjects)
            all_faculty_updated.update(faculty_ids)
            
            # Update classwise_faculty collection
            class_id = f"sem{sem}_{branch.lower().replace('(', '').replace(')', '')}_{class_name.lower()}"
            
            avg_lectures_per_day = result["total_lectures"] // 6
            
            generator.classwise_col.update_one(
                {"_id": class_id},
                {
                    "$set": {
                        "sem": sem,
                        "branch": branch,
                        "class": class_name,
                        "allowed_faculty": list(faculty_ids),
                        "avg_lectures_per_day": avg_lectures_per_day
                    }
                },
                upsert=True
            )
        
        # Check for critical errors
        if all_errors:
            return jsonify({
                "success": False,
                "errors": all_errors,
                "warnings": all_warnings,
                "partial_results": {
                    div_name: {
                        "timetable": result["timetable"],
                        "stats": {
                            "total_lectures": result["total_lectures"],
                            "free_lectures": result["free_lectures"],
                            "subject_allocation": result["subject_allocation"]
                        }
                    }
                    for div_name, result in division_results.items()
                }
            }), 400
        
        # Save all faculty timetables to database
        faculty_update_count, faculty_errors = generator.save_faculty_timetables()
        
        if faculty_errors:
            all_warnings.extend([f"Faculty update: {err}" for err in faculty_errors])
        
        print(f"\n=== Branch Timetable Generation Completed ===")
        print(f"Divisions processed: {len(divisions)}")
        print(f"Faculty updated: {len(all_faculty_updated)}")
        print(f"Database updates: {faculty_update_count}")
        
        # Prepare successful response
        response_data = {
            "success": True,
            "message": f"Timetables generated for {len(divisions)} divisions",
            "branch": branch,
            "semester": sem,
            "divisions": {}
        }
        
        # Add each division's data
        for div_name, result in division_results.items():
            response_data["divisions"][div_name] = {
                "timetable": result["timetable"],
                "stats": {
                    "total_lectures": result["total_lectures"],
                    "free_lectures": result["free_lectures"],
                    "conflicts_avoided": True,
                    "subject_allocation": result["subject_allocation"],
                    "daily_lecture_count": result["daily_count"]
                }
            }
        
        response_data["warnings"] = all_warnings
        response_data["faculty_updated"] = list(all_faculty_updated)
        response_data["faculty_update_count"] = faculty_update_count
        response_data["total_divisions"] = len(divisions)
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print("ERROR in auto_generate_branch_timetable:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


def get_branch_divisions():
    """
    Helper endpoint to get existing divisions for a branch/semester
    GET /api/timetable/branch-divisions?branch=CSE&sem=1
    """
    try:
        branch = request.args.get("branch")
        sem = request.args.get("sem")
        
        if not branch or not sem:
            return jsonify({"error": "Missing branch or semester"}), 400
        
        # Query classwise_faculty collection
        safe_branch = branch.lower().replace("(", "").replace(")", "")
        pattern = f"sem{sem}_{safe_branch}_"
        
        divisions = list(db.classwise_faculty.find({
            "_id": {"$regex": f"^{pattern}"}
        }))
        
        division_list = []
        for div in divisions:
            class_name = div.get("class", "")
            division_list.append({
                "class_name": class_name,
                "class_id": div["_id"],
                "faculty_count": len(div.get("allowed_faculty", [])),
                "avg_lectures_per_day": div.get("avg_lectures_per_day", 0)
            })
        
        return jsonify({
            "success": True,
            "branch": branch,
            "semester": sem,
            "divisions": division_list,
            "total": len(division_list)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
from flask import request, jsonify
from collections import defaultdict
import random
from app.database.mongo import db

# Constants
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat"]
TOTAL_SLOTS = 4  # Assuming 4 time slots per day
TIME_SLOTS = [f"Time Slot {i+1}" for i in range(TOTAL_SLOTS)]
MAX_FREE_LECTURES_PER_DAY = 1  # Only 1 free lecture allowed per day

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
    
    def _get_subject_code(self, subject):
        """Get subject code from subject dict, accepts both _id and subject_code"""
        if "_id" in subject:
            return subject["_id"]
        elif "subject_code" in subject:
            return subject["subject_code"]
        elif "subject_id" in subject:
            return subject["subject_id"]
        else:
            raise KeyError("Subject must have either '_id', 'subject_code', or 'subject_id' field")
    
    def _should_schedule_in_pairs(self, subject):
        """
        Check if a subject should be scheduled in pairs
        TRUE = 2 lectures per day (paired)
        FALSE = max 1 lecture per day (unpaired)
        """
        return subject.get("schedule_in_pairs", False)
        
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
    
    def create_lecture_entry(self, branch, class_name, sem, slot_name, subject_code, room):
        """Create formatted lecture string"""
        return f"{branch}-{class_name}-Sem{sem}-{slot_name}-{subject_code}-{room}"
    
    def find_continuous_slots(self, day_schedule, required_slots):
        """Find continuous free slots in a day"""
        for i in range(len(day_schedule) - required_slots + 1):
            if all(day_schedule[i+j] == "free" for j in range(required_slots)):
                return i
        return None
    
    def count_subject_on_day(self, class_tt, day, subject_code):
        """Count how many times a subject is already scheduled on a specific day"""
        count = 0
        for slot in class_tt[day]:
            if slot != "free" and subject_code in slot:
                count += 1
        return count
    
    def count_free_lectures_on_day(self, class_tt, day):
        """Count free lectures on a specific day"""
        return sum(1 for slot in class_tt[day] if slot == "free")
    
    def get_room_at_slot(self, class_tt, day, slot_idx):
        """Extract room name from lecture entry at specific slot"""
        lecture = class_tt[day][slot_idx]
        if lecture == "free":
            return None
        parts = lecture.split("-")
        if len(parts) >= 6:
            return parts[5]
        return None
    
    def get_subject_at_slot(self, class_tt, day, slot_idx):
        """Extract subject code from lecture entry at specific slot"""
        lecture = class_tt[day][slot_idx]
        if lecture == "free":
            return None
        parts = lecture.split("-")
        if len(parts) >= 5:
            return parts[4]
        return None
    
    def try_schedule_single_lecture(self, class_tt, occupied_rooms, day, slot_idx, 
                                    subject, faculty_id, available_rooms, branch, 
                                    class_name, sem, daily_subject_count, prefer_same_room=True):
        """
        Try to schedule a single lecture at a specific day/slot
        For UNPAIRED subjects (max 1 per day)
        """
        if class_tt[day][slot_idx] != "free":
            return False
        
        subject_code = self._get_subject_code(subject)
        
        # For unpaired subjects: max 1 lecture per day
        if daily_subject_count.get(f"{day}_{subject_code}", 0) >= 1:
            return False
        
        # Check faculty availability
        if not self.is_faculty_free(faculty_id, day, slot_idx):
            return False
        
        # RULE 3: If consecutive lectures are of same subject, use same room
        preferred_room = None
        if slot_idx > 0 and prefer_same_room:
            prev_subject = self.get_subject_at_slot(class_tt, day, slot_idx - 1)
            if prev_subject == subject_code:
                preferred_room = self.get_room_at_slot(class_tt, day, slot_idx - 1)
        
        # Try preferred room first if exists
        if preferred_room and preferred_room in available_rooms:
            if self.is_room_free(preferred_room, day, slot_idx, occupied_rooms):
                slot_name = TIME_SLOTS[slot_idx]
                lecture = self.create_lecture_entry(
                    branch, class_name, sem, slot_name,
                    subject_code, preferred_room
                )
                class_tt[day][slot_idx] = lecture
                
                key = f"{day}_{slot_idx}"
                occupied_rooms[key].add(preferred_room)
                
                count_key = f"{day}_{subject_code}"
                daily_subject_count[count_key] = 1
                
                return True
        
        # Find any available room
        for room in available_rooms:
            if self.is_room_free(room, day, slot_idx, occupied_rooms):
                slot_name = TIME_SLOTS[slot_idx]
                lecture = self.create_lecture_entry(
                    branch, class_name, sem, slot_name,
                    subject_code, room
                )
                class_tt[day][slot_idx] = lecture
                
                key = f"{day}_{slot_idx}"
                occupied_rooms[key].add(room)
                
                count_key = f"{day}_{subject_code}"
                daily_subject_count[count_key] = 1
                
                return True
        
        return False
    
    def try_schedule_pair(self, class_tt, occupied_rooms, day, subject, 
                         faculty_id, available_rooms, branch, class_name, 
                         sem, daily_subject_count):
        """
        Try to schedule 2 continuous lectures for a PAIRED subject on a specific day
        PAIRED subjects get exactly 2 lectures per day in same room
        """
        subject_code = self._get_subject_code(subject)
        
        # For paired subjects: exactly 2 lectures per day (or 0 if can't schedule both)
        current_count = daily_subject_count.get(f"{day}_{subject_code}", 0)
        if current_count > 0:  # Already scheduled on this day
            return False
        
        # Try to find 2 continuous free slots
        for start_idx in range(TOTAL_SLOTS - 1):
            if class_tt[day][start_idx] == "free" and class_tt[day][start_idx + 1] == "free":
                # Check faculty availability for both
                if (self.is_faculty_free(faculty_id, day, start_idx) and 
                    self.is_faculty_free(faculty_id, day, start_idx + 1)):
                    
                    # RULE 2: Find a room available for BOTH slots (same room for pair)
                    for room in available_rooms:
                        if (self.is_room_free(room, day, start_idx, occupied_rooms) and
                            self.is_room_free(room, day, start_idx + 1, occupied_rooms)):
                            
                            # Schedule both slots IN SAME ROOM
                            for offset in range(2):
                                slot_idx = start_idx + offset
                                slot_name = TIME_SLOTS[slot_idx]
                                lecture = self.create_lecture_entry(
                                    branch, class_name, sem, slot_name,
                                    subject_code, room  # Same room for both
                                )
                                class_tt[day][slot_idx] = lecture
                                
                                key = f"{day}_{slot_idx}"
                                occupied_rooms[key].add(room)
                            
                            # Update count: 2 lectures scheduled
                            count_key = f"{day}_{subject_code}"
                            daily_subject_count[count_key] = 2
                            return True
        
        return False
    
    def generate_timetable(self, branch, class_name, sem, rooms, subjects, 
                          lectures_per_day, max_free_lectures):
        """
        Main timetable generation logic with per-subject pair scheduling
        
        PAIRED (schedule_in_pairs = True): 2 lectures per day, same room
        UNPAIRED (schedule_in_pairs = False): max 1 lecture per day
        
        RULES:
        1. Per-subject pair scheduling
        2. Pairs in same room
        3. Consecutive same-subject in same room
        4. Max 1 free lecture per day
        """
        
        # Initialize class timetable
        class_tt = {day: ["free"] * TOTAL_SLOTS for day in DAYS}
        
        # Track room occupancy
        occupied_rooms = defaultdict(set)
        
        # Track daily subject count
        daily_subject_count = {}
        
        # Track subject allocation
        subject_allocation = {}
        subject_remaining = {}
        for s in subjects:
            subject_code = self._get_subject_code(s)
            subject_allocation[subject_code] = 0
            subject_remaining[subject_code] = s["weekly_hours"]
        
        # Separate subjects based on pairing preference
        paired_subjects = [s for s in subjects if self._should_schedule_in_pairs(s)]
        unpaired_subjects = [s for s in subjects if not self._should_schedule_in_pairs(s)]
        
        # Sort by weekly hours (descending)
        paired_subjects = sorted(paired_subjects, key=lambda x: x["weekly_hours"], reverse=True)
        unpaired_subjects = sorted(unpaired_subjects, key=lambda x: x["weekly_hours"], reverse=True)
        
        print(f"DEBUG: Paired subjects (2/day): {[self._get_subject_code(s) for s in paired_subjects]}")
        print(f"DEBUG: Unpaired subjects (1/day): {[self._get_subject_code(s) for s in unpaired_subjects]}")
        
        # PHASE 1: Schedule PAIRED subjects (2 lectures per day, same room)
        for subject in paired_subjects:
            subject_code = self._get_subject_code(subject)
            faculty_id = subject["faculty_id"]
            available_rooms = self.filter_rooms_by_type(rooms, subject["subject_type"])
            
            if not available_rooms:
                continue
            
            # Schedule 2 lectures per day until all hours are allocated
            while subject_remaining[subject_code] >= 2:
                scheduled = False
                
                # Try each day
                for day in DAYS:
                    # Reset daily count for new day
                    if f"{day}_{subject_code}" not in daily_subject_count:
                        daily_subject_count[f"{day}_{subject_code}"] = 0
                    
                    # Try to schedule 2 lectures on this day
                    if self.try_schedule_pair(class_tt, occupied_rooms, day,
                                             subject, faculty_id, available_rooms,
                                             branch, class_name, sem, 
                                             daily_subject_count):
                        subject_allocation[subject_code] += 2
                        subject_remaining[subject_code] -= 2
                        scheduled = True
                        print(f"DEBUG: Scheduled pair for {subject_code} on {day}")
                        break
                
                if not scheduled:
                    print(f"WARNING: Could not schedule pair for {subject_code}, {subject_remaining[subject_code]} hours remaining")
                    break
        
        # PHASE 2: Schedule UNPAIRED subjects (max 1 lecture per day)
        for subject in unpaired_subjects:
            subject_code = self._get_subject_code(subject)
            faculty_id = subject["faculty_id"]
            available_rooms = self.filter_rooms_by_type(rooms, subject["subject_type"])
            
            if not available_rooms:
                continue
            
            # Schedule 1 lecture per day until all hours are allocated
            while subject_remaining[subject_code] > 0:
                scheduled = False
                
                # Try each day
                for day in DAYS:
                    # Reset daily count for new day if not exists
                    if f"{day}_{subject_code}" not in daily_subject_count:
                        daily_subject_count[f"{day}_{subject_code}"] = 0
                    
                    # Skip if already scheduled on this day
                    if daily_subject_count[f"{day}_{subject_code}"] >= 1:
                        continue
                    
                    # Try each slot
                    for slot_idx in range(TOTAL_SLOTS):
                        if self.try_schedule_single_lecture(class_tt, occupied_rooms, day, 
                                                           slot_idx, subject, faculty_id, 
                                                           available_rooms, branch, class_name, 
                                                           sem, daily_subject_count,
                                                           prefer_same_room=True):
                            subject_allocation[subject_code] += 1
                            subject_remaining[subject_code] -= 1
                            scheduled = True
                            print(f"DEBUG: Scheduled single lecture for {subject_code} on {day} slot {slot_idx}")
                            break
                    
                    if scheduled:
                        break
                
                if not scheduled:
                    print(f"WARNING: Could not schedule lecture for {subject_code}, {subject_remaining[subject_code]} hours remaining")
                    break
        
        # PHASE 3: Handle remaining hours for paired subjects (if odd number of hours)
        # If a paired subject has 1 hour left, it needs to be scheduled somewhere
        for subject in paired_subjects:
            subject_code = self._get_subject_code(subject)
            
            if subject_remaining[subject_code] <= 0:
                continue
            
            faculty_id = subject["faculty_id"]
            available_rooms = self.filter_rooms_by_type(rooms, subject["subject_type"])
            
            if not available_rooms:
                continue
            
            print(f"DEBUG: Paired subject {subject_code} has {subject_remaining[subject_code]} hours remaining (odd number)")
            
            # Try to schedule remaining single lectures
            while subject_remaining[subject_code] > 0:
                scheduled = False
                
                for day in DAYS:
                    # For remaining hours of paired subjects, we can add to days that have < 2
                    current_count = daily_subject_count.get(f"{day}_{subject_code}", 0)
                    if current_count >= 2:
                        continue
                    
                    for slot_idx in range(TOTAL_SLOTS):
                        if class_tt[day][slot_idx] != "free":
                            continue
                        
                        if not self.is_faculty_free(faculty_id, day, slot_idx):
                            continue
                        
                        # Try to use same room as other lectures on this day
                        preferred_room = None
                        if slot_idx > 0:
                            prev_subject = self.get_subject_at_slot(class_tt, day, slot_idx - 1)
                            if prev_subject == subject_code:
                                preferred_room = self.get_room_at_slot(class_tt, day, slot_idx - 1)
                        
                        room_to_use = None
                        if preferred_room and preferred_room in available_rooms:
                            if self.is_room_free(preferred_room, day, slot_idx, occupied_rooms):
                                room_to_use = preferred_room
                        
                        if not room_to_use:
                            for room in available_rooms:
                                if self.is_room_free(room, day, slot_idx, occupied_rooms):
                                    room_to_use = room
                                    break
                        
                        if room_to_use:
                            slot_name = TIME_SLOTS[slot_idx]
                            lecture = self.create_lecture_entry(
                                branch, class_name, sem, slot_name,
                                subject_code, room_to_use
                            )
                            class_tt[day][slot_idx] = lecture
                            
                            key = f"{day}_{slot_idx}"
                            occupied_rooms[key].add(room_to_use)
                            
                            count_key = f"{day}_{subject_code}"
                            daily_subject_count[count_key] = daily_subject_count.get(count_key, 0) + 1
                            
                            subject_allocation[subject_code] += 1
                            subject_remaining[subject_code] -= 1
                            scheduled = True
                            print(f"DEBUG: Scheduled remaining hour for {subject_code} on {day} slot {slot_idx}")
                            break
                    
                    if scheduled:
                        break
                
                if not scheduled:
                    break
        
        # Calculate statistics
        total_lectures = sum(
            1 for day in DAYS for slot in class_tt[day] if slot != "free"
        )
        free_lectures = sum(
            1 for day in DAYS for slot in class_tt[day] if slot == "free"
        )
        
        # Calculate daily lecture count and free lectures per day
        daily_lecture_count = {}
        daily_free_count = {}
        for day in DAYS:
            daily_lecture_count[day] = sum(
                1 for slot in class_tt[day] if slot != "free"
            )
            daily_free_count[day] = self.count_free_lectures_on_day(class_tt, day)
        
        # Validation checks
        errors = []
        warnings = []
        
        # Check if all subjects got required hours
        for subject in subjects:
            subject_code = self._get_subject_code(subject)
            required = subject["weekly_hours"]
            allocated = subject_allocation[subject_code]
            if allocated < required:
                errors.append(
                    f"Subject '{subject_code}' allocated {allocated}/{required} hours"
                )
            elif allocated > required:
                warnings.append(
                    f"Subject '{subject_code}' over-allocated: {allocated}/{required} hours"
                )
        
        # RULE 4: Check if any day has more than 1 free lecture
        for day, free_count in daily_free_count.items():
            if free_count > MAX_FREE_LECTURES_PER_DAY:
                warnings.append(
                    f"{day.upper()} has {free_count} free lectures (max allowed: {MAX_FREE_LECTURES_PER_DAY})"
                )
        
        # Check free lecture limit (warning, not error)
        if free_lectures > max_free_lectures:
            warnings.append(
                f"Total free lectures ({free_lectures}) exceed recommended limit ({max_free_lectures})"
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
            "daily_count": daily_lecture_count,
            "daily_free_count": daily_free_count
        }
    
    def update_faculty_timetables(self, class_tt, branch, class_name, sem, subjects):
        """Update faculty timetables based on generated class timetable"""
        
        # Create faculty mapping
        faculty_map = {}
        for s in subjects:
            subject_code = self._get_subject_code(s)
            faculty_map[subject_code] = s["faculty_id"]
        
        # Track faculty updates
        updated_faculties = set()
        
        for day in DAYS:
            for slot_idx, lecture in enumerate(class_tt[day]):
                if lecture == "free":
                    continue
                
                # Parse lecture string to get subject code
                parts = lecture.split("-")
                if len(parts) >= 5:
                    subject_code = parts[4]
                    
                    if subject_code in faculty_map:
                        faculty_id = faculty_map[subject_code]
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
    
    Per-subject pair scheduling:
    - schedule_in_pairs = True: 2 lectures per day (paired), same room
    - schedule_in_pairs = False: max 1 lecture per day (unpaired)
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
            if not any(field in subject for field in ["_id", "subject_code", "subject_id"]):
                return jsonify({"error": f"Subject must have '_id', 'subject_code', or 'subject_id' field"}), 400
            
            required_fields = ["weekly_hours", "subject_type", "faculty_id"]
            if not all(field in subject for field in required_fields):
                return jsonify({"error": f"Invalid subject structure"}), 400
            
            # schedule_in_pairs is optional, defaults to False
            if "schedule_in_pairs" not in subject:
                subject["schedule_in_pairs"] = False
        
        # Calculate total required lectures
        total_required_lectures = sum(s["weekly_hours"] for s in subjects)
        total_available_slots = 6 * TOTAL_SLOTS
        
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
        
        # Check for critical errors
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
                    "daily_lecture_count": result["daily_count"],
                    "daily_free_count": result.get("daily_free_count", {})
                }
            }), 400
        
        # Update faculty timetables
        updated_faculties = generator.update_faculty_timetables(
            result["timetable"], branch, class_name, sem, subjects
        )
        
        # Calculate average lectures per day
        total_lectures = result["total_lectures"]
        avg_lectures_per_day = total_lectures // 6
        
        # Update classwise_faculty collection
        class_id = f"sem{sem}_{branch.lower().replace('(', '').replace(')', '')}_{class_name.lower()}"
        
        faculty_ids = list(set(s["faculty_id"] for s in subjects))
        
        subject_codes = []
        for s in subjects:
            subject_code = generator._get_subject_code(s)
            subject_codes.append(subject_code)
        subject_codes = list(set(subject_codes))
        
        generator.classwise_col.update_one(
            {"_id": class_id},
            {
                "$set": {
                    "sem": sem,
                    "branch": branch,
                    "class": class_name,
                    "allowed_faculty": faculty_ids,
                    "allowed_subjects": subject_codes,
                    "avg_lectures_per_day": avg_lectures_per_day
                }
            },
            upsert=True
        )
        
        # Count paired vs unpaired subjects
        paired_count = sum(1 for s in subjects if s.get("schedule_in_pairs", False))
        unpaired_count = len(subjects) - paired_count
        
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
                "daily_lecture_count": result["daily_count"],
                "daily_free_count": result.get("daily_free_count", {}),
                "paired_subjects_count": paired_count,
                "unpaired_subjects_count": unpaired_count
            },
            "warnings": result.get("warnings", []),
            "faculty_updated": updated_faculties
        }), 200
        
    except Exception as e:
        print("ERROR in auto_generate_timetable:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


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


# ============================================================================
# BRANCH-WIDE TIMETABLE GENERATION
# ============================================================================

class BranchTimetableGenerator:
    def __init__(self, db):
        self.db = db
        self.faculty_tt_col = db.faculty_timetable
        self.classwise_col = db.classwise_faculty
        self.global_faculty_availability = {}
    
    def _get_subject_code(self, subject):
        if "_id" in subject:
            return subject["_id"]
        elif "subject_code" in subject:
            return subject["subject_code"]
        elif "subject_id" in subject:
            return subject["subject_id"]
        else:
            raise KeyError("Subject must have identifier field")
    
    def _should_schedule_in_pairs(self, subject):
        return subject.get("schedule_in_pairs", False)
    
    def initialize_global_faculty_availability(self):
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
    
    # [Include all the same methods as TimetableGenerator but with global faculty tracking]
    # For brevity, using the same logic as TimetableGenerator
    # The key difference is using self.global_faculty_availability instead of querying DB each time
    
    def generate_division_timetable(self, branch, class_name, sem, rooms, subjects, 
                                   lectures_per_day, max_free_lectures):
        """Use same logic as TimetableGenerator.generate_timetable"""
        # Create a temporary generator instance
        temp_gen = TimetableGenerator(self.db)
        
        # Override faculty checking to use global availability
        original_is_faculty_free = temp_gen.is_faculty_free
        
        def is_faculty_free_global(faculty_id, day, slot_index):
            if faculty_id not in self.global_faculty_availability:
                self.global_faculty_availability[faculty_id] = {
                    d: ["free"] * TOTAL_SLOTS for d in DAYS
                }
            return self.global_faculty_availability[faculty_id][day][slot_index] == "free"
        
        temp_gen.is_faculty_free = is_faculty_free_global
        
        # Generate timetable
        result = temp_gen.generate_timetable(
            branch, class_name, sem, rooms, subjects,
            lectures_per_day, max_free_lectures
        )
        
        # Update global faculty availability
        for day in DAYS:
            for slot_idx, lecture in enumerate(result["timetable"][day]):
                if lecture != "free":
                    parts = lecture.split("-")
                    if len(parts) >= 5:
                        subject_code = parts[4]
                        for s in subjects:
                            if temp_gen._get_subject_code(s) == subject_code:
                                faculty_id = s["faculty_id"]
                                if faculty_id not in self.global_faculty_availability:
                                    self.global_faculty_availability[faculty_id] = {
                                        d: ["free"] * TOTAL_SLOTS for d in DAYS
                                    }
                                self.global_faculty_availability[faculty_id][day][slot_idx] = lecture
                                break
        
        return result
    
    def save_faculty_timetables(self):
        updated_count = 0
        errors = []
        
        for faculty_id, timetable in self.global_faculty_availability.items():
            has_lectures = any(
                slot != "free" 
                for day in DAYS 
                for slot in timetable[day]
            )
            
            if has_lectures:
                try:
                    normalized_timetable = {
                        day: normalize_day_slots(timetable[day])
                        for day in DAYS
                    }
                    
                    result = self.faculty_tt_col.update_one(
                        {"_id": faculty_id},
                        {"$set": {"timetable": normalized_timetable}},
                        upsert=True
                    )
                    
                    if result.modified_count > 0 or result.upserted_id:
                        updated_count += 1
                        
                except Exception as e:
                    errors.append(f"Failed to update faculty {faculty_id}: {str(e)}")
        
        return updated_count, errors


def auto_generate_branch_timetable():
    """Branch-wide timetable generation with per-subject pair scheduling"""
    try:
        data = request.get_json()
        
        branch = data.get("branch")
        sem = data.get("sem")
        divisions = data.get("divisions", [])
        shared_rooms = data.get("shared_rooms", [])
        lectures_per_day = data.get("lectures_per_day", 4)
        max_free_lectures = data.get("max_valid_free_lectures", 6)
        
        if not all([branch, sem, divisions]):
            return jsonify({"error": "Missing required fields"}), 400
        
        if not isinstance(divisions, list) or len(divisions) == 0:
            return jsonify({"error": "Divisions list is empty"}), 400
        
        for div in divisions:
            required_fields = ["class_name", "subjects"]
            if not all(field in div for field in required_fields):
                return jsonify({"error": "Invalid division structure"}), 400
            
            if "rooms" not in div:
                div["rooms"] = []
            
            for subject in div["subjects"]:
                if "schedule_in_pairs" not in subject:
                    subject["schedule_in_pairs"] = False
        
        generator = BranchTimetableGenerator(db)
        generator.initialize_global_faculty_availability()
        
        division_results = {}
        all_errors = []
        all_warnings = []
        all_faculty_updated = set()
        
        for division in divisions:
            class_name = division["class_name"]
            subjects = division["subjects"]
            available_rooms = list(set(shared_rooms + division.get("rooms", [])))
            
            if not available_rooms:
                all_errors.append(f"No rooms available for {class_name}")
                continue
            
            result = generator.generate_division_timetable(
                branch, class_name, sem, available_rooms, subjects,
                lectures_per_day, max_free_lectures
            )
            
            division_results[class_name] = result
            
            if result["errors"]:
                all_errors.extend([f"{class_name}: {err}" for err in result["errors"]])
            
            if result["warnings"]:
                all_warnings.extend([f"{class_name}: {warn}" for warn in result["warnings"]])
            
            faculty_ids = set(s["faculty_id"] for s in subjects)
            subject_codes = []
            for s in subjects:
                try:
                    subject_code = generator._get_subject_code(s)
                    subject_codes.append(subject_code)
                except KeyError:
                    continue
            subject_codes = list(set(subject_codes))
            
            all_faculty_updated.update(faculty_ids)
            
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
                        "allowed_subjects": subject_codes,
                        "avg_lectures_per_day": avg_lectures_per_day
                    }
                },
                upsert=True
            )
        
        if all_errors:
            return jsonify({
                "success": False,
                "errors": all_errors,
                "warnings": all_warnings
            }), 400
        
        faculty_update_count, faculty_errors = generator.save_faculty_timetables()
        
        if faculty_errors:
            all_warnings.extend([f"Faculty update: {err}" for err in faculty_errors])
        
        response_data = {
            "success": True,
            "message": f"Timetables generated for {len(divisions)} divisions",
            "branch": branch,
            "semester": sem,
            "divisions": {}
        }
        
        for div_name, result in division_results.items():
            response_data["divisions"][div_name] = {
                "timetable": result["timetable"],
                "stats": {
                    "total_lectures": result["total_lectures"],
                    "free_lectures": result["free_lectures"],
                    "subject_allocation": result["subject_allocation"],
                    "daily_lecture_count": result["daily_count"],
                    "daily_free_count": result.get("daily_free_count", {})
                }
            }
        
        response_data["warnings"] = all_warnings
        response_data["faculty_updated"] = list(all_faculty_updated)
        response_data["faculty_update_count"] = faculty_update_count
        
        return jsonify(response_data), 200
        
    except Exception as e:
        print("ERROR in auto_generate_branch_timetable:", e)
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


def get_branch_divisions():
    """Helper endpoint"""
    try:
        branch = request.args.get("branch")
        sem = request.args.get("sem")
        
        if not branch or not sem:
            return jsonify({"error": "Missing branch or semester"}), 400
        
        safe_branch = branch.lower().replace("(", "").replace(")", "")
        pattern = f"sem{sem}_{safe_branch}_"
        
        divisions = list(db.classwise_faculty.find({"_id": {"$regex": f"^{pattern}"}}))
        
        division_list = [
            {
                "class_name": div.get("class", ""),
                "class_id": div["_id"],
                "faculty_count": len(div.get("allowed_faculty", [])),
                "subject_count": len(div.get("allowed_subjects", [])),
                "avg_lectures_per_day": div.get("avg_lectures_per_day", 0)
            }
            for div in divisions
        ]
        
        return jsonify({
            "success": True,
            "branch": branch,
            "semester": sem,
            "divisions": division_list,
            "total": len(division_list)
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
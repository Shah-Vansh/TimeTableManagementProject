from flask import request, jsonify
from collections import defaultdict
from itertools import groupby
import random
from app.database.mongo import db

# ──────────────────────────────────────────────
#  CONSTANTS
# ──────────────────────────────────────────────
DAYS       = ["mon", "tue", "wed", "thu", "fri", "sat"]
TOTAL_SLOTS = 4
TIME_SLOTS  = [f"Time Slot {i + 1}" for i in range(TOTAL_SLOTS)]


# ──────────────────────────────────────────────
#  HELPERS
# ──────────────────────────────────────────────
def normalize_day_slots(day_data):
    if not day_data:
        return ["free"] * TOTAL_SLOTS
    result = list(day_data)
    if len(result) < TOTAL_SLOTS:
        result += ["free"] * (TOTAL_SLOTS - len(result))
    return result[:TOTAL_SLOTS]


def get_rooms_for_type(subject_type, rooms):
    """
    Room allocation rules:
      - practical : MUST use lab rooms (hard constraint).
                    Falls back to all rooms only if no labs exist in the pool.
      - theory    : PREFER classrooms, but can use ANY room including labs as
                    overflow. ("for theory no restrictions" per user requirement)
    Classrooms are listed before labs in the theory return so the generator
    fills classrooms first and only spills into labs when they are full.
    """
    if subject_type == "practical":
        labs = [r for r in rooms if "lab" in r.lower()]
        return labs if labs else rooms          # must use lab; fallback all

    # theory / any other type — no room restriction
    classrooms = [r for r in rooms if "lab" not in r.lower()]
    labs       = [r for r in rooms if "lab" in r.lower()]
    # classrooms first (preferred), labs as overflow
    return classrooms + labs if classrooms else rooms


def make_lecture_str(branch, cname, sem, slot_name, sname, room):
    return f"{branch}-{cname}-Sem{sem}-{slot_name}-{sname}-{room}"


def score_timetables(all_tts, all_divisions_subjects):
    """
    Score all timetables combined. Higher = better.

    Scoring priorities (in order of weight):
      1. Completeness   — every required hour must be scheduled           (+10/hr)
      2. Variety        — same subject in the same TIME SLOT across days  (-6 each)
                          same subject consecutively on adjacent days      (-3 each)
      3. Compactness    — free slots must fall at END of day              (-5/gap)
      4. Spread         — subjects spread across different days            (+1 each unique day)
    """
    score = 0
    for div, subjects in all_divisions_subjects.items():
        tt = all_tts.get(div, {})
        allocated  = defaultdict(int)

        # slot_subject[slot_idx] = list of subject names scheduled in that slot across days
        slot_subject_count = defaultdict(lambda: defaultdict(int))  # slot -> sname -> days count

        for day in DAYS:
            slots = tt.get(day, [])

            for slot_idx, slot_val in enumerate(slots):
                if slot_val != "free":
                    for sub in subjects:
                        sname = sub["subject_name"]
                        if sname in slot_val:
                            allocated[sname] += 1
                            slot_subject_count[slot_idx][sname] += 1

            # Compactness: no free gaps before the last lecture
            last_lec = max((i for i, s in enumerate(slots) if s != "free"), default=-1)
            if last_lec >= 0:
                gap_found = False
                for i in range(last_lec):
                    if slots[i] == "free":
                        score -= 5   # mid-day gap penalty
                        gap_found = True
                if not gap_found:
                    score += 2       # compact day bonus

        # Completeness
        for sub in subjects:
            diff = sub["weekly_hours"] - allocated[sub["subject_name"]]
            if diff <= 0:
                score += 10 * sub["weekly_hours"]
            else:
                score -= 8 * diff

        # Variety penalty: if the same subject appears in the same slot on many days
        # e.g. IP in slot 0 every single day = very bad
        for slot_idx, sname_counts in slot_subject_count.items():
            for sname, count in sname_counts.items():
                if count > 1:
                    score -= 6 * (count - 1)   # -6 for each "duplicate" slot appearance

        # Spread bonus: reward subject appearing on different days
        for sub in subjects:
            sname = sub["subject_name"]
            days_with_subject = sum(
                1 for day in DAYS
                for s in tt.get(day, [])
                if s != "free" and sname in s
            )
            score += 1 * days_with_subject   # reward spreading across days

        # Consecutive same-subject penalty: if same subject on adjacent days in same slot
        for slot_idx in range(TOTAL_SLOTS):
            prev_sub = None
            for day in DAYS:
                slots = tt.get(day, [])
                cur = None
                if slot_idx < len(slots) and slots[slot_idx] != "free":
                    for sub in subjects:
                        if sub["subject_name"] in slots[slot_idx]:
                            cur = sub["subject_name"]
                            break
                if cur and cur == prev_sub:
                    score -= 3   # same subject in same slot on consecutive days
                prev_sub = cur

    return score


# ══════════════════════════════════════════════
#  GLOBAL TIMETABLE GENERATOR
# ══════════════════════════════════════════════
class GlobalTimetableGenerator:
    """
    Schedules ALL divisions simultaneously to prevent any one division from
    monopolising shared faculty or rooms before other divisions get a chance.

    Key design decisions
    ────────────────────
    1. Work units (one per lecture-hour per subject per division) are sorted by
       faculty scarcity: subjects whose faculty teaches MORE total hours get
       scheduled first because they are hardest to fit.

    2. Multiple random-shuffle attempts are run; the best-scoring result is kept.

    3. Per-subject per-day limit: max(2, ceil(weekly_hours / n_days)) so that
       high-hour subjects (e.g. 5h across 6 days) can appear twice on a day when
       needed, while low-hour subjects stay at 1/day.

    4. Days are tried in ascending order of current load (least-loaded first)
       to spread lectures evenly and keep free time at the end naturally.

    5. Rooms are tried in order; the first free room that matches the subject
       type is used. This avoids room conflicts with minimal overhead.
    """

    def __init__(self, db_conn, lectures_per_day=TOTAL_SLOTS):
        self.db              = db_conn
        self.faculty_tt_col  = db_conn.faculty_timetable
        self.classwise_col   = db_conn.classwise_faculty
        self.LECTURES_PER_DAY = min(int(lectures_per_day), TOTAL_SLOTS)

        # Shared global clash trackers
        self.faculty_busy = defaultdict(lambda: defaultdict(set))
        self.room_busy    = defaultdict(lambda: defaultdict(set))

    # ── Load pre-existing faculty schedules from DB ─────────────
    def load_existing_faculty(self):
        for doc in self.faculty_tt_col.find({}):
            fid = doc["_id"]
            for day in DAYS:
                for idx, slot in enumerate(normalize_day_slots(doc.get("timetable", {}).get(day, []))):
                    if slot != "free":
                        self.faculty_busy[fid][day].add(idx)

    # ── Existence snapshot for rollback ─────────────────────────
    def _snap(self):
        fb = {fid: {d: set(s) for d, s in dm.items()}
              for fid, dm in self.faculty_busy.items()}
        rb = {room: {d: set(s) for d, s in dm.items()}
              for room, dm in self.room_busy.items()}
        return fb, rb

    def _restore(self, fb, rb):
        self.faculty_busy.clear()
        for fid, dm in fb.items():
            for d, s in dm.items():
                self.faculty_busy[fid][d] = set(s)
        self.room_busy.clear()
        for room, dm in rb.items():
            for d, s in dm.items():
                self.room_busy[room][d] = set(s)

    # ── Post-process: compact each day so free slots fall at the END ──
    def _compact_timetables(self, tts, divisions):
        """
        After scheduling, some days may have free slots sandwiched between
        lectures (e.g. [IP, free, OS, free]).  This function slides all
        lectures to the front so free slots move to the end:
        [IP, OS, free, free].

        Constraints respected during compaction:
          • Faculty clash: the faculty of the moved lecture must be free at
            the target slot on that day (checked against global tracker).
          • Room clash:    same check for the room.
          • If a move is blocked by a clash, we leave that slot in place to
            avoid corrupting the clash-free guarantee.

        We only swap *within* a single division's day, so cross-division
        clashes are never introduced.
        """
        fac_map = {}
        for div in divisions:
            cname = div["class_name"]
            fac_map[cname] = {sub["subject_name"]: sub["faculty_id"]
                              for sub in div["subjects"]}

        for cname, tt in tts.items():
            for day in DAYS:
                slots = tt[day]
                # Bubble lectures toward the front, free toward the back
                changed = True
                while changed:
                    changed = False
                    for i in range(len(slots) - 1):
                        if slots[i] == "free" and slots[i + 1] != "free":
                            lec = slots[i + 1]

                            # Find faculty and room of this lecture
                            lec_fid  = None
                            lec_room = lec.split("-")[-1]
                            for sname, fid in fac_map[cname].items():
                                if sname in lec:
                                    lec_fid = fid
                                    break

                            # Check if moving lec from slot i+1 → slot i is safe
                            fac_ok  = (lec_fid is None or
                                       i not in self.faculty_busy[lec_fid][day] or
                                       (i + 1) in self.faculty_busy[lec_fid][day])
                            room_ok = (i not in self.room_busy[lec_room][day] or
                                       (i + 1) in self.room_busy[lec_room][day])

                            if fac_ok and room_ok:
                                # Perform the swap in the timetable
                                slots[i], slots[i + 1] = slots[i + 1], slots[i]

                                # Update global trackers
                                if lec_fid:
                                    self.faculty_busy[lec_fid][day].discard(i + 1)
                                    self.faculty_busy[lec_fid][day].add(i)
                                self.room_busy[lec_room][day].discard(i + 1)
                                self.room_busy[lec_room][day].add(i)

                                changed = True

        return tts

    # ── Core: one scheduling attempt ────────────────────────────
    def _attempt(self, branch, sem, divisions, shared_rooms):
        """
        Run one scheduling pass over all divisions simultaneously.

        Variety strategy
        ────────────────
        For each work unit we pick a (day, slot) pair that:
          a) Is free for the faculty and has a free room
          b) Prefers days where this subject has NOT appeared yet
          c) Prefers slots where this subject has NOT appeared yet across other days
          d) Respects the left-pack rule so free time falls at the end

        We do this by scoring each candidate (day, slot) and picking the best,
        with small random jitter so different attempts produce different layouts.
        """
        # Build per-division room pools
        div_rooms = {}
        for div in divisions:
            cname = div["class_name"]
            div_rooms[cname] = list(set(shared_rooms + div.get("rooms", [])))

        # Initialise timetables and remaining counts
        tts = {div["class_name"]: {day: ["free"] * TOTAL_SLOTS for day in DAYS}
               for div in divisions}
        rem = {div["class_name"]: {sub["subject_name"]: sub["weekly_hours"]
                                   for sub in div["subjects"]}
               for div in divisions}

        # ── Faculty scarcity: total hours each faculty teaches across all divs ──
        fac_hours = defaultdict(int)
        for div in divisions:
            for sub in div["subjects"]:
                fac_hours[sub["faculty_id"]] += sub["weekly_hours"]

        # ── Build expanded work-unit list ──
        work = []
        for div in divisions:
            cname = div["class_name"]
            for sub in div["subjects"]:
                priority = fac_hours[sub["faculty_id"]]
                for _ in range(sub["weekly_hours"]):
                    work.append((priority, cname, sub))

        # Sort descending by priority, shuffle within equal-priority groups
        work.sort(key=lambda x: -x[0])
        shuffled = []
        for pri, grp in groupby(work, key=lambda x: x[0]):
            g = list(grp)
            random.shuffle(g)
            shuffled.extend(g)

        # ── Helper: count how many days this subject already has a lecture
        #            in slot `idx` across the whole week ──
        def slot_repeat_count(tt, sname, idx):
            return sum(
                1 for d in DAYS
                if tt[d][idx] != "free" and sname in tt[d][idx]
            )

        def days_with_subject(tt, sname):
            return {d for d in DAYS
                    if any(sname in s for s in tt[d] if s != "free")}

        # ── Place each work unit ──
        for (pri, cname, sub) in shuffled:
            sname = sub["subject_name"]
            fid   = sub["faculty_id"]
            if rem[cname][sname] <= 0:
                continue

            tt    = tts[cname]
            avail = get_rooms_for_type(sub.get("subject_type", "theory"), div_rooms[cname])
            orig  = sub["weekly_hours"]
            max_pd = max(2, -(-orig // len(DAYS)))

            # Already-used days for this subject (variety: prefer unused days)
            used_days = days_with_subject(tt, sname)

            # Collect all feasible (day, slot_idx, room) candidates and score them
            candidates = []

            for day in DAYS:
                cur_lecs  = sum(1 for s in tt[day] if s != "free")
                sub_today = sum(1 for s in tt[day] if s != "free" and sname in s)

                if sub_today >= max_pd:                    continue
                if cur_lecs >= self.LECTURES_PER_DAY:      continue

                for idx in range(TOTAL_SLOTS):
                    if tt[day][idx] != "free":               continue
                    if idx in self.faculty_busy[fid][day]:   continue

                    for room in avail:
                        if idx not in self.room_busy[room][day]:
                            # ── Variety score for this candidate ──
                            variety = 0

                            # Strongly prefer days where subject not yet scheduled
                            if day not in used_days:
                                variety += 20

                            # Prefer slots where this subject hasn't appeared yet
                            repeats = slot_repeat_count(tt, sname, idx)
                            variety -= 8 * repeats          # heavy penalty for slot repeats

                            # Prefer earlier slots (left-pack → free at end)
                            variety -= idx * 2

                            # Prefer days with fewer lectures (spread load evenly)
                            variety -= cur_lecs * 3

                            # Small random jitter so each attempt explores differently
                            variety += random.uniform(-2, 2)

                            candidates.append((variety, day, idx, room))
                            break   # one room per (day, slot) combo is enough

            if not candidates:
                continue  # truly stuck, skip this unit

            # Pick the highest-scoring candidate
            candidates.sort(key=lambda x: -x[0])
            _, best_day, best_idx, best_room = candidates[0]

            lec = make_lecture_str(branch, cname, sem, TIME_SLOTS[best_idx], sname, best_room)
            tt[best_day][best_idx] = lec
            self.faculty_busy[fid][best_day].add(best_idx)
            self.room_busy[best_room][best_day].add(best_idx)
            rem[cname][sname] -= 1

        return tts, rem

    # ── Main entry: multi-attempt best-of ───────────────────────
    def generate(self, branch, sem, divisions, shared_rooms, max_attempts=600):
        base_snap = self._snap()   # state before ANY division is scheduled

        best_tts   = None
        best_rem   = None
        best_score = float("-inf")

        all_subjects = {div["class_name"]: div["subjects"] for div in divisions}

        for attempt in range(max_attempts):
            self._restore(*base_snap)

            tts, rem = self._attempt(branch, sem, divisions, shared_rooms)

            # Compact each day: push free slots to the end
            tts = self._compact_timetables(tts, divisions)

            sc = score_timetables(tts, all_subjects)
            if sc > best_score:
                best_score = sc
                best_tts   = {div: {d: list(v) for d, v in tt.items()} for div, tt in tts.items()}
                best_rem   = {div: dict(r) for div, r in rem.items()}

            if all(v == 0 for dr in rem.values() for v in dr.values()):
                break   # perfect solution found

        # Replay best result onto global state
        self._restore(*base_snap)
        if best_tts:
            fac_map = {}
            for div in divisions:
                fac_map[div["class_name"]] = {sub["subject_name"]: sub["faculty_id"]
                                               for sub in div["subjects"]}
            for cname, tt in best_tts.items():
                for day in DAYS:
                    for idx, lec_str in enumerate(tt[day]):
                        if lec_str == "free": continue
                        room = lec_str.split("-")[-1]
                        self.room_busy[room][day].add(idx)
                        for sname, fid in fac_map[cname].items():
                            if sname in lec_str:
                                self.faculty_busy[fid][day].add(idx)
                                break

        # Build per-division results
        results     = {}
        all_success = True
        for div in divisions:
            cname    = div["class_name"]
            subjects = div["subjects"]
            tt       = best_tts.get(cname, {day: ["free"] * TOTAL_SLOTS for day in DAYS})
            div_rem  = best_rem.get(cname, {})
            success  = all(div_rem.get(s["subject_name"], 0) == 0 for s in subjects)
            alloc    = {s["subject_name"]: s["weekly_hours"] - div_rem.get(s["subject_name"], s["weekly_hours"])
                        for s in subjects}

            results[cname] = {
                "timetable":          tt,
                "subject_allocation": alloc,
                "subject_remaining":  div_rem,
                "success":            success,
            }
            if not success:
                all_success = False

        return results, all_success

    # ── Validate ─────────────────────────────────────────────────
    def validate(self, results, divisions):
        errors, warnings = [], []
        req = {f"{div['class_name']}_{sub['subject_name']}": sub["weekly_hours"]
               for div in divisions for sub in div["subjects"]}

        for cname, result in results.items():
            if not result["success"]:
                errors.append(f"{cname}: Failed to generate a complete timetable.")
                for sname, hrs in result.get("subject_remaining", {}).items():
                    if hrs > 0:
                        errors.append(f"  -> {cname}: '{sname}' is short by {hrs} hour(s).")
                continue

            tt = result["timetable"]
            for day in DAYS:
                slots    = tt[day]
                last_lec = max((i for i, s in enumerate(slots) if s != "free"), default=-1)
                for i in range(last_lec):
                    if slots[i] == "free":
                        warnings.append(f"{cname}: {day} has a gap at slot {i + 1}.")
                        break

            for sname, alloc in result.get("subject_allocation", {}).items():
                needed = req.get(f"{cname}_{sname}", 0)
                if alloc < needed:
                    errors.append(f"{cname}: '{sname}' allocated {alloc}/{needed} hours.")
                elif alloc > needed:
                    warnings.append(f"{cname}: '{sname}' over-allocated {alloc}/{needed}.")

        return errors, warnings

    # ── Statistics ───────────────────────────────────────────────
    def statistics(self, results):
        return {
            "total_divisions":      len(results),
            "successful_divisions": sum(1 for r in results.values() if r["success"]),
            "total_lectures":       sum(1 for r in results.values()
                                        for d in DAYS
                                        for s in r.get("timetable", {}).get(d, [])
                                        if s != "free"),
            "total_free_lectures":  sum(1 for r in results.values()
                                        for d in DAYS
                                        for s in r.get("timetable", {}).get(d, [])
                                        if s == "free"),
        }

    # ── Save to DB ───────────────────────────────────────────────
    def save(self, results, branch, sem, divisions):
        saved           = 0
        faculty_updated = set()
        safe_branch     = branch.lower().replace("(", "").replace(")", "")

        for div in divisions:
            cname  = div["class_name"]
            result = results.get(cname)
            if not result or not result["success"]:
                continue

            tt       = result["timetable"]
            class_id = f"sem{sem}_{safe_branch}_{cname.lower()}"
            fac_ids  = list({sub["faculty_id"] for sub in div["subjects"]})
            total_lecs = sum(1 for d in DAYS for s in tt[d] if s != "free")

            # classwise_faculty
            self.classwise_col.update_one(
                {"_id": class_id},
                {"$set": {
                    "sem":                  sem,
                    "branch":               branch,
                    "class":                cname,
                    "allowed_faculty":      fac_ids,
                    "timetable":            tt,
                    "avg_lectures_per_day": total_lecs // len(DAYS),
                }},
                upsert=True,
            )

            # faculty_timetable — update each occupied slot
            fac_map = {sub["subject_name"]: sub["faculty_id"] for sub in div["subjects"]}
            for day in DAYS:
                for idx, lec_str in enumerate(tt[day]):
                    if lec_str == "free": continue
                    for sname, fid in fac_map.items():
                        if sname in lec_str:
                            faculty_updated.add(fid)
                            self.faculty_tt_col.update_one(
                                {"_id": fid},
                                {"$set": {
                                    f"timetable.{day}.{idx}": lec_str,
                                    "name": fid,
                                }},
                                upsert=True,
                            )
                            break

            saved += 1

        return saved, list(faculty_updated)


# ══════════════════════════════════════════════════════════════
#  ENDPOINT: POST /api/timetable/auto-generate-branch
# ══════════════════════════════════════════════════════════════
def auto_generate_branch_timetable():
    try:
        data = request.get_json()

        branch           = (data.get("branch") or "").strip()
        sem              = data.get("sem")
        divisions        = data.get("divisions", [])
        shared_rooms     = data.get("shared_rooms", [])
        lectures_per_day = int(data.get("lectures_per_day", TOTAL_SLOTS))

        # ── Basic validation ──────────────────────────────────
        missing = [f for f in ["branch", "sem", "divisions"] if not data.get(f)]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        if not isinstance(divisions, list) or not divisions:
            return jsonify({"error": "divisions list is empty"}), 400

        for i, div in enumerate(divisions):
            for field in ("class_name", "subjects"):
                if field not in div:
                    return jsonify({"error": f"Division {i}: missing '{field}'"}), 400
            if not div["subjects"]:
                return jsonify({"error": f"Division {div.get('class_name', i)}: no subjects"}), 400
            for sub in div["subjects"]:
                for sf in ("subject_name", "weekly_hours", "subject_type", "faculty_id"):
                    if sf not in sub:
                        return jsonify({"error": f"Division {div['class_name']}: subject missing '{sf}'"}), 400
                sub.setdefault("schedule_in_pairs", False)
                sub["weekly_hours"] = int(sub["weekly_hours"])

        # ── Check if timetable already exists ─────────────────
        safe_branch = branch.lower().replace("(", "").replace(")", "")
        for div in divisions:
            cname    = div["class_name"]
            class_id = f"sem{sem}_{safe_branch}_{cname.lower()}"
            existing = db.classwise_faculty.find_one(
                {"_id": class_id, "timetable": {"$exists": True}}
            )
            if existing:
                tt = existing.get("timetable", {})
                has_lectures = any(
                    slot != "free"
                    for day in DAYS
                    for slot in tt.get(day, [])
                )
                if has_lectures:
                    return jsonify({
                        "error": (
                            f"Timetable for '{branch}' Semester {sem} Division '{cname}' "
                            f"already exists (id: {class_id}). "
                            f"Delete or reset it before regenerating."
                        )
                    }), 409

        # ── Hard feasibility check ────────────────────────────
        # Only reject if raw slot count is impossible even with max 2 same-subject/day
        max_possible = len(DAYS) * lectures_per_day
        for div in divisions:
            total_hrs = sum(sub["weekly_hours"] for sub in div["subjects"])
            if total_hrs > max_possible:
                return jsonify({
                    "error": (
                        f"Division {div['class_name']}: impossible schedule. "
                        f"Needs {total_hrs}h but only {max_possible} slots available "
                        f"({len(DAYS)} days x {lectures_per_day} slots/day). "
                        f"Reduce weekly hours or increase lectures_per_day."
                    )
                }), 400

        # ── Room availability check ───────────────────────────
        if not shared_rooms:
            return jsonify({"error": "No shared rooms provided"}), 400

        # Separate lab vs classroom counts for a smarter feasibility check
        lab_rooms   = [r for r in shared_rooms if "lab" in r.lower()]
        class_rooms = [r for r in shared_rooms if "lab" not in r.lower()]

        total_practical_lecs = sum(
            sub["weekly_hours"]
            for div in divisions for sub in div["subjects"]
            if sub.get("subject_type") == "practical"
        )
        total_theory_lecs = sum(
            sub["weekly_hours"]
            for div in divisions for sub in div["subjects"]
            if sub.get("subject_type") != "practical"
        )

        lab_slots   = len(lab_rooms)   * len(DAYS) * lectures_per_day
        class_slots = len(class_rooms) * len(DAYS) * lectures_per_day
        # Theory can overflow into labs, so total usable for theory = all slots
        total_slots = len(shared_rooms) * len(DAYS) * lectures_per_day

        room_warnings = []

        # Hard check: practical lectures MUST fit in lab slots
        if lab_slots < total_practical_lecs:
            return jsonify({
                "error": (
                    f"Not enough lab rooms for practical subjects. "
                    f"{total_practical_lecs} practical lecture-hours needed but only "
                    f"{len(lab_rooms)} lab room(s) x {len(DAYS)} days x "
                    f"{lectures_per_day} slots = {lab_slots} lab-slots available. "
                    f"Please add more lab rooms from the Shared Rooms section."
                )
            }), 400

        # Soft check: total slots vs total lectures
        total_lecs_needed = total_practical_lecs + total_theory_lecs
        if total_slots < total_lecs_needed:
            room_warnings.append(
                f"Room slots are very tight: {len(shared_rooms)} room(s) x "
                f"{len(DAYS)} days x {lectures_per_day} slots = {total_slots} total, "
                f"but {total_lecs_needed} lectures needed. Adding more rooms will help."
            )

        # Info: theory overflow into labs
        if class_slots < total_theory_lecs and lab_rooms:
            overflow = total_theory_lecs - class_slots
            room_warnings.append(
                f"Note: {overflow} theory lecture(s) will be scheduled in lab rooms "
                f"(classrooms are insufficient). This is allowed by your configuration."
            )

        room_warning = room_warnings[0] if room_warnings else None

        # ── Generate ──────────────────────────────────────────
        gen = GlobalTimetableGenerator(db, lectures_per_day=lectures_per_day)
        gen.load_existing_faculty()

        results, all_success = gen.generate(branch, sem, divisions, shared_rooms)
        errors, warnings     = gen.validate(results, divisions)
        stats                = gen.statistics(results)

        for rw in room_warnings:
            warnings.insert(0, rw)

        # ── Format response ───────────────────────────────────
        resp_divs = {}
        for cname, result in results.items():
            tt = result.get("timetable", {})
            resp_divs[cname] = {
                "timetable": tt,
                "success":   result["success"],
                "stats": {
                    "total_lectures":     sum(1 for d in DAYS for s in tt.get(d, []) if s != "free"),
                    "free_lectures":      sum(1 for d in DAYS for s in tt.get(d, []) if s == "free"),
                    "subject_allocation": result.get("subject_allocation", {}),
                },
            }

        # ── Save if no critical errors ────────────────────────
        if not errors:
            saved_count, faculty_updated = gen.save(results, branch, sem, divisions)
            resp = {
                "success":              all_success,
                "message":              f"Generated timetables for {len(divisions)} division(s)",
                "branch":               branch,
                "semester":             sem,
                "total_divisions":      len(divisions),
                "successful_divisions": stats["successful_divisions"],
                "faculty_update_count": len(faculty_updated),
                "faculty_updated":      faculty_updated,
                "divisions":            resp_divs,
                "stats":                stats,
            }
            if warnings:
                resp["warnings"] = warnings
            if not all_success:
                resp["partial_success"] = True
            return jsonify(resp), (200 if all_success else 207)

        return jsonify({
            "success":         False,
            "errors":          errors,
            "warnings":        warnings,
            "partial_results": resp_divs,
            "stats":           stats,
        }), 400

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({
            "error":     "Internal server error",
            "details":   str(e),
            "traceback": traceback.format_exc(),
        }), 500


# ══════════════════════════════════════════════════════════════
#  ENDPOINT: POST /api/timetable/auto-generate  (legacy single-div)
# ══════════════════════════════════════════════════════════════
def auto_generate_timetable():
    try:
        data = request.get_json()

        branch           = (data.get("branch") or "").strip()
        class_name       = (data.get("class") or "").strip()
        sem              = data.get("sem")
        rooms            = data.get("rooms", [])
        subjects         = data.get("subjects", [])
        lectures_per_day = int(data.get("lectures_per_day", TOTAL_SLOTS))

        missing = [f for f in ["branch", "class", "sem", "rooms", "subjects"] if not data.get(f)]
        if missing:
            return jsonify({"error": f"Missing required fields: {', '.join(missing)}"}), 400

        for sub in subjects:
            sub.setdefault("schedule_in_pairs", False)
            sub["weekly_hours"] = int(sub["weekly_hours"])

        total_hrs    = sum(s["weekly_hours"] for s in subjects)
        max_possible = len(DAYS) * lectures_per_day
        if total_hrs > max_possible:
            return jsonify({
                "error": f"Impossible: needs {total_hrs}h but only {max_possible} slots available."
            }), 400

        gen = GlobalTimetableGenerator(db, lectures_per_day=lectures_per_day)
        gen.load_existing_faculty()

        divisions  = [{"class_name": class_name, "subjects": subjects, "rooms": []}]
        results, _ = gen.generate(branch, sem, divisions, rooms)
        result     = results.get(class_name, {})

        if not result.get("success"):
            return jsonify({
                "success": False,
                "errors":  [f"Failed to schedule: {result.get('subject_remaining', {})}"],
                "partial_timetable":  result.get("timetable", {}),
                "stats": {
                    "total_lectures":     0,
                    "free_lectures":      len(DAYS) * TOTAL_SLOTS,
                    "subject_allocation": result.get("subject_allocation", {}),
                },
            }), 400

        gen.save(results, branch, sem, divisions)
        tt = result["timetable"]
        safe_branch = branch.lower().replace("(", "").replace(")", "")

        return jsonify({
            "success":         True,
            "message":         "Timetable generated successfully",
            "class_id":        f"sem{sem}_{safe_branch}_{class_name.lower()}",
            "class_timetable": tt,
            "stats": {
                "total_lectures":     sum(1 for d in DAYS for s in tt[d] if s != "free"),
                "free_lectures":      sum(1 for d in DAYS for s in tt[d] if s == "free"),
                "subject_allocation": result.get("subject_allocation", {}),
            },
        }), 200

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": "Internal server error", "details": str(e)}), 500


# ══════════════════════════════════════════════════════════════
#  ENDPOINT: GET /api/timetable/branch-divisions
# ══════════════════════════════════════════════════════════════
def get_branch_divisions():
    try:
        branch = (request.args.get("branch") or "").strip()
        sem    = (request.args.get("sem") or "").strip()
        if not branch or not sem:
            return jsonify({"error": "Missing branch or sem parameter"}), 400

        safe_branch = branch.lower().replace("(", "").replace(")", "")
        docs = list(db.classwise_faculty.find({"_id": {"$regex": f"^sem{sem}_{safe_branch}_"}}))

        return jsonify({
            "success":   True,
            "branch":    branch,
            "semester":  sem,
            "divisions": [{
                "class_name":           d.get("class", ""),
                "class_id":             d["_id"],
                "faculty_count":        len(d.get("allowed_faculty", [])),
                "avg_lectures_per_day": d.get("avg_lectures_per_day", 0),
            } for d in docs],
            "total": len(docs),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ══════════════════════════════════════════════════════════════
#  ENDPOINT: GET /api/faculties
# ══════════════════════════════════════════════════════════════
def get_all_faculties():
    try:
        faculties = list(db.faculty_timetable.find({}, {"password": 0}))
        return jsonify({
            "success":   True,
            "faculties": [{
                "id":        f["_id"],
                "name":      f.get("name", f["_id"]),
                "timetable": f.get("timetable", {}),
            } for f in faculties],
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
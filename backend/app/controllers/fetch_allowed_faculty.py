# app/controllers/fetch_allowed_faculty.py
from flask import request, jsonify
from app.database.mongo import db

def fetch_allowed_faculty():
    """Fetch allowed faculty for one or multiple classes"""
    try:
        sem = request.args.get("sem")
        branch = request.args.get("branch")
        class_name = request.args.get("class")  # Single class
        classes_param = request.args.get("classes")  # Multiple classes (comma-separated)
        
        # Check if we're fetching for single class or multiple classes
        if class_name:
            # ===============================
            # 🔹 SINGLE CLASS FETCH
            # ===============================
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
            # ===============================
            # 🔹 MULTIPLE CLASSES FETCH (BATCH)
            # ===============================
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
            # ===============================
            # 🔹 BRANCH-WIDE FETCH
            # ===============================
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


# ===============================
# 🔹 OPTIONAL: CREATE/UPDATE ALLOWED FACULTY
# ===============================
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


# ===============================
# 🔹 OPTIONAL: DELETE ALLOWED FACULTY
# ===============================
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
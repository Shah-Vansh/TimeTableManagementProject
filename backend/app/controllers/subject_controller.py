from flask import request, jsonify, request
from app.database.mongo import db

# GET: /api/subjects
def get_all_subjects():
    """
    Fetch all subjects from the subjects collection
    Returns all subjects with their details
    """
    try:
        subject_col = db.subjects
        
        # Fetch all subjects
        subjects = list(subject_col.find(
            {},
            {
                '_id': 1,
                'name': 1,
                'slug': 1,
                'credit': 1
            }
        ))
        
        # Format subjects for frontend
        formatted_subjects = []
        for subject in subjects:
            subject_code = subject.get('_id')
            
            formatted_subject = {
                'id': str(subject_code),
                'subject_code': str(subject_code),
                'name': subject.get('name', 'Unknown Subject'),
                'slug': subject.get('slug', ''),
                'credit': subject.get('credit', 0)
            }
            formatted_subjects.append(formatted_subject)
        
        return jsonify({
            'success': True,
            'subjects': formatted_subjects
        }), 200
        
    except Exception as e:
        print(f"Error fetching subjects: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch subjects'
        }), 500


# ===============================
# =      MAIN CONTROLLER        =
# ===============================

# ----- / CREATE Functions /------

# POST: /api/subjects
def create_subject():
    """
    Create a new subject
    Expected JSON payload:
    {
        "id": 3160051,
        "name": "Data Science",
        "slug": "DS",
        "credit": 4
    }
    Returns: Subject details
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
            
        subject_code = data.get('id')
        subject_name = data.get('name')
        subject_slug = data.get('slug', '')
        subject_credit = data.get('credit', 0)
        
        if not subject_code:
            return jsonify({
                'success': False,
                'error': 'Subject code is required'
            }), 400
            
        if not subject_name:
            return jsonify({
                'success': False,
                'error': 'Subject name is required'
            }), 400
        
        # Validate subject code is numeric
        try:
            subject_code = int(subject_code)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Subject code must be a valid number'
            }), 400
        
        # Validate credit is numeric
        try:
            subject_credit = int(subject_credit)
            if subject_credit < 0:
                raise ValueError("Credit cannot be negative")
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Credit must be a valid non-negative number'
            }), 400
        
        # Check if subject code already exists
        subject_col = db.subjects
        existing_subject = subject_col.find_one({'_id': subject_code})
        
        if existing_subject:
            return jsonify({
                'success': False,
                'error': f'Subject with code "{subject_code}" already exists'
            }), 409
        
        # Prepare the new subject document
        new_subject = {
            '_id': subject_code,
            'name': subject_name.strip(),
            'slug': subject_slug.strip().upper(),
            'credit': subject_credit
        }
        
        # Insert into database
        result = subject_col.insert_one(new_subject)
        
        if result.inserted_id:
            return jsonify({
                'success': True,
                'message': f'Subject "{subject_name}" created successfully',
                'subject': {
                    'id': subject_code,
                    'subject_code': subject_code,
                    'name': subject_name.strip(),
                    'slug': subject_slug.strip().upper(),
                    'credit': subject_credit
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create subject'
            }), 500
            
    except Exception as e:
        print(f"Error creating subject: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error while creating subject'
        }), 500


# ----- / READ Functions /------

# GET: /api/subjects/<subject_code>
def get_subject(subject_code):
    """
    Get a specific subject by code
    """
    try:
        # Convert subject_code to int
        try:
            subject_code = int(subject_code)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid subject code format'
            }), 400
        
        subject_col = db.subjects
        subject = subject_col.find_one({'_id': subject_code})
        
        if not subject:
            return jsonify({
                'success': False,
                'error': f'Subject with code "{subject_code}" not found'
            }), 404
        
        return jsonify({
            'success': True,
            'subject': {
                'id': subject['_id'],
                'subject_code': subject['_id'],
                'name': subject.get('name', ''),
                'slug': subject.get('slug', ''),
                'credit': subject.get('credit', 0)
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching subject {subject_code}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch subject'
        }), 500


# ----- / UPDATE Functions /------

# PUT: /api/subjects/<subject_code>
def update_subject(subject_code):
    """
    Update a subject's information
    """
    try:
        # Convert subject_code to int
        try:
            subject_code = int(subject_code)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid subject code format'
            }), 400
        
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        subject_col = db.subjects
        
        # Check if subject exists
        existing_subject = subject_col.find_one({'_id': subject_code})
        if not existing_subject:
            return jsonify({
                'success': False,
                'error': f'Subject with code "{subject_code}" not found'
            }), 404
        
        # Prepare update data
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name'].strip()
        
        if 'slug' in data:
            update_data['slug'] = data['slug'].strip().upper()
        
        if 'credit' in data:
            try:
                credit = int(data['credit'])
                if credit < 0:
                    raise ValueError("Credit cannot be negative")
                update_data['credit'] = credit
            except (ValueError, TypeError):
                return jsonify({
                    'success': False,
                    'error': 'Credit must be a valid non-negative number'
                }), 400
        
        # Perform update
        result = subject_col.update_one(
            {'_id': subject_code},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': f'Subject "{subject_code}" updated successfully'
            }), 200
        else:
            return jsonify({
                'success': True,
                'message': 'No changes made'
            }), 200
            
    except Exception as e:
        print(f"Error updating subject {subject_code}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update subject'
        }), 500


# ----- / DELETE Functions /------

# DELETE: /api/subjects/<subject_code>
def delete_subject(subject_code):
    """
    Delete a subject
    Note: Consider checking if subject is referenced in other collections before deletion
    """
    try:
        # Convert subject_code to int
        try:
            subject_code = int(subject_code)
        except (ValueError, TypeError):
            return jsonify({
                'success': False,
                'error': 'Invalid subject code format'
            }), 400
        
        subject_col = db.subjects
        
        # Check if subject exists
        existing_subject = subject_col.find_one({'_id': subject_code})
        if not existing_subject:
            return jsonify({
                'success': False,
                'error': f'Subject with code "{subject_code}" not found'
            }), 404
        
        # Delete the subject document
        result = subject_col.delete_one({'_id': subject_code})
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': f'Subject "{subject_code}" deleted successfully',
                'details': {
                    'subject_deleted': True,
                    'subject_name': existing_subject.get('name', 'Unknown'),
                    'subject_code': subject_code
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete subject'
            }), 500
            
    except Exception as e:
        print(f"Error deleting subject {subject_code}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete subject'
        }), 500
    
# Add this to your subject_controller.py

# GET: /api/subjects/classwise/<sem>/<branch>/<class_name>
def get_classwise_subjects(sem, branch, class_name):
    """
    Fetch allowed subjects for a specific class
    """
    try:
        # Validate inputs
        if not sem or not branch or not class_name:
            return jsonify({
                'success': False,
                'error': 'Semester, branch, and class name are required'
            }), 400

        sem = int(sem)
        if sem < 1 or sem > 8:
            return jsonify({
                'success': False,
                'error': 'Invalid semester'
            }), 400

        # Safe branch name for MongoDB
        safe_branch = branch.lower().replace("(", "").replace(")", "")
        class_id = f"sem{sem}_{safe_branch}_{class_name.lower()}"

        # Access classwise_faculty collection (where subject data is stored)
        classwise_col = db.classwise_faculty
        
        # Find the class document
        class_doc = classwise_col.find_one({"_id": class_id})
        
        if not class_doc:
            return jsonify({
                'success': False,
                'error': f'No timetable found for {branch} Semester {sem} - {class_name}',
                'allowed_subjects': [],
                'message': 'Class not found in database'
            }), 404

        # Get allowed subjects from the class document
        allowed_subjects = class_doc.get("allowed_subjects", [])
        
        # If no subjects found in classwise collection, check schedule
        if not allowed_subjects:
            # Try to extract from timetable if exists
            # This is optional - you can skip if you want
            pass

        # Fetch subject details for each subject code
        subject_col = db.subjects
        subjects_with_details = []
        
        for subject_code in allowed_subjects:
            subject_doc = subject_col.find_one({"_id": subject_code})
            if subject_doc:
                subjects_with_details.append({
                    'subject_code': subject_code,
                    'name': subject_doc.get('name', ''),
                    'slug': subject_doc.get('slug', subject_code),
                    'credit': subject_doc.get('credit', 0)
                })
            else:
                # If subject not found in subjects collection, add basic info
                subjects_with_details.append({
                    'subject_code': subject_code,
                    'name': f'Subject {subject_code}',
                    'slug': subject_code,
                    'credit': 0
                })

        return jsonify({
            'success': True,
            'class_id': class_id,
            'sem': sem,
            'branch': branch,
            'class': class_name,
            'allowed_subjects': allowed_subjects,  # Just codes
            'subjects_with_details': subjects_with_details,  # With full details
            'total_subjects': len(allowed_subjects),
            'message': f'Found {len(allowed_subjects)} allowed subjects for {class_name}'
        }), 200

    except ValueError:
        return jsonify({
            'success': False,
            'error': 'Invalid semester format'
        }), 400
    except Exception as e:
        print(f"Error fetching classwise subjects: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch classwise subjects'
        }), 500
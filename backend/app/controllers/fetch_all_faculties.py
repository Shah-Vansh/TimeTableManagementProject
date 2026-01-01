from flask import Blueprint, request, jsonify
from app.database.mongo import db
from bson import ObjectId
import re
import secrets
import string

faculty_bp = Blueprint('faculty', __name__)

def generate_strong_password(length=12):
    """
    Generate a strong random password
    """
    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*"
    
    # Ensure at least one character from each set
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    # Fill the rest with random characters from all sets
    all_chars = lowercase + uppercase + digits + special
    password += [secrets.choice(all_chars) for _ in range(length - 4)]
    
    # Shuffle the password
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

@faculty_bp.route('/api/faculties', methods=['GET'])
def get_all_faculties():
    """
    Fetch all faculties from the faculty_timetable collection
    Returns faculty with their complete timetable for calculating stats
    """
    try:
        faculty_col = db.faculty_timetable
        
        # Fetch all faculties with their timetables
        faculties = list(faculty_col.find(
            {},
            {
                '_id': 1,
                'name': 1,
                'timetable': 1
            }
        ))
        
        # Format faculties for frontend
        formatted_faculties = []
        for faculty in faculties:
            faculty_id = faculty.get('_id')
            
            formatted_faculty = {
                'id': str(faculty_id),
                'faculty_id': str(faculty_id),
                'name': faculty.get('name', 'Unknown Faculty'),
                'timetable': faculty.get('timetable', {})
            }
            formatted_faculties.append(formatted_faculty)
        
        return jsonify({
            'success': True,
            'faculties': formatted_faculties
        }), 200
        
    except Exception as e:
        print(f"Error fetching faculties: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch faculties'
        }), 500


@faculty_bp.route('/api/faculties', methods=['POST'])
def create_faculty():
    """
    Create a new faculty member with auto-generated credentials
    Expected JSON payload:
    {
        "id": "fac9",
        "name": "Dr. Sunil Verma"
    }
    Returns: Faculty details including username and password
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
            
        faculty_id = data.get('id')
        faculty_name = data.get('name')
        
        if not faculty_id:
            return jsonify({
                'success': False,
                'error': 'Faculty ID is required'
            }), 400
            
        if not faculty_name:
            return jsonify({
                'success': False,
                'error': 'Faculty name is required'
            }), 400
        
        # Clean faculty ID (uppercase, alphanumeric)
        faculty_id = faculty_id.strip().upper()
        
        # Validate faculty ID format
        if not re.match(r'^[A-Z]+$', faculty_id):
            return jsonify({
                'success': False,
                'error': 'Faculty ID must contain only uppercase letters'
            }), 400
        
        # Check if faculty ID already exists
        faculty_col = db.faculty_timetable
        existing_faculty = faculty_col.find_one({'_id': faculty_id})
        
        if existing_faculty:
            return jsonify({
                'success': False,
                'error': f'Faculty with ID "{faculty_id}" already exists'
            }), 409
        
        # Generate strong password
        generated_password = generate_strong_password()
        
        # Prepare the new faculty document according to schema
        new_faculty = {
            '_id': faculty_id,
            'name': faculty_name.strip(),
            'username': faculty_id,  # Username is same as faculty ID
            'password': generated_password,  # Store plain password (consider hashing in production)
            'timetable': {
                'mon': ['free'] * 5,
                'tue': ['free'] * 5,
                'wed': ['free'] * 5,
                'thu': ['free'] * 5,
                'fri': ['free'] * 5,
                'sat': ['free'] * 5
            }
        }
        
        # Insert into database
        result = faculty_col.insert_one(new_faculty)
        
        if result.inserted_id:
            return jsonify({
                'success': True,
                'message': f'Faculty "{faculty_name}" created successfully',
                'faculty': {
                    'id': faculty_id,
                    'faculty_id': faculty_id,
                    'name': faculty_name.strip(),
                    'timetable': new_faculty['timetable']
                },
                'credentials': {
                    'username': faculty_id,
                    'password': generated_password
                }
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create faculty'
            }), 500
            
    except Exception as e:
        print(f"Error creating faculty: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Internal server error while creating faculty'
        }), 500


@faculty_bp.route('/api/faculties/<faculty_id>', methods=['GET'])
def get_faculty(faculty_id):
    """
    Get a specific faculty by ID with their complete timetable
    """
    try:
        faculty_col = db.faculty_timetable
        faculty = faculty_col.find_one({'_id': faculty_id})
        
        if not faculty:
            return jsonify({
                'success': False,
                'error': f'Faculty with ID "{faculty_id}" not found'
            }), 404
        
        return jsonify({
            'success': True,
            'faculty': {
                'id': faculty['_id'],
                'faculty_id': faculty['_id'],
                'name': faculty.get('name', ''),
                'timetable': faculty.get('timetable', {})
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching faculty {faculty_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch faculty'
        }), 500


@faculty_bp.route('/api/faculties/<faculty_id>', methods=['PUT'])
def update_faculty(faculty_id):
    """
    Update a faculty member's information
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        faculty_col = db.faculty_timetable
        
        # Check if faculty exists
        existing_faculty = faculty_col.find_one({'_id': faculty_id})
        if not existing_faculty:
            return jsonify({
                'success': False,
                'error': f'Faculty with ID "{faculty_id}" not found'
            }), 404
        
        # Prepare update data
        update_data = {}
        
        if 'name' in data:
            update_data['name'] = data['name'].strip()
        
        if 'timetable' in data:
            # Validate timetable structure
            timetable = data['timetable']
            required_days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
            
            for day in required_days:
                if day not in timetable:
                    return jsonify({
                        'success': False,
                        'error': f'Timetable must include {day}'
                    }), 400
            
            update_data['timetable'] = timetable
        
        # Perform update
        result = faculty_col.update_one(
            {'_id': faculty_id},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({
                'success': True,
                'message': f'Faculty "{faculty_id}" updated successfully'
            }), 200
        else:
            return jsonify({
                'success': True,
                'message': 'No changes made'
            }), 200
            
    except Exception as e:
        print(f"Error updating faculty {faculty_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to update faculty'
        }), 500


@faculty_bp.route('/api/faculties/<faculty_id>', methods=['DELETE'])
def delete_faculty(faculty_id):
    """
    Delete a faculty member
    """
    try:
        faculty_col = db.faculty_timetable
        
        # Check if faculty exists
        existing_faculty = faculty_col.find_one({'_id': faculty_id})
        if not existing_faculty:
            return jsonify({
                'success': False,
                'error': f'Faculty with ID "{faculty_id}" not found'
            }), 404
        
        # Delete the faculty
        result = faculty_col.delete_one({'_id': faculty_id})
        
        if result.deleted_count > 0:
            return jsonify({
                'success': True,
                'message': f'Faculty "{faculty_id}" deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete faculty'
            }), 500
            
    except Exception as e:
        print(f"Error deleting faculty {faculty_id}: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to delete faculty'
        }), 500
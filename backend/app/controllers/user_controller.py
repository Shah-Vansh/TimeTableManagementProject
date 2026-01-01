from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
from functools import wraps
import os
from app.database.mongo import db

user_bp = Blueprint('user', __name__)

# MongoDB collection
faculty_collection = db['faculty_timetable']

def generate_token(user_id):
    """Generate JWT token for user"""
    token = jwt.encode(
        {
            'userId': str(user_id),
            'exp': datetime.utcnow() + timedelta(days=7)
        },
        os.getenv('JWT_SECRET'),
        algorithm='HS256'
    )
    return token

def token_required(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]
            
            data = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=['HS256'])
            request.user_id = data['userId']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# POST: /api/user/register
@user_bp.route('/register', methods=['POST'])
def register_user():
    try:
        data = request.get_json()
        name = data.get('name')
        username = data.get('username')
        password = data.get('password')
        
        # Validate required fields
        if not name or not username or not password:
            return jsonify({'message': 'Missing required fields'}), 400
        
        # Check if user already exists
        existing_user = faculty_collection.find_one({'username': username})
        if existing_user:
            return jsonify({'message': 'User already exists.'}), 400
        
        # Hash password
        hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
        
        # Create new faculty with default timetable
        new_faculty = {
            '_id': username.upper(),
            'name': name,
            'username': username,
            'password': hashed_password,
            'timetable': {
                'mon': ['free', 'free', 'free', 'free', 'free'],
                'tue': ['free', 'free', 'free', 'free', 'free'],
                'wed': ['free', 'free', 'free', 'free', 'free'],
                'thu': ['free', 'free', 'free', 'free', 'free'],
                'fri': ['free', 'free', 'free', 'free', 'free'],
                'sat': ['free', 'free', 'free', 'free', 'free']
            }
        }
        
        faculty_collection.insert_one(new_faculty)
        
        # Generate token
        token = generate_token(new_faculty['_id'])
        
        # Return user data without password
        user_data = {
            'id': new_faculty['_id'],
            'name': new_faculty['name'],
            'username': new_faculty['username']
        }
        
        return jsonify({
            'message': 'User created successfully.',
            'token': token,
            'user': user_data
        }), 201
        
    except Exception as error:
        return jsonify({'message': str(error)}), 400

# POST: /api/user/login
@user_bp.route('/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Find user by username
        user = faculty_collection.find_one({'username': username})
        
        if not user:
            return jsonify({'message': 'Invalid username or password.'}), 400
        
        # Check password
        # if not (user['password'], password):
        #     return jsonify({'message': 'Invalid username or password'}), 400
        
        # Generate token
        token = generate_token(user['_id'])
        
        # Return user data without password
        user_data = {
            'id': user['_id'],
            'name': user['name'],
            'username': user['username']
        }
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': user_data
        }), 200
        
    except Exception as error:
        return jsonify({'message': str(error)}), 500

# GET: /api/user/data
@user_bp.route('/data', methods=['GET'])
@token_required
def get_user_by_id():
    try:
        user_id = request.user_id
        
        # Find user by ID
        user = faculty_collection.find_one({'_id': user_id})
        
        if not user:
            return jsonify({'message': 'User not found.'}), 404
        
        # Return user data without password
        user_data = {
            'id': user['_id'],
            'name': user['name'],
            'username': user['username']
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as error:
        return jsonify({'message': str(error)}), 400

# GET: /api/user/profile
@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    try:
        user = faculty_collection.find_one({'_id': request.user_id})
        
        if not user:
            return jsonify({'message': 'User not found.'}), 404
        
        # Return user data with timetable
        user_data = {
            'id': user['_id'],
            'name': user['name'],
            'username': user['username'],
            'timetable': user.get('timetable', {})
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as error:
        return jsonify({'message': str(error)}), 400

# PUT: /api/user/profile
@user_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    try:
        user = faculty_collection.find_one({'_id': request.user_id})
        
        if not user:
            return jsonify({'message': 'User not found.'}), 404
        
        # Get data from request
        data = request.get_json()
        
        update_fields = {}
        
        # Update name if provided
        if 'name' in data:
            update_fields['name'] = data['name']
        
        # Update timetable if provided
        if 'timetable' in data:
            update_fields['timetable'] = data['timetable']
        
        # Update password if provided
        if 'password' in data:
            update_fields['password'] = generate_password_hash(data['password'], method='pbkdf2:sha256')
        
        if update_fields:
            faculty_collection.update_one(
                {'_id': request.user_id},
                {'$set': update_fields}
            )
        
        # Get updated user
        updated_user = faculty_collection.find_one({'_id': request.user_id})
        
        # Return updated user data
        user_data = {
            'id': updated_user['_id'],
            'name': updated_user['name'],
            'username': updated_user['username'],
            'timetable': updated_user.get('timetable', {})
        }
        
        return jsonify({'user': user_data}), 200
        
    except Exception as error:
        return jsonify({'message': str(error)}), 400

# GET: /api/user/timetable
@user_bp.route('/timetable', methods=['GET'])
@token_required
def get_timetable():
    try:
        user = faculty_collection.find_one({'_id': request.user_id})
        
        if not user:
            return jsonify({'message': 'User not found.'}), 404
        
        return jsonify({
            'timetable': user.get('timetable', {})
        }), 200
        
    except Exception as error:
        return jsonify({'message': str(error)}), 400

# PUT: /api/user/timetable
@user_bp.route('/timetable', methods=['PUT'])
@token_required
def update_timetable():
    try:
        user = faculty_collection.find_one({'_id': request.user_id})
        
        if not user:
            return jsonify({'message': 'User not found.'}), 404
        
        data = request.get_json()
        new_timetable = data.get('timetable')
        
        if not new_timetable:
            return jsonify({'message': 'Timetable data is required'}), 400
        
        # Validate timetable structure
        valid_days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat']
        for day in valid_days:
            if day not in new_timetable:
                return jsonify({'message': f'Missing day: {day}'}), 400
            if not isinstance(new_timetable[day], list) or len(new_timetable[day]) != 5:
                return jsonify({'message': f'Invalid timetable format for {day}'}), 400
        
        # Update timetable
        faculty_collection.update_one(
            {'_id': request.user_id},
            {'$set': {'timetable': new_timetable}}
        )
        
        return jsonify({
            'message': 'Timetable updated successfully',
            'timetable': new_timetable
        }), 200
        
    except Exception as error:
        return jsonify({'message': str(error)}), 400
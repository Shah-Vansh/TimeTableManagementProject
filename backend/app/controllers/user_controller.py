from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import os
from app.database.mongo import db

user_bp = Blueprint("user", __name__)

# MongoDB collection
faculty_collection = db["faculty_timetable"]


# [JWT token]
def generate_token(user_id):
    """Generate JWT token for user"""
    token = jwt.encode(
        {"userId": str(user_id), "exp": datetime.utcnow() + timedelta(days=15)},
        os.getenv("JWT_SECRET"),
        algorithm="HS256",
    )
    return token


# ----- / CREATE Functions /------


# POST: /api/user/register
def register_user():
    try:
        data = request.get_json()
        name = data.get("name")
        username = data.get("username")
        password = data.get("password")

        # Validate required fields
        if not name or not username or not password:
            return jsonify({"message": "Missing required fields"}), 400

        # Check if user already exists
        existing_user = faculty_collection.find_one({"_id": username})
        if existing_user:
            return jsonify({"message": "User already exists."}), 400

        # Hash password
        hashed_password = generate_password_hash(password, method="pbkdf2:sha256")

        # Create new faculty with default timetable
        new_faculty = {
            "_id": username.upper(),
            "name": name,
            "password": hashed_password,
            "timetable": {
                "mon": ["free", "free", "free", "free", "free"],
                "tue": ["free", "free", "free", "free", "free"],
                "wed": ["free", "free", "free", "free", "free"],
                "thu": ["free", "free", "free", "free", "free"],
                "fri": ["free", "free", "free", "free", "free"],
                "sat": ["free", "free", "free", "free", "free"],
            },
            "isAdmin": True,
        }

        faculty_collection.insert_one(new_faculty)

        # Generate token
        token = generate_token(new_faculty["_id"])

        # Return user data without password
        user_data = {
            "id": new_faculty["_id"],
            "name": new_faculty["name"],
        }

        return (
            jsonify(
                {
                    "message": "User created successfully.",
                    "token": token,
                    "user": user_data,
                }
            ),
            201,
        )

    except Exception as error:
        return jsonify({"message": str(error)}), 400


# ----- / READ Functions /------


# POST: /api/user/login
def login_user():
    try:
        data = request.get_json()
        username = data.get("username")
        password = data.get("password")

        # Find user by username
        user = faculty_collection.find_one({"_id": username})

        if not user:
            return jsonify({"message": "Invalid username or password."}), 400

        # Check password
        if not check_password_hash(user["password"], password):
            return jsonify({"message": "Invalid username or password"}), 400

        # Generate token
        token = generate_token(user["_id"])

        # Return user data without password
        user_data = {
            "id": user["_id"],
            "name": user["name"],
        }

        return (
            jsonify({"message": "Login successful", "token": token, "user": user_data}),
            200,
        )

    except Exception as error:
        return jsonify({"message": str(error)}), 500


# GET: /api/user/data
def get_user_by_id():
    try:
        user_id = request.user_id

        # Find user by ID
        user = faculty_collection.find_one({"_id": user_id})

        if not user:
            return jsonify({"message": "User not found."}), 404

        # Return user data without password
        user_data = {
            "id": user["_id"],
            "name": user["name"],
            "username": user["username"],
        }

        return jsonify({"user": user_data}), 200

    except Exception as error:
        return jsonify({"message": str(error)}), 400


# GET: /api/user/profile
def get_profile():
    try:
        user = faculty_collection.find_one({"_id": request.user_id})

        if not user:
            return jsonify({"message": "User not found."}), 404

        # Return user data with timetable
        user_data = {
            "id": user["_id"],
            "name": user["name"],
            "username": user["username"],
            "timetable": user.get("timetable", {}),
        }

        return jsonify({"user": user_data}), 200

    except Exception as error:
        return jsonify({"message": str(error)}), 400


def get_my_profile():
    faculty_id = request.user_id  # comes from JWT
    print(faculty_id)
    faculty = db.faculty_timetable.find_one({"_id": faculty_id})

    if not faculty:
        return jsonify({"error": "Profile not found"}), 404

    # Create response with only fields from schema
    faculty_data = {
        "_id": str(faculty["_id"]),
        "name": faculty["name"],
        "isAdmin": faculty.get("isAdmin", False),
        "timetable": faculty.get("timetable", {}),
        "telegram_chat_id": faculty.get("telegram_chat_id"),
    }

    return jsonify({"success": True, "faculty": faculty_data})


# ----- / UPDATE Functions /------


# PUT: /api/user/profile
def update_profile():
    try:
        user = faculty_collection.find_one({"_id": request.user_id})
        if not user:
            return jsonify({"success": False, "error": "User not found"}), 404

        data = request.get_json()
        update_fields = {}

        # Update name
        if "name" in data and data["name"].strip():
            update_fields["name"] = data["name"].strip()

        # Update password
        if "old_password" in data and "new_password" in data:
            old_pw = data["old_password"].strip()
            new_pw = data["new_password"]

            if check_password_hash(user["password"], old_pw):
                update_fields["password"] = generate_password_hash(
                    new_pw, method="pbkdf2:sha256"
                )
            else:
                return (
                    jsonify({"success": False, "error": "Old password is incorrect"}),
                    400,
                )

        # Update Telegram Chat ID
        if "telegram_chat_id" in data:
            chat_id = data["telegram_chat_id"]
            if isinstance(chat_id, str):
                chat_id = chat_id.strip()
                # Validate if it's a numeric value
                if (
                    chat_id
                    and not chat_id.isdigit()
                    and (chat_id[0] != "-" or not chat_id[1:].isdigit())
                ):
                    return (
                        jsonify(
                            {
                                "success": False,
                                "error": "Telegram Chat ID must be a number",
                            }
                        ),
                        400,
                    )

                if chat_id:  # Only update if not empty
                    update_fields["telegram_chat_id"] = chat_id
                else:
                    # If empty string, remove the field
                    update_fields["telegram_chat_id"] = None
            elif isinstance(chat_id, (int, float)):
                # Convert numeric to string
                update_fields["telegram_chat_id"] = str(int(chat_id))
            elif chat_id is None:
                # If None, remove the field
                update_fields["telegram_chat_id"] = None

        # Apply updates if any
        if update_fields:
            # Handle field removal for None values
            set_fields = {}
            unset_fields = {}

            for key, value in update_fields.items():
                if value is None:
                    unset_fields[key] = ""
                else:
                    set_fields[key] = value

            update_operations = {}
            if set_fields:
                update_operations["$set"] = set_fields
            if unset_fields:
                update_operations["$unset"] = unset_fields

            if update_operations:
                faculty_collection.update_one(
                    {"_id": request.user_id}, update_operations
                )

        # Get updated user
        updated_user = faculty_collection.find_one({"_id": request.user_id})

        user_data = {
            "id": updated_user["_id"],
            "name": updated_user["name"],
            "username": updated_user["_id"],
            "timetable": updated_user.get("timetable", {}),
            "telegram_chat_id": updated_user.get("telegram_chat_id"),
            "isAdmin": updated_user.get("isAdmin", False),
        }

        return jsonify({"success": True, "faculty": user_data}), 200

    except Exception as error:
        return jsonify({"success": False, "error": str(error)}), 400
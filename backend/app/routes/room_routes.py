from flask import Blueprint, request, jsonify
from app.database.mongo import db
from bson import ObjectId

# Create blueprint
room_bp = Blueprint('rooms', __name__)

# ===============================
# =          ROOMS API          =
# ===============================

@room_bp.route('/api/rooms', methods=['GET'])
def get_rooms():
    """Fetch all available rooms from the database"""
    try:
        rooms_collection = db.rooms
        
        # Get all rooms, sorted by floor and room number
        rooms_cursor = rooms_collection.find().sort([("floor", 1), ("_id", 1)])
        
        rooms = []
        for room in rooms_cursor:
            rooms.append({
                "id": str(room.get("_id")),
                "name": room.get("_id"),
                "floor": room.get("floor", 1),
                "type": room.get("type", "Classroom"),
                "capacity": room.get("capacity", 50),
                "description": room.get("description", ""),
                "is_lab": room.get("is_lab", False)
            })
        
        return jsonify({
            "success": True,
            "rooms": rooms,
            "count": len(rooms)
        }), 200
        
    except Exception as e:
        print("Error fetching rooms:", e)
        return jsonify({
            "success": False,
            "message": "Failed to fetch rooms",
            "error": str(e)
        }), 500

@room_bp.route('/api/rooms/<string:room_id>', methods=['GET'])
def get_room_by_id(room_id):
    """Get specific room by ID"""
    try:
        room = db.rooms.find_one({"_id": room_id})
        
        if not room:
            return jsonify({
                "success": False,
                "message": f"Room '{room_id}' not found"
            }), 404
        
        return jsonify({
            "success": True,
            "room": {
                "id": str(room.get("_id")),
                "name": room.get("_id"),
                "floor": room.get("floor", 1),
                "type": room.get("type", "Classroom"),
                "capacity": room.get("capacity", 50),
                "description": room.get("description", ""),
                "is_lab": room.get("is_lab", False)
            }
        }), 200
        
    except Exception as e:
        print(f"Error fetching room {room_id}:", e)
        return jsonify({
            "success": False,
            "message": f"Failed to fetch room {room_id}",
            "error": str(e)
        }), 500

@room_bp.route('/api/rooms', methods=['POST'])
def create_room():
    """Create a new room"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get("name"):
            return jsonify({
                "success": False,
                "message": "Room name is required"
            }), 400
        
        room_name = data.get("name")
        floor = data.get("floor", 1)
        room_type = data.get("type", "Classroom")
        capacity = data.get("capacity", 50)
        description = data.get("description", "")
        is_lab = data.get("is_lab", False)
        
        # Check if room already exists
        existing_room = db.rooms.find_one({"_id": room_name})
        if existing_room:
            return jsonify({
                "success": False,
                "message": f"Room '{room_name}' already exists"
            }), 409
        
        # Create new room document
        room_data = {
            "_id": room_name,
            "floor": floor,
            "type": room_type,
            "capacity": capacity,
            "description": description,
            "is_lab": is_lab,
            "created_at": datetime.utcnow()
        }
        
        # Insert into database
        result = db.rooms.insert_one(room_data)
        
        return jsonify({
            "success": True,
            "message": f"Room '{room_name}' created successfully",
            "room_id": room_name
        }), 201
        
    except Exception as e:
        print("Error creating room:", e)
        return jsonify({
            "success": False,
            "message": "Failed to create room",
            "error": str(e)
        }), 500

@room_bp.route('/api/rooms/<string:room_id>', methods=['PUT'])
def update_room(room_id):
    """Update an existing room"""
    try:
        data = request.get_json()
        
        # Check if room exists
        existing_room = db.rooms.find_one({"_id": room_id})
        if not existing_room:
            return jsonify({
                "success": False,
                "message": f"Room '{room_id}' not found"
            }), 404
        
        update_data = {}
        
        # Only update fields that are provided
        if "floor" in data:
            update_data["floor"] = data["floor"]
        if "type" in data:
            update_data["type"] = data["type"]
        if "capacity" in data:
            update_data["capacity"] = data["capacity"]
        if "description" in data:
            update_data["description"] = data["description"]
        if "is_lab" in data:
            update_data["is_lab"] = data["is_lab"]
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Update room
        db.rooms.update_one(
            {"_id": room_id},
            {"$set": update_data}
        )
        
        return jsonify({
            "success": True,
            "message": f"Room '{room_id}' updated successfully"
        }), 200
        
    except Exception as e:
        print(f"Error updating room {room_id}:", e)
        return jsonify({
            "success": False,
            "message": f"Failed to update room {room_id}",
            "error": str(e)
        }), 500

@room_bp.route('/api/rooms/<string:room_id>', methods=['DELETE'])
def delete_room(room_id):
    """Delete a room"""
    try:
        # Check if room exists
        existing_room = db.rooms.find_one({"_id": room_id})
        if not existing_room:
            return jsonify({
                "success": False,
                "message": f"Room '{room_id}' not found"
            }), 404
        
        # Delete room
        result = db.rooms.delete_one({"_id": room_id})
        
        if result.deleted_count > 0:
            return jsonify({
                "success": True,
                "message": f"Room '{room_id}' deleted successfully"
            }), 200
        else:
            return jsonify({
                "success": False,
                "message": f"Failed to delete room '{room_id}'"
            }), 500
            
    except Exception as e:
        print(f"Error deleting room {room_id}:", e)
        return jsonify({
            "success": False,
            "message": f"Failed to delete room {room_id}",
            "error": str(e)
        }), 500

@room_bp.route('/api/rooms/filter', methods=['POST'])
def filter_rooms():
    """Filter rooms based on criteria"""
    try:
        data = request.get_json()
        
        query = {}
        
        # Build query based on filters
        if data.get("floor"):
            query["floor"] = data["floor"]
        
        if data.get("type"):
            query["type"] = data["type"]
        
        if data.get("is_lab") is not None:
            query["is_lab"] = data["is_lab"]
        
        if data.get("min_capacity"):
            query["capacity"] = {"$gte": data["min_capacity"]}
        
        # Search by name if provided
        if data.get("search"):
            query["_id"] = {"$regex": data["search"], "$options": "i"}
        
        rooms_cursor = db.rooms.find(query).sort([("floor", 1), ("_id", 1)])
        
        rooms = []
        for room in rooms_cursor:
            rooms.append({
                "id": str(room.get("_id")),
                "name": room.get("_id"),
                "floor": room.get("floor", 1),
                "type": room.get("type", "Classroom"),
                "capacity": room.get("capacity", 50),
                "description": room.get("description", ""),
                "is_lab": room.get("is_lab", False)
            })
        
        return jsonify({
            "success": True,
            "rooms": rooms,
            "count": len(rooms)
        }), 200
        
    except Exception as e:
        print("Error filtering rooms:", e)
        return jsonify({
            "success": False,
            "message": "Failed to filter rooms",
            "error": str(e)
        }), 500
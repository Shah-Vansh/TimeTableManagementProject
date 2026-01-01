from pymongo import ASCENDING

COLLECTION_NAME = "faculty_timetable"

FACULTY_TIMETABLE_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["username", "name", "password", "timetable", "admin"],
        "properties": {
            "username": {
                "bsonType": "string",
                "description": "Faculty ID/Username (e.g., 'ABC', 'FAC1')"
            },
            "name": {
                "bsonType": "string",
                "description": "Faculty name"
            },
            "password": {
                "bsonType": "string",
                "description": "Faculty password (plain text or hashed)"
            },
            "timetable": {
                "bsonType": "object",
                "required": ["mon", "tue", "wed", "thu", "fri", "sat"],
                "properties": {
                    "mon": {"bsonType": "array", "items": {"bsonType": "string"}},
                    "tue": {"bsonType": "array", "items": {"bsonType": "string"}},
                    "wed": {"bsonType": "array", "items": {"bsonType": "string"}},
                    "thu": {"bsonType": "array", "items": {"bsonType": "string"}},
                    "fri": {"bsonType": "array", "items": {"bsonType": "string"}},
                    "sat": {"bsonType": "array", "items": {"bsonType": "string"}}
                },
                "description": "Day-wise timetable with periods"
            },
            "admin": {
                "bsonType": "string",
                "description": "Admin/Department affiliation (e.g., 'CSE', 'ABC')"
            }
        }
    }
}

FACULTY_TIMETABLE_INDEXES = [
    {
        "fields": [("username", ASCENDING)],
        "unique": True  # Username should be unique
    },
    {
        "fields": [("name", ASCENDING)],
        "unique": False
    },
    {
        "fields": [("admin", ASCENDING)],
        "unique": False  # For filtering by admin/department
    }
]
from pymongo import ASCENDING

COLLECTION_NAME = "faculty_timetable"

FACULTY_TIMETABLE_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["_id", "name", "timetable"],
        "properties": {
            "_id": {
                "bsonType": "string",
                "description": "Faculty ID (e.g., 'fac1')"
            },
            "name": {
                "bsonType": "string",
                "description": "Faculty name"
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
            }
        }
    }
}

FACULTY_TIMETABLE_INDEXES = [
    {
        "fields": [("name", ASCENDING)],
        "unique": False
    }
]
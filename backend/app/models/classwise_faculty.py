from pymongo import ASCENDING

COLLECTION_NAME = "classwise_faculty"

CLASSWISE_FACULTY_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["_id", "class", "sem", "allowed_faculty"],
        "properties": {
            "_id": {
                "bsonType": "string",
                "description": "Unique identifier (e.g., 'sem1d1')"
            },
            "class": {
                "bsonType": "string",
                "description": "Class/Division identifier (e.g., 'D1', 'D2')"
            },
            "sem": {
                "bsonType": "int",
                "minimum": 1,
                "maximum": 8,
                "description": "Semester number (1-8)"
            },
            "allowed_faculty": {
                "bsonType": "array",
                "items": {"bsonType": "string"},
                "minItems": 1,
                "description": "List of faculty codes allowed to teach this class"
            }
        }
    }
}

CLASSWISE_FACULTY_INDEXES = [
    {
        "fields": [("sem", ASCENDING), ("class", ASCENDING)],
        "unique": True
    },
    {
        "fields": [("allowed_faculty", ASCENDING)],
        "unique": False
    }
]
from pymongo import ASCENDING

COLLECTION_NAME = "classwise_faculty"

CLASSWISE_FACULTY_SCHEMA = {
    "$jsonSchema": {
        "bsonType": "object",
        "required": ["_id", "class", "sem", "branch", "allowed_faculty"],
        "properties": {
            "_id": {
                "bsonType": "string",
                "description": "Unique identifier (e.g., 'sem4_cseaiml_d1')"
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
            "branch": {
                "bsonType": "string",
                "enum": ["CSE", "CSE(AIML)", "DS"],
                "description": "Academic branch"
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

# 🔴 THIS WAS MISSING — REQUIRED FOR IMPORT
CLASSWISE_FACULTY_INDEXES = [
    {
        "fields": [
            ("sem", ASCENDING),
            ("branch", ASCENDING),
            ("class", ASCENDING)
        ],
        "unique": True
    },
    {
        "fields": [("allowed_faculty", ASCENDING)],
        "unique": False
    }
]

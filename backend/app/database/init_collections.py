from pymongo import ASCENDING
from app.database.mongo import db

def init_collections():
    existing = db.list_collection_names()

    # USERS COLLECTION
    if "users" not in existing:
        db.create_collection(
            "users",
            validator={
                "$jsonSchema": {
                    "bsonType": "object",
                    "required": ["name", "email"],
                    "properties": {
                        "name": {"bsonType": "string"},
                        "email": {"bsonType": "string"}
                    }
                }
            }
        )
        print("Created 'users' collection")

    # Indexes
    db.users.create_index([("email", ASCENDING)], unique=True)
    print("Indexes ensured")
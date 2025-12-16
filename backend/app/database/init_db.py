from app.database.mongo import db
from app.models.faculty import (
    COLLECTION_NAME as FACULTY_COLLECTION,
    FACULTY_TIMETABLE_SCHEMA,
    FACULTY_TIMETABLE_INDEXES
)
from app.models.classwise_faculty import (
    COLLECTION_NAME as CLASS_COLLECTION,
    CLASSWISE_FACULTY_SCHEMA,
    CLASSWISE_FACULTY_INDEXES
)

def create_collection_if_not_exists(db, name, schema=None):
    if name not in db.list_collection_names():
        if schema:
            db.create_collection(name, validator=schema)
        else:
            db.create_collection(name)
        print(f"Created collection: {name}")

def create_indexes(db, collection_name, indexes):
    collection = db[collection_name]
    for index in indexes:
        collection.create_index(
            index["fields"],
            unique=index.get("unique", False)
        )
    print(f"Indexes ensured for: {collection_name}")

# app/database/init_db.py
def init_db(db):
    # USERS
    create_collection_if_not_exists(
        db,  # pass db explicitly
        FACULTY_COLLECTION,
        FACULTY_TIMETABLE_SCHEMA,
    )
    create_collection_if_not_exists(
        db,
        CLASS_COLLECTION,
        CLASSWISE_FACULTY_SCHEMA
    )
    create_indexes(
        db,
        FACULTY_COLLECTION,
        FACULTY_TIMETABLE_INDEXES
    )
    create_indexes(
        db,
        CLASS_COLLECTION,
        CLASSWISE_FACULTY_INDEXES
    )
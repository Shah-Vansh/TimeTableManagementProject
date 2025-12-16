from pymongo import MongoClient

mongo_client = None
db = None

def init_mongo(app):
    global mongo_client, db

    mongo_client = MongoClient(app.config["MONGO_URI"])
    db = mongo_client[app.config["MONGO_DB_NAME"]]

    print("Mongo connected to:", db.name)
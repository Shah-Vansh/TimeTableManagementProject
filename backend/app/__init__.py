from flask import Flask
from .config import Config
from .database.mongo import init_mongo
from .database.init_db import init_db
from flask_cors import CORS

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config.from_object(Config)

    # Initialize MongoDB
    init_mongo(app)

    from app.database.mongo import db
    init_db(db=db)

    # import blueprints
    from app.routes.main_routes import main_bp
    from app.controllers.replace_lecture_controller import replace_lecture_bp
    from app.controllers.rearrange_lecture_controller import rearrange_lecture_bp
    # register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(replace_lecture_bp, url_prefix="/api")
    app.register_blueprint(rearrange_lecture_bp, url_prefix="/api")


    return app

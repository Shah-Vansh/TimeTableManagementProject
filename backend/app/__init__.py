from flask import Flask
from .config import Config
from .database.mongo import init_mongo
from .database.init_db import init_db
from flask_cors import CORS
import os
from autonomous_recovery_agent.agent import AutonomousRecoveryAgent, AgentConfig

def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config.from_object(Config)

    # Initialize MongoDB
    init_mongo(app)

    from app.database.mongo import db
    init_db(db=db)

    config = AgentConfig(
        # Enable new features
        disk_monitoring=True,
        config_management=True,
        traffic_throttling=True,
        maintenance_mode=True,
        
        # Disk settings
        disk_cleanup_threshold=0.75,  # Cleanup at 75% disk usage
        disk_critical_threshold=0.90,  # Critical at 90% disk usage
        
        # Traffic settings
        default_rps=50,  # 50 requests per second default
        overload_threshold=0.7,  # Throttle at 70% system load
    )

    agent = AutonomousRecoveryAgent(
        flask_app=app,
        mongodb_url=os.getenv('MONGO_URI'),
        config=config
    )
    agent.start()

    # import blueprints
    from app.routes.main_routes import main_bp
    from app.routes.user_routes import user_bp
    from app.routes.timetable_routes import timetable_bp
    from app.routes.faculty_routes import faculty_bp
    from app.routes.swap_routes import swap_bp
    from app.routes.telegram_routes import telegram_bp

    # register blueprints
    app.register_blueprint(main_bp)
    app.register_blueprint(timetable_bp, url_prefix="/api/timetable")
    app.register_blueprint(faculty_bp, url_prefix="/api/faculties")
    app.register_blueprint(user_bp, url_prefix="/api/user")
    app.register_blueprint(swap_bp, url_prefix="/api")
    app.register_blueprint(telegram_bp)

    return app
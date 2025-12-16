from flask import Blueprint
from app.controllers.timetable_controller import save_timetable

main_bp = Blueprint("main", __name__)

main_bp.route("/api/timetable", methods=["POST"])(save_timetable)
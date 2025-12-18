from flask import Blueprint
from app.controllers.timetable_controller import save_timetable
from app.controllers.replace_lecture_controller import replace_lecture
from app.controllers.rearrange_lecture_controller import rearrange_lecture
from app.controllers.fetch_timetable import fetch_timetable

main_bp = Blueprint("main", __name__)

main_bp.route("/api/timetable", methods=["POST"])(save_timetable)
main_bp.route("/api/replacetimetable", methods=["POST"])(replace_lecture)
main_bp.route("/api/rearrangetimetable", methods=["POST"])(rearrange_lecture)
main_bp.route("/api/fetchtimetable", methods=["GET"])(fetch_timetable)
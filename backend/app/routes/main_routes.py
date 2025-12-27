from flask import Blueprint
from app.controllers.timetable_controller import save_timetable
from app.controllers.get_all_timetables import get_all_timetables
from app.controllers.replace_lecture_controller import replace_lecture, get_available_faculty, assign_faculty
from app.controllers.rearrange_lecture_controller import rearrange_lecture, get_rearrange_options, execute_rearrange
from app.controllers.fetch_timetable import fetch_timetable
from app.controllers.delete_timetable_controller import delete_timetable
from app.controllers.fetch_all_changes import fetch_all_changes, delete_temp_change
from app.controllers.fetch_allowed_faculty import (
    fetch_allowed_faculty, 
    update_allowed_faculty, 
    delete_allowed_faculty
)
from app.controllers.fetch_all_faculties import get_all_faculties, create_faculty, get_faculty

main_bp = Blueprint("main", __name__)

main_bp.route("/api/timetable", methods=["POST"])(save_timetable)
main_bp.route("/api/timetable", methods=["DELETE"])(delete_timetable)

main_bp.route("/api/replacetimetable", methods=["POST"])(replace_lecture)
main_bp.route("/api/rearrangetimetable", methods=["POST"])(rearrange_lecture)
main_bp.route("/api/get-rearrange-options", methods=["POST"])(get_rearrange_options)
main_bp.route("/api/execute-rearrange", methods=["POST", "OPTIONS"])(execute_rearrange)
main_bp.route("/api/get-available-faculty", methods=["POST"])(get_available_faculty)
main_bp.route("/api/assign-faculty", methods=["POST"])(assign_faculty)

main_bp.route("/api/fetchtimetable", methods=["GET"])(fetch_timetable)
main_bp.route("/api/timetable", methods=["GET"])(get_all_timetables)

main_bp.route("/api/fetch-all-changes", methods=["GET"])(fetch_all_changes)
main_bp.route("/api/delete-temp-change", methods=["DELETE"])(delete_temp_change)
main_bp.route("/api/classwise-faculty", methods=["GET"])(fetch_allowed_faculty)

main_bp.route("/api/faculties", methods=["GET"])(get_all_faculties)
main_bp.route("/api/faculties", methods=["POST"])(create_faculty)
main_bp.route("/api/faculties/<faculty_id>", methods=["GET"])(get_faculty)
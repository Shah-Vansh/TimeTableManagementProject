from flask import Blueprint
from app.controllers.timetable_controller import (
    save_timetable,
    fetch_timetable,
    get_all_timetables,
    delete_timetable
)
from app.middlewares.auth_middleware import token_required
from app.middlewares.admin_middleware import is_admin_required

timetable_bp = Blueprint("timetable", __name__)

@timetable_bp.route("/", methods=["POST"], strict_slashes=False)
@token_required
@is_admin_required
def save():
    return save_timetable()

@timetable_bp.route("/fetchtimetable", methods=["GET"])
@token_required
def fetch():
    return fetch_timetable()

@timetable_bp.route("/", methods=["GET"], strict_slashes=False)
@token_required
def read():
    return get_all_timetables()

@timetable_bp.route("/", methods=["DELETE"], strict_slashes=False)
@token_required
@is_admin_required
def delete():
    return delete_timetable()
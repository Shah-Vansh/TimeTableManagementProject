from flask import Blueprint
from app.controllers.swap_controller import (
    get_available_faculty,
    assign_faculty,
    replace_lecture,
    get_rearrange_options,
    execute_rearrange,
    rearrange_lecture,
    update_allowed_faculty,
    delete_allowed_faculty,
    fetch_all_changes,
    delete_temp_change
)
from app.middlewares.auth_middleware import token_required
from app.middlewares.admin_middleware import is_admin_required

swap_bp = Blueprint("swap", __name__)

@swap_bp.route("/get-available-faculty", methods=["POST"])
@token_required
def getfaculty():
    return get_available_faculty()

@swap_bp.route("/assign-faculty", methods=["POST"])
@token_required
def assignfaculty():
    return assign_faculty()

@swap_bp.route("/replace-lecture", methods=["POST","OPTIONS"])
@token_required
def replace():
    return replace_lecture()

@swap_bp.route("/get-rearrange-options", methods=["POST"])
@token_required
def getreaarange():
    return get_rearrange_options()

@swap_bp.route("/execute-rearrange", methods=["POST","OPTIONS"])
@token_required
def executereaarange():
    return execute_rearrange()

@swap_bp.route("/rearrange-lecture", methods=["POST","OPTIONS"])
@token_required
def reaarange():
    return rearrange_lecture()

@swap_bp.route("/fetch-all-changes", methods=["GET"])
@token_required
def fetchchanges():
    return fetch_all_changes()

@swap_bp.route("/delete-temp-change", methods=["DELETE"])
@token_required
def deletetempchange():
    return delete_temp_change()

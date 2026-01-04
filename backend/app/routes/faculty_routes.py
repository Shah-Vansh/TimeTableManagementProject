from flask import Blueprint
from app.controllers.faculty_controller import (
    get_all_faculties,
    create_faculty,
    get_faculty,
    update_faculty,
    delete_faculty,
    toggle_faculty_admin
)
from app.middlewares.auth_middleware import token_required
from app.middlewares.admin_middleware import is_admin_required

faculty_bp = Blueprint("faculty", __name__)

@faculty_bp.route("/", methods=['GET'], strict_slashes=False)
@token_required
def getallfaculty():
    return get_all_faculties()

@faculty_bp.route("/", methods=['POST'], strict_slashes=False)
@token_required
@is_admin_required
def create():
    return create_faculty()

@faculty_bp.route('/<faculty_id>', methods=['GET'])
@token_required
def getfaculty(faculty_id):
    return get_faculty(faculty_id)

@faculty_bp.route('/<faculty_id>', methods=['PUT'])
@token_required
def update(faculty_id):
    return update_faculty(faculty_id)

@faculty_bp.route('/<faculty_id>', methods=['DELETE'])
@token_required
@is_admin_required
def delete(faculty_id):
    return delete_faculty(faculty_id)

@faculty_bp.route('/<faculty_id>/toggle-admin', methods=['PATCH'])
@token_required
@is_admin_required
def toggle(faculty_id):
    return toggle_faculty_admin(faculty_id)
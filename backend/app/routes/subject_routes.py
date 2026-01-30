from flask import Blueprint
from app.controllers.subject_controller import (
    get_all_subjects,
    create_subject,
    get_subject,
    update_subject,
    delete_subject,
    get_classwise_subjects
)
from app.middlewares.auth_middleware import token_required
from app.middlewares.admin_middleware import is_admin_required

subject_bp = Blueprint("subject", __name__)

@subject_bp.route("/", methods=['GET'], strict_slashes=False)
@token_required
def getallsubjects():
    return get_all_subjects()

@subject_bp.route("/", methods=['POST'], strict_slashes=False)
@token_required
@is_admin_required
def create():
    return create_subject()

@subject_bp.route('/<subject_code>', methods=['GET'])
@token_required
def getsubject(subject_code):
    return get_subject(subject_code)

@subject_bp.route('/<subject_code>', methods=['PUT'])
@token_required
@is_admin_required
def update(subject_code):
    return update_subject(subject_code)

@subject_bp.route('/<subject_code>', methods=['DELETE'])
@token_required
@is_admin_required
def delete(subject_code):
    return delete_subject(subject_code)

# Add this to your subject_routes.py or subject_bp definition

@subject_bp.route('/classwise/<sem>/<branch>/<class_name>', methods=['GET'])
@token_required
def getclasswisesubjects(sem, branch, class_name):
    return get_classwise_subjects(sem, branch, class_name)
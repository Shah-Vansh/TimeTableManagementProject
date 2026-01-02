from flask import Blueprint
from app.controllers.user_controller import (
    login_user,
    register_user,
    get_my_profile,
    update_profile,
)
from app.middlewares.auth_middleware import token_required

user_bp = Blueprint("user", __name__)

@user_bp.route("/login", methods=["POST"])
def login():
    return login_user()

@user_bp.route("/register", methods=["POST"])
def register():
    return register_user()

@user_bp.route("/profile", methods=["GET"])
@token_required
def profile():
    return get_my_profile()

@user_bp.route("/profile", methods=["PUT"])
@token_required
def profile_update():
    return update_profile()
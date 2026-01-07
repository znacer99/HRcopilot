from flask import Blueprint, request, jsonify
from core.models import User
from core.extensions import db
import jwt
from datetime import datetime, timedelta
from config import Config
from modules.auth.jwt_utils import mobile_auth_required
from argon2 import PasswordHasher

api_mobile_auth = Blueprint("api_mobile_auth", __name__, url_prefix="/api/mobile/auth")

@api_mobile_auth.route("/login", methods=["POST"])
def mobile_login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    token = jwt.encode(
        {
            "id": user.id,
            "exp": datetime.utcnow() + timedelta(days=7)
        },
        Config.JWT_SECRET_KEY,
        algorithm="HS256"
    )

    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role
        }
    }), 200

# --------------------------------------------------------
# GET CURRENT PROFILE (ME)
# --------------------------------------------------------
@api_mobile_auth.route("/me", methods=["GET"])
@mobile_auth_required
def get_me():
    user = getattr(request, 'user', None)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    from core.models import Employee
    employee = Employee.query.filter_by(user_id=user.id).first()
    
    return jsonify({
        "success": True,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "phone": user.phone, # User account phone
            "position": user.position,
            "avatar": user.avatar,
            "is_active": user.is_active
        },
        "employee": {
            "id": employee.id if employee else None,
            "full_name": employee.full_name if employee else user.name,
            "job_title": employee.job_title if employee else user.role,
            "phone": employee.phone if employee else None,
            "address": employee.actual_address if employee else None,
            "mother_country_address": employee.mother_country_address if employee else None,
            "country": employee.country if employee else None,
            "state": employee.state if employee else None,
            "birth_date": employee.birth_date.strftime('%Y-%m-%d') if employee and employee.birth_date else None,
            "id_number": employee.id_number if employee else None,
            "id_type": employee.id_type if employee else "National ID",
            "department": employee.department.name if employee and employee.department else "General",
            "hire_date": employee.created_at.strftime('%Y-%m-%d') if employee else None,
            "nationality": employee.nationality if employee else None
        }
    }), 200

# --------------------------------------------------------
# UPDATE PROFILE (PHONE)
# --------------------------------------------------------
@api_mobile_auth.route("/profile", methods=["PUT"])
@mobile_auth_required
def update_profile():
    user = getattr(request, 'user', None)
    data = request.json or {}
    new_phone = data.get("phone")

    if not new_phone:
        return jsonify({"success": False, "message": "Phone number is required"}), 400

    from core.models import Employee
    employee = Employee.query.filter_by(user_id=user.id).first()
    
    # Update both for sync
    user.phone = new_phone
    if employee:
        employee.phone = new_phone
    
    db.session.commit()
    
    return jsonify({
        "success": True, 
        "message": "Profile updated successfully",
        "phone": new_phone
    }), 200

# --------------------------------------------------------
# CHANGE PASSWORD
# --------------------------------------------------------
@api_mobile_auth.route("/change-password", methods=["POST"])
@mobile_auth_required
def change_password():
    user = getattr(request, 'user', None)
    data = request.json or {}
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not old_password or not new_password:
        return jsonify({"success": False, "message": "All fields are required"}), 400

    if not user.check_password(old_password):
        return jsonify({"success": False, "message": "Incorrect old password"}), 401

    if len(new_password) < 6:
        return jsonify({"success": False, "message": "New password must be at least 6 characters"}), 400

    user.set_password(new_password)
    db.session.commit()
    
    return jsonify({"success": True, "message": "Password changed successfully"}), 200

api_mobile_bp = api_mobile_auth
api_mobile_auth_bp = api_mobile_auth
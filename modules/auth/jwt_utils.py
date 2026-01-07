import jwt
from flask import request, jsonify
from functools import wraps
from config import Config

from core.models import User
from core.extensions import db

def mobile_auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({"success": False, "message": "Auth token missing"}), 401
        
        token = auth_header.replace("Bearer ", "")

        try:
            payload = jwt.decode(token, Config.JWT_SECRET_KEY, algorithms=["HS256"])
            user_id = payload["id"]
            user = db.session.get(User, user_id)
            if not user:
                 return jsonify({"success": False, "message": "User not found"}), 401
            request.user = user
            request.user_id = user_id
        except Exception:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 401

        return f(*args, **kwargs)
    return wrapper

def mobile_role_required(roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not hasattr(request, 'user') or not request.user:
                 return jsonify({"success": False, "message": "User context missing"}), 401
            
            # Normalize roles to list of lower case strings
            required_roles = [r.lower() for r in roles] if isinstance(roles, list) else [roles.lower()]
            
            if request.user.role.lower() not in required_roles:
                return jsonify({
                    "success": False, 
                    "message": "Permission denied. Required roles: " + ", ".join(required_roles)
                }), 403
            
            return f(*args, **kwargs)
        return wrapper
    return decorator



# core/utils.py
from functools import wraps
from flask import abort, redirect, url_for
from flask_login import current_user
from core.permissions import Permission
from core.extensions import db
from core.models import ActivityLog

def permission_required(feature, required_level):
    """Decorator for route permission checking"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                return redirect(url_for('auth.login'))
                
            if not current_user.has_permission(feature, required_level):
                abort(403, "You don't have permission to access this resource")
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def track_activity(f):
    """Decorator to track user activity"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In a real system, we'd log the activity
        # For now, just pass
        return f(*args, **kwargs)
    return decorated_function

def log_activity(user_id, action, target):
    log = ActivityLog(user_id=user_id, action=action, target=target)
    db.session.add(log)
    db.session.commit()
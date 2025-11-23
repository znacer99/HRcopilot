from flask import Blueprint, request, jsonify
from flask_login import login_user
from core.extensions import db
from core.models import User
from datetime import datetime

api_auth_bp = Blueprint('api_auth', __name__, url_prefix='/api/auth')

# Disable CSRF for this entire blueprint
@api_auth_bp.before_app_request
def disable_csrf():
    from flask import g
    g._csrf_enabled = False

@api_auth_bp.route('/login', methods=['POST'])
def api_login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    user = User.query.filter_by(email=email).first()
    
    if user and user.check_password(password):
        login_user(user)
        user.login_count += 1
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'name': user.full_name,
                'role': user.role
            }
        }), 200
    
    return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
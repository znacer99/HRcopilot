from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from core.extensions import db
from core.models import User
from datetime import datetime

api_user_bp = Blueprint('api_user', __name__, url_prefix='/api/users')

@api_user_bp.route('', methods=['GET'])
@login_required
def get_users():
    try:
        users = User.query.filter_by(is_active=True).all()
        return jsonify({
            'success': True,
            'users': [{
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'role': u.role,
                'phone': u.phone,
                'position': u.position,
                'created_at': u.created_at.isoformat(),
                'last_login': u.last_login.isoformat() if u.last_login else None
            } for u in users]
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_user_bp.route('/<int:id>', methods=['GET'])
@login_required
def get_user(id):
    try:
        u = User.query.get_or_404(id)
        return jsonify({
            'success': True,
            'user': {
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'role': u.role,
                'phone': u.phone,
                'position': u.position,
                'access_code': u.access_code,
                'is_active': u.is_active,
                'login_count': u.login_count,
                'created_at': u.created_at.isoformat(),
                'last_login': u.last_login.isoformat() if u.last_login else None
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@api_user_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    try:
        u = current_user
        return jsonify({
            'success': True,
            'user': {
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'role': u.role,
                'phone': u.phone,
                'position': u.position
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

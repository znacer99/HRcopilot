from flask import Blueprint, jsonify, request
from core.extensions import db
from core.models import User
from datetime import datetime
from modules.auth.jwt_utils import mobile_auth_required

api_user_bp = Blueprint('api_user', __name__, url_prefix='/api/users')

# Helper to get user from JWT
def get_current_user_obj():
    user_id = getattr(request, "user_id", None)
    if not user_id:
        return None
    return User.query.get(user_id)


# ------------------------------------------------------------
# GET ALL USERS (ADMIN/MANAGER ONLY)
# ------------------------------------------------------------
@api_user_bp.route('', methods=['GET'])
@mobile_auth_required
def get_users():
    try:
        user = getattr(request, "user", None)
        # Managers can see users. If it's an admin, maybe they want to see inactive ones too via a flag.
        include_inactive = request.args.get('include_inactive', 'false').lower() == 'true'
        
        if include_inactive:
            # Only allow top roles to see inactive users
            if user.role.lower() not in ['it_manager', 'general_director']:
                return jsonify({'success': False, 'message': 'Permission denied to view inactive users'}), 403
            users = User.query.all()
        else:
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
                'is_active': u.is_active,
                'created_at': u.created_at.isoformat(),
                'last_login': u.last_login.isoformat() if u.last_login else None
            } for u in users]
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


# ------------------------------------------------------------
# CREATE A NEW USER
# ------------------------------------------------------------
@api_user_bp.route('', methods=['POST'])
@mobile_auth_required
def create_user():
    try:
        current_user = getattr(request, "user", None)
        if current_user.role.lower() not in ['it_manager', 'general_director', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        data = request.json
        if not data.get('email') or not data.get('password') or not data.get('name'):
            return jsonify({'success': False, 'message': 'Missing required fields'}), 400

        # Check if email exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'success': False, 'message': 'Email already exists'}), 400

        # Generate unique access code if not provided
        access_code = data.get('access_code')
        if not access_code:
            import random, string
            access_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

        new_user = User(
            email=data['email'],
            name=data['name'],
            role=data.get('role', 'employee'),
            phone=data.get('phone'),
            position=data.get('position'),
            access_code=access_code,
            is_active=True
        )
        new_user.set_password(data['password'])

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User created successfully',
            'user_id': new_user.id
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ------------------------------------------------------------
# UPDATE A USER (OR SUSPEND)
# ------------------------------------------------------------
@api_user_bp.route('/<int:id>', methods=['PUT'])
@mobile_auth_required
def update_user(id):
    try:
        current_user = getattr(request, "user", None)
        if current_user.role.lower() not in ['it_manager', 'general_director', 'manager']:
            return jsonify({'success': False, 'message': 'Permission denied'}), 403

        u = User.query.get_or_404(id)
        data = request.json

        # Update fields if provided
        if 'name' in data: u.name = data['name']
        if 'email' in data: u.email = data['email']
        if 'role' in data: u.role = data['role']
        if 'phone' in data: u.phone = data['phone']
        if 'position' in data: u.position = data['position']
        if 'is_active' in data: u.is_active = data['is_active']
        
        if 'password' in data and data['password']:
            u.set_password(data['password'])

        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User updated successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ------------------------------------------------------------
# DELETE A USER
# ------------------------------------------------------------
@api_user_bp.route('/<int:id>', methods=['DELETE'])
@mobile_auth_required
def delete_user(id):
    try:
        current_user = getattr(request, "user", None)
        # Deleting is high risk, restrict to IT Manager / Director
        if current_user.role.lower() not in ['it_manager', 'general_director']:
            return jsonify({'success': False, 'message': 'Only IT Manager can delete users'}), 403

        u = User.query.get_or_404(id)
        
        # Don't let users delete themselves
        if u.id == current_user.id:
            return jsonify({'success': False, 'message': 'You cannot delete your own account'}), 400

        db.session.delete(u)
        db.session.commit()

        return jsonify({
            'success': True,
            'message': 'User deleted successfully'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500


# ------------------------------------------------------------
# GET A SPECIFIC USER
# ------------------------------------------------------------
@api_user_bp.route('/<int:id>', methods=['GET'])
@mobile_auth_required
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


# ------------------------------------------------------------
# GET LOGGED-IN USER (PROFILE)
# ------------------------------------------------------------
@api_user_bp.route('/me', methods=['GET'])
@mobile_auth_required
def get_current_user_me():
    try:
        u = get_current_user_obj()
        if not u:
            return jsonify({'success': False, 'message': 'User not found'}), 404

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

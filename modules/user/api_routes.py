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
            email=data['email'].lower().strip(),
            name=data['name'],
            role=data.get('role', 'employee'),
            phone=data.get('phone'),
            position=data.get('position'),
            access_code=access_code,
            is_active=True
        )
        new_user.set_password(data['password'].strip())

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
        if 'email' in data: u.email = data['email'].lower().strip()
        if 'role' in data: u.role = data['role']
        if 'phone' in data: u.phone = data['phone']
        if 'position' in data: u.position = data['position']
        if 'is_active' in data: u.is_active = data['is_active']
        
        if 'password' in data and data['password']:
            u.set_password(data['password'].strip())

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
        from core.models import Employee
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
                'last_login': u.last_login.isoformat() if u.last_login else None,
                'employee': {
                    'id': u.employee.id,
                    'full_name': u.employee.full_name
                } if u.employee else None
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
        from core.models import Employee, Department
        u = get_current_user_obj()
        if not u:
            return jsonify({'success': False, 'message': 'User not found'}), 404

        # Fetch related employee data if exists
        employee = Employee.query.filter_by(user_id=u.id).first()
        emp_data = None
        if employee:
            dept = Department.query.get(employee.department_id) if employee.department_id else None
            emp_data = {
                'id': employee.id,
                'full_name': employee.full_name,
                'job_title': employee.job_title,
                'phone': employee.phone,
                'department': dept.name if dept else None,
                'department_id': employee.department_id,
                'nationality': employee.nationality,
                'id_number': employee.id_number,
                'id_type': employee.id_type,
                'birth_date': employee.birth_date.isoformat() if employee.birth_date else None,
                'actual_address': employee.actual_address,
                'country': employee.country,
                'state': employee.state
            }

        return jsonify({
            'success': True,
            'user': {
                'id': u.id,
                'name': u.name,
                'email': u.email,
                'role': u.role,
                'phone': u.phone,
                'position': u.position,
                'employee': emp_data
            }
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
# ------------------------------------------------------------
# LINK USER TO EMPLOYEE
# ------------------------------------------------------------
@api_user_bp.route('/<int:id>/link-employee', methods=['POST'])
@mobile_auth_required
def link_employee(id):
    try:
        from core.models import Employee
        u = User.query.get_or_404(id)
        data = request.json
        emp_id = data.get('employee_id')
        
        if not emp_id:
            return jsonify({'success': False, 'message': 'employee_id required'}), 400
            
        emp = Employee.query.get(emp_id)
        if not emp:
            return jsonify({'success': False, 'message': 'Employee not found'}), 404
            
        emp.user_id = u.id
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Linked successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ------------------------------------------------------------
# CREATE EMPLOYEE RECORD FROM USER
# ------------------------------------------------------------
@api_user_bp.route('/<int:id>/create-employee', methods=['POST'])
@mobile_auth_required
def create_employee_from_user(id):
    try:
        from core.models import Employee
        u = User.query.get_or_404(id)
        
        # Check if already linked
        if Employee.query.filter_by(user_id=u.id).first():
            return jsonify({'success': False, 'message': 'User already has an HR record'}), 400
            
        new_emp = Employee(
            full_name=u.name,
            phone=u.phone,
            job_title=u.position,
            user_id=u.id
        )
        db.session.add(new_emp)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'HR record generated', 'employee_id': new_emp.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ------------------------------------------------------------
# UNLINK USER FROM EMPLOYEE
# ------------------------------------------------------------
@api_user_bp.route('/<int:id>/unlink-employee', methods=['POST'])
@mobile_auth_required
def unlink_employee_endpoint(id):
    try:
        from core.models import Employee
        # Find any employee linked to this user
        employee = Employee.query.filter_by(user_id=id).first()
        if not employee:
            return jsonify({'success': False, 'message': 'No linked employee found'}), 404
        
        employee.user_id = None
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Account linkage removed.'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

# ------------------------------------------------------------
# SYNC USER DATA TO EMPLOYEE RECORD
# ------------------------------------------------------------
@api_user_bp.route('/<int:id>/sync-employee', methods=['POST'])
@mobile_auth_required
def sync_employee_endpoint(id):
    try:
        from core.models import Employee
        u = User.query.get_or_404(id)
        employee = Employee.query.filter_by(user_id=id).first()
        if not employee:
            return jsonify({'success': False, 'message': 'No linked employee found to sync.'}), 404
        
        # Sync core fields
        employee.full_name = u.name
        employee.phone = u.phone
        employee.job_title = u.position
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Employee record synchronized with system profile.'
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500

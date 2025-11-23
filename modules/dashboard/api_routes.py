from flask import Blueprint, jsonify
from flask_login import login_required, current_user
from core.models import Employee, Department, LeaveRequest

api_dashboard_bp = Blueprint('api_dashboard', __name__, url_prefix='/api/dashboard')

@api_dashboard_bp.route('/stats', methods=['GET'])
@login_required
def get_stats():
    total_employees = Employee.query.count()
    total_departments = Department.query.count()
    pending_leaves = LeaveRequest.query.filter_by(status='pending').count()
    
    return jsonify({
        'success': True,
        'stats': {
            'employees': total_employees,
            'departments': total_departments,
            'pending_leaves': pending_leaves
        }
    }), 200

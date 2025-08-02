# pyright: reportMissingImports=false
# pyright: reportMissingModuleSource=false
from flask import Blueprint, render_template, redirect, url_for, request, flash
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload
from core.decorators import permission_required, role_required
from core.models import User, Department, ActivityLog, db
from core.permissions import Permission
from .services import get_director_dashboard_data, get_manager_dashboard_data
from modules.employee.services import create_employee, update_employee
from core.logger import audit_log

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@login_required
def role_dashboard():
    """Redirect to role-specific dashboard"""
    role = current_user.role.lower()
    if role in ["general_director", "it_manager"]:
        return redirect(url_for('dashboard.admin_dashboard'))
    elif role in ["general_manager", "head_of_department", "manager"]:
        return redirect(url_for('dashboard.manager_dashboard'))
    else:
        return redirect(url_for('dashboard.employee_dashboard'))

@dashboard_bp.route('/admin')
@login_required
@role_required(['general_director', 'it_manager'])
def admin_dashboard():
    dashboard_data = get_director_dashboard_data()
    template = 'dashboard/general_director.html' 
    if current_user.role.lower() == "it_manager":
        template = 'dashboard/it_manager.html'
    return render_template(template, user=current_user, **dashboard_data)

@dashboard_bp.route('/manager')
@login_required
@role_required(['general_manager', 'head_of_department', 'manager'])
def manager_dashboard():
    dashboard_data = get_manager_dashboard_data(current_user)
    return render_template('dashboard/manager.html', user=current_user, **dashboard_data)

@dashboard_bp.route('/employee')
@login_required
def employee_dashboard():
    return render_template('dashboard/employee.html', user=current_user)

@dashboard_bp.route('/employee-summary')
@login_required
@permission_required(Permission.VIEW)
def employee_summary():
    employees = User.query.order_by(User.created_at.desc()).limit(10).all()
    return render_template('dashboard/partials/employee_summary.html', 
                          employees=employees)

@dashboard_bp.route('/department-summary')
@login_required
@permission_required(Permission.VIEW)
def department_summary():
    # Fixed: Use proper relationship name
    departments = Department.query.options(joinedload(Department.users)).all()
    return render_template('dashboard/partials/department_summary.html',
                          departments=departments)

@dashboard_bp.route('/recent-activities')
@login_required
@permission_required(Permission.VIEW)
def recent_activities():
    activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return render_template('dashboard/partials/recent_activities.html', 
                          activities=activities)

@dashboard_bp.route('/employee/create', methods=['POST'])
@login_required
@permission_required(Permission.ADMIN)
def create_employee_route():
    form_data = request.form.to_dict()
    try:
        employee = create_employee(form_data)
        audit_log(f'Created employee: {employee.email}')
        flash('Employee created successfully', 'success')
        return redirect(url_for('dashboard.employee_management'))
    except Exception as e:
        flash(f'Error creating employee: {str(e)}', 'danger')
        return redirect(url_for('dashboard.employee_form'))

@dashboard_bp.route('/employee/<int:id>/update', methods=['POST'])
@login_required
@permission_required(Permission.EDIT)
def update_employee_route(id):
    form_data = request.form.to_dict()
    try:
        employee = update_employee(id, form_data)
        audit_log(f'Updated employee: {employee.email}')
        flash('Employee updated successfully', 'success')
        return redirect(url_for('dashboard.employee_profile', id=id))
    except Exception as e:
        flash(f'Update error: {str(e)}', 'danger')
        return redirect(url_for('dashboard.edit_employee', id=id))
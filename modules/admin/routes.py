# modules/admin/routes.py
from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user
from core.models import db, User, Department

admin_bp = Blueprint('admin', __name__)

# SIMPLIFIED AUTH MIDDLEWARE
@admin_bp.before_request
def require_admin_auth():
    # Allow login page and static files
    if request.endpoint in ['admin.admin_login', 'static']:
        return
    
    # Block unauthenticated users
    if not current_user.is_authenticated:
        return redirect(url_for('admin.admin_login'))
    
    # Block non-IT Managers
    if current_user.role != "it_manager":  # Only IT managers can access
        abort(403)

# BASIC ADMIN DASHBOARD
@admin_bp.route('/')
@login_required
def dashboard():
    return render_template('admin/dashboard.html')

# EMPLOYEE LIST
@admin_bp.route('/employees')
@login_required
def employee_list():
    employees = User.query.all()
    return render_template('admin/employees.html', employees=employees)

# ACTIVATE/DEACTIVATE EMPLOYEE
@admin_bp.route('/toggle-employee/<int:employee_id>', methods=['POST'])
@login_required
def toggle_employee(employee_id):
    employee = User.query.get(employee_id)
    if employee:
        employee.is_active = not employee.is_active
        db.session.commit()
        flash(f"{employee.name} {'activated' if employee.is_active else 'deactivated'}")
    return redirect(url_for('admin.employee_list'))

# EDIT EMPLOYEE (BASIC INFO)
@admin_bp.route('/edit-employee/<int:employee_id>', methods=['GET', 'POST'])
@login_required
def edit_employee(employee_id):
    employee = User.query.get_or_404(employee_id)
    departments = Department.query.all()
    
    if request.method == 'POST':
        employee.name = request.form['name']
        employee.email = request.form['email']
        employee.department_id = request.form['department']
        db.session.commit()
        flash(f"{employee.name} updated")
        return redirect(url_for('admin.employee_list'))
    
    return render_template('admin/edit_employee.html', 
                          employee=employee, 
                          departments=departments)

# DEPARTMENT LIST
@admin_bp.route('/departments')
@login_required
def department_list():
    departments = Department.query.all()
    return render_template('admin/departments.html', departments=departments)
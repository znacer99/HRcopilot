# modules/dashboard/routes.py
from flask import Blueprint, render_template, redirect, url_for, request, flash, abort
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from core.decorators import permission_required, role_required
from core.models import User, Department, ActivityLog, db
from core.permissions import Permission
from .services import get_director_dashboard_data, get_manager_dashboard_data
from modules.employee.services import create_employee, update_employee, delete_employee
from core.logger import audit_log

dashboard_bp = Blueprint('dashboard', __name__, template_folder='templates')


@dashboard_bp.route('/')
@login_required
def role_dashboard():
    role = (current_user.role or '').lower()

    if role == "it_manager":
        return redirect(url_for('dashboard.it_manager_dashboard'))

    elif role == "general_director":
        return redirect(url_for('dashboard.director_dashboard'))

    elif role in ["general_manager", "head_of_department", "manager"]:
        return redirect(url_for('dashboard.manager_dashboard'))

    else:
        return redirect(url_for('dashboard.employee_dashboard'))


@dashboard_bp.route('/it_manager')
@login_required
@role_required(['it_manager'])
def it_manager_dashboard():
    """
    IT Manager dashboard:
      - q: free text search against name/email
      - role: filter by role
      - department: filter by department id
      - page: pagination (1-based)
    """
    q = (request.args.get('q') or '').strip()
    role_filter = (request.args.get('role') or '').strip()
    dept_filter = (request.args.get('department') or '').strip()
    try:
        page = max(int(request.args.get('page', 1)), 1)
    except Exception:
        page = 1
    per_page = 10

    query = User.query

    if q:
        like = f"%{q}%"
        query = query.filter(or_(User.name.ilike(like), User.email.ilike(like)))

    if role_filter:
        query = query.filter(User.role == role_filter)

    if dept_filter:
        # Accept either id or empty
        try:
            dept_id = int(dept_filter)
            query = query.filter(User.department_id == dept_id)
        except ValueError:
            pass

    total = query.count()
    users = query.order_by(User.created_at.desc()).limit(per_page).offset((page - 1) * per_page).all()
    departments = Department.query.order_by(Department.name).all()

    return render_template(
        'dashboard/it_manager.html',
        user=current_user,
        user_list=users,
        total=total,
        page=page,
        per_page=per_page,
        departments=departments,
        q=q,
        role_filter=role_filter,
        dept_filter=dept_filter
    )


@dashboard_bp.route('/it_manager/employee/create', methods=['GET', 'POST'])
@login_required
@role_required(['it_manager'])
def it_manager_create_employee():
    departments = Department.query.order_by(Department.name).all()
    if request.method == 'POST':
        form_data = request.form.to_dict()
        try:
            employee = create_employee(form_data)
            audit_log(f'Created employee: {employee.email}', user_id=current_user.id, action='create')
            flash('Employee created successfully', 'success')
            return redirect(url_for('dashboard.it_manager_dashboard'))
        except Exception as e:
            flash(f'Error creating employee: {str(e)}', 'danger')
            return redirect(url_for('dashboard.it_manager_create_employee'))
    return render_template('dashboard/employee_form.html', departments=departments)


@dashboard_bp.route('/it_manager/employee/<int:id>/edit', methods=['GET', 'POST'])
@login_required
@role_required(['it_manager'])
def it_manager_edit_employee(id):
    employee = User.query.get_or_404(id)
    departments = Department.query.order_by(Department.name).all()
    if request.method == 'POST':
        form_data = request.form.to_dict()
        try:
            employee = update_employee(id, form_data)
            audit_log(f'Updated employee: {employee.email}', user_id=current_user.id, action='update')
            flash('Employee updated successfully', 'success')
            return redirect(url_for('dashboard.it_manager_dashboard'))
        except Exception as e:
            flash(f'Update error: {str(e)}', 'danger')
            return redirect(url_for('dashboard.it_manager_edit_employee', id=id))
    return render_template('dashboard/employee_form.html', employee=employee, departments=departments)


@dashboard_bp.route('/it_manager/employee/<int:id>/delete', methods=['POST'])
@login_required
@role_required(['it_manager'])
def it_manager_delete_employee(id):
    try:
        employee = delete_employee(id)
        audit_log(f'Deleted employee: {employee.email}', user_id=current_user.id, action='delete')
        flash('Employee deleted successfully', 'success')
    except Exception as e:
        flash(f'Error deleting employee: {str(e)}', 'danger')
    return redirect(url_for('dashboard.it_manager_dashboard'))


@dashboard_bp.route('/general_director')
@login_required
@role_required(['general_director'])
def director_dashboard():
    dashboard_data = get_director_dashboard_data()
    return render_template('dashboard/general_director.html', user=current_user, **dashboard_data)


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
    return render_template('dashboard/partials/employee_summary.html', employees=employees)


@dashboard_bp.route('/department-summary')
@login_required
@permission_required(Permission.VIEW)
def department_summary():
    departments = Department.query.options(joinedload(Department.members)).all()
    return render_template('dashboard/partials/department_summary.html', departments=departments)


@dashboard_bp.route('/recent-activities')
@login_required
@permission_required(Permission.VIEW)
def recent_activities():
    activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return render_template('dashboard/partials/recent_activities.html', activities=activities)

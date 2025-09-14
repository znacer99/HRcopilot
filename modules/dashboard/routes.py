from flask import Blueprint, render_template, redirect, url_for, request, flash, abort, current_app, send_file, jsonify
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, func, extract
from core.decorators import permission_required, role_required
from core.models import User, Department, ActivityLog, db, UserDocument, Folder, Employee
from core.permissions import Permission
from core.forms import UserForm
from .services import get_director_dashboard_data, get_manager_dashboard_data
from modules.employee.services import (
    create_employee as create_employee_service,
    update_employee as update_employee_service,
    delete_employee as delete_employee_service,
    _save_documents
)
from core.logger import audit_log
from datetime import datetime, timedelta
from modules.leave.services import LeaveRequest
import os
import calendar
from collections import OrderedDict
from dateutil.relativedelta import relativedelta

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
    # --- Employees Stats ---
    total_employees = Employee.query.count()
    active_employees = Employee.query.join(User, isouter=True).filter(
        or_(User.is_active == True, Employee.user_id == None)
    ).count()
    inactive_employees = total_employees - active_employees

    # --- Hiring trend (last 6 months) ---
    months_dict = OrderedDict()
    for i in range(5, -1, -1):
        dt = datetime.utcnow() - relativedelta(months=i)
        months_dict[dt.strftime("%b %Y")] = 0

    hires = db.session.query(
        extract('month', Employee.created_at).label('month'),
        extract('year', Employee.created_at).label('year'),
        func.count(Employee.id)
    ).group_by('year', 'month').all()

    for month, year, count in hires:
        key = f"{calendar.month_abbr[int(month)]} {int(year)}"
        if key in months_dict:
            months_dict[key] = count

    hiring_months = list(months_dict.keys())
    hiring_counts = list(months_dict.values())

    # --- Employees per department ---
    departments = Department.query.order_by(Department.name).all()
    department_names = [d.name for d in departments]
    employees_per_dept = [
        Employee.query.filter_by(department_id=d.id).count() for d in departments
    ]

    # --- Users Stats ---
    total_users = User.query.count()
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_count = User.query.filter(User.created_at >= week_ago).count()
    month_ago = datetime.utcnow() - timedelta(days=30)
    inactive_users_count = User.query.filter(
        or_(User.last_login == None, User.last_login < month_ago)
    ).count()
    user_counts = dict(db.session.query(User.role, func.count(User.id)).group_by(User.role).all())

    # --- Recent Activities ---
    recent_activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()

    # --- Render template ---
    return render_template(
        'dashboard/it_manager.html',  # IT Manager template, same layout as General Director
        user=current_user,
        # Employee stats
        total_employees=total_employees,
        active_employees=active_employees,
        inactive_employees=inactive_employees,
        # User stats
        total_users=total_users,
        active_users=total_users - inactive_users_count,
        inactive_users_count=inactive_users_count,
        new_users_count=new_users_count,
        user_counts=user_counts,
        # Chart data
        hiring_months=hiring_months,
        hiring_counts=hiring_counts,
        department_names=department_names,
        employees_per_dept=employees_per_dept,
        # Logs
        recent_activities=recent_activities
    )



@dashboard_bp.route('/general_director')
@login_required
@role_required(['general_director'])
def director_dashboard():
    # --- Employees Stats ---
    total_employees = Employee.query.count()
    active_employees = Employee.query.join(User, isouter=True).filter(
        or_(User.is_active == True, Employee.user_id == None)
    ).count()
    inactive_employees = total_employees - active_employees

    # --- Hiring trend (last 6 months) ---
    months_dict = OrderedDict()
    for i in range(5, -1, -1):
        dt = datetime.utcnow() - relativedelta(months=i)
        months_dict[dt.strftime("%b %Y")] = 0

    hires = db.session.query(
        extract('month', Employee.created_at).label('month'),
        extract('year', Employee.created_at).label('year'),
        func.count(Employee.id)
    ).group_by('year', 'month').all()

    for month, year, count in hires:
        key = f"{calendar.month_abbr[int(month)]} {int(year)}"
        if key in months_dict:
            months_dict[key] = count

    hiring_months = list(months_dict.keys())
    hiring_counts = list(months_dict.values())

    # --- Employees per department ---
    departments = Department.query.order_by(Department.name).all()
    department_names = [d.name for d in departments]
    employees_per_dept = [
        Employee.query.filter_by(department_id=d.id).count() for d in departments
    ]

    # --- Users Stats ---
    total_users = User.query.count()
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_count = User.query.filter(User.created_at >= week_ago).count()
    month_ago = datetime.utcnow() - timedelta(days=30)
    inactive_users_count = User.query.filter(
        or_(User.last_login == None, User.last_login < month_ago)
    ).count()
    user_counts = dict(db.session.query(User.role, func.count(User.id)).group_by(User.role).all())

    # --- Recent Activities ---
    recent_activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()

    # --- Render template (stats only, no employee list) ---
    return render_template(
        'dashboard/general_director.html',
        user=current_user,
        # Employee stats
        total_employees=total_employees,
        active_employees=active_employees,
        inactive_employees=inactive_employees,
        # User stats
        total_users=total_users,
        active_users=total_users - inactive_users_count,
        inactive_users_count=inactive_users_count,
        new_users_count=new_users_count,
        user_counts=user_counts,
        # Chart data
        hiring_months=hiring_months,
        hiring_counts=hiring_counts,
        department_names=department_names,
        employees_per_dept=employees_per_dept,
        # Logs
        recent_activities=recent_activities
    )








@dashboard_bp.route('/employee/create', methods=['GET', 'POST'])
@login_required
@role_required(['it_manager', 'general_director'])
def employee_create():
    departments = Department.query.order_by(Department.name).all()

    if request.method == 'POST':
        form_data = request.form.to_dict()
        files = request.files.getlist('documents') or []  # handle multiple documents
        single_file = request.files.get('document')
        if single_file and getattr(single_file, 'filename', ''):
            files.append(single_file)

        try:
            # Use the Employee service
            employee = create_employee_service(form_data, files=files)

            audit_log(
                f'Created employee: {employee.full_name} (ID: {employee.id})',
                user_id=current_user.id,
                action='create'
            )

            flash('Employee created successfully', 'success')
            return redirect(url_for('dashboard.role_dashboard'))

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f'Error creating employee: {str(e)}')
            flash(f'Error creating employee: {str(e)}', 'danger')
            return redirect(url_for('dashboard.employee_create'))

    return render_template('dashboard/employee_form.html', departments=departments)



@dashboard_bp.route('/employee/<int:id>/edit', methods=['GET', 'POST'])
@login_required
@role_required(['it_manager', 'general_director'])
def employee_edit(id):
    employee = Employee.query.get_or_404(id)
    departments = Department.query.order_by(Department.name).all()

    if request.method == 'POST':
        form_data = request.form.to_dict()
        files = request.files.getlist('documents') or []
        single_file = request.files.get('document')
        if single_file and getattr(single_file, 'filename', ''):
            files.append(single_file)

        try:
            # Pass files to service
            employee = update_employee_service(employee.id, form_data, files=files)

            audit_log(
                f'Updated employee: {employee.full_name} (ID: {employee.id})',
                user_id=current_user.id,
                action='update'
            )

            flash('Employee updated successfully', 'success')
            return redirect(url_for('dashboard.role_dashboard'))

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f'Error updating employee: {str(e)}')
            flash(f'Error updating employee: {str(e)}', 'danger')
            return redirect(url_for('dashboard.employee_edit', id=id))

    return render_template('dashboard/employee_form.html', employee=employee, departments=departments)

@dashboard_bp.route('/employee/<int:id>/delete', methods=['POST'])
@login_required
@role_required(['it_manager', 'general_director'])
def employee_delete(id):
    try:
        # Use the Employee service to delete
        employee = delete_employee_service(id)
        audit_log(f'Deleted employee: {employee.full_name}', user_id=current_user.id, action='delete')
        flash('Employee deleted successfully', 'success')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error deleting employee {id}: {str(e)}")
        flash(f'Error deleting employee: {str(e)}', 'danger')

    return redirect(url_for('dashboard.role_dashboard'))





@dashboard_bp.route('/manager')
@login_required
@role_required(['general_manager', 'head_of_department', 'manager'])
def manager_dashboard():
    dashboard_data = get_manager_dashboard_data(current_user)
    return render_template('dashboard/manager.html', user=current_user, **dashboard_data)


# ------------------------
# Employee Dashboard
# ------------------------
@dashboard_bp.route('/employee')
@login_required
@role_required(['employee'])
def employee_dashboard():
    # -----------------------
    # User's own documents
    # -----------------------
    documents = UserDocument.query.filter_by(user_id=current_user.id)\
        .order_by(UserDocument.uploaded_at.desc()).all()

    # -----------------------
    # Shared documents (not uploaded by user)
    # -----------------------
    # Optimized: only load documents that are accessible by this user
    all_docs = UserDocument.query.filter(UserDocument.user_id != current_user.id).all()
    shared_documents = [doc for doc in all_docs if doc.can_user_access(current_user)]

    # -----------------------
    # Recent activities
    # -----------------------
    recent_activities = ActivityLog.query.filter_by(user_id=current_user.id)\
        .order_by(ActivityLog.timestamp.desc()).limit(10).all()

    # -----------------------
    # Recent leave requests
    # -----------------------
    latest_leaves = LeaveRequest.query.filter_by(user_id=current_user.id)\
        .order_by(LeaveRequest.created_at.desc()).limit(3).all()

    return render_template(
        'dashboard/employee.html',
        user=current_user,
        documents=documents,
        shared_documents=shared_documents,
        recent_activities=recent_activities,
        latest_leaves=latest_leaves
    )




@dashboard_bp.route('/employee/upload_document', methods=['POST'])
@login_required
def employee_upload_document():
    try:
        # -----------------------
        # Collect files: multiple or single
        # -----------------------
        files = request.files.getlist("documents") or []
        single_file = request.files.get("document")
        if single_file and getattr(single_file, "filename", ""):
            files.append(single_file)

        # -----------------------
        # Validate files
        # -----------------------
        allowed_extensions = {'pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'}
        valid_files = [f for f in files if f and '.' in f.filename and f.filename.rsplit('.', 1)[1].lower() in allowed_extensions]

        if not valid_files:
            flash("No valid files selected for upload.", "danger")
            return redirect(url_for('dashboard.employee_dashboard'))

        # -----------------------
        # Determine folder & visibility
        # -----------------------
        folder_name = request.form.get("folder_name")
        visibility_type = (request.form.get("visibility_type") or "private").lower()
        allowed_users = request.form.get("allowed_users")
        allowed_roles = request.form.get("allowed_roles")
        allowed_departments = request.form.get("allowed_departments")

        # Restrict employee uploads to certain roles if needed
        if current_user.role == 'employee':
            visibility_type = 'roles'
            allowed_roles = 'it_manager,general_director'

        # -----------------------
        # Save documents
        # -----------------------
        _save_documents(
            current_user,
            valid_files,
            folder_name=folder_name,
            visibility_type=visibility_type,
            allowed_users=allowed_users,
            allowed_roles=allowed_roles,
            allowed_departments=allowed_departments
        )

        db.session.commit()
        flash("Document(s) uploaded successfully!", "success")

    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error uploading documents: {str(e)}")
        flash(f"Failed to upload documents: {str(e)}", "danger")

    return redirect(url_for('dashboard.employee_dashboard'))






@dashboard_bp.route('/employee-summary')
@login_required
@role_required(['it_manager', 'general_director'])
def employee_summary():
    # Fetch all employees, ordered by creation date
    employees = Employee.query.order_by(Employee.created_at.desc()).all()
    
    # Prepare any extra data for the template if needed
    # (e.g., department name)
    employee_list = []
    for emp in employees:
        employee_list.append({
            'id': emp.id,
            'full_name': emp.full_name,
            'job_title': emp.job_title,
            'phone': emp.phone,
            'department': emp.department.name if emp.department else None,
            'created_at': emp.created_at
        })

    return render_template(
        'dashboard/employees/list.html',
        employees=employee_list
    )


@dashboard_bp.route('/recent-activities')
@login_required
@permission_required(Permission.VIEW)
def recent_activities():
    activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return render_template('dashboard/partials/recent_activities.html', activities=activities)

@dashboard_bp.route('/users')
@login_required
@role_required(['it_manager', 'general_director'])
def user_management():
    # Get all users
    users = User.query.order_by(User.created_at.desc()).all()
    return render_template('dashboard/users.html', users=users)

@dashboard_bp.route('/users/create', methods=['GET', 'POST'])
@login_required
@role_required(['it_manager', 'general_director'])
def create_user():
    form = UserForm()
    
    if form.validate_on_submit():
        try:
            # Create the user object
            user = User(
                name=form.name.data,
                email=form.email.data.lower(),  # normalize email
                role=form.role.data,
                phone=form.phone.data,
                position=form.position.data
            )

            # Set password (hashed)
            user.set_password(form.password.data)

            # Add and commit
            db.session.add(user)
            db.session.commit()

            flash('User created successfully!', 'success')
            return redirect(url_for('dashboard.user_management'))

        except Exception as e:
            db.session.rollback()
            # Log error in console for debugging
            current_app.logger.error(f"Error creating user: {str(e)}")
            # Show a friendly message to the user
            flash('An error occurred while creating the user. Please check your input and try again.', 'danger')
            # Fall through to render template with form populated

    # If GET request or validation failed, render the form again
    return render_template('dashboard/create_user.html', form=form)
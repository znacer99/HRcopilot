from flask import Blueprint, render_template, redirect, url_for, request, flash, abort, current_app, send_file, jsonify
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload
from sqlalchemy import or_, func
from core.decorators import permission_required, role_required
from core.models import User, Department, ActivityLog, db, UserDocument, Folder, Employee
from core.permissions import Permission
from core.forms import UserForm
from .services import get_director_dashboard_data, get_manager_dashboard_data
from modules.employee.services import (
    create_employee as create_employee_service,
    update_employee as update_employee_service,
    delete_employee as delete_employee_service
)
from core.logger import audit_log
from datetime import datetime, timedelta
from modules.leave.services import LeaveRequest
import os

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
        try:
            dept_id = int(dept_filter)
            query = query.filter(User.department_id == dept_id)
        except ValueError:
            pass

    total = query.count()
    users = query.order_by(User.created_at.desc()).limit(per_page).offset((page - 1) * per_page).all()
    departments = Department.query.order_by(Department.name).all()

    # Dashboard stats
    user_counts = db.session.query(User.role, func.count(User.id)).group_by(User.role).all()
    week_ago = datetime.utcnow() - timedelta(days=7)
    new_users_count = User.query.filter(User.created_at >= week_ago).count()
    month_ago = datetime.utcnow() - timedelta(days=30)
    inactive_users_count = User.query.filter(
        or_(User.last_login == None, User.last_login < month_ago)
    ).count()
    recent_activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()

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
        dept_filter=dept_filter,
        user_counts=user_counts,
        new_users_count=new_users_count,
        inactive_users_count=inactive_users_count,
        recent_activities=recent_activities,
        view_functions=current_app.view_functions
    )

@dashboard_bp.route('/general_director')
@login_required
@role_required(['general_director'])
def director_dashboard():
    q = (request.args.get('q') or '').strip()
    role_filter = (request.args.get('role') or '').strip()
    dept_filter = (request.args.get('department') or '').strip()
    page = max(int(request.args.get('page', 1)), 1)
    per_page = 10

    query = User.query
    if q:
        query = query.filter(or_(User.name.ilike(f"%{q}%"), User.email.ilike(f"%{q}%")))
    if role_filter:
        query = query.filter(User.role == role_filter)
    if dept_filter:
        try:
            dept_id = int(dept_filter)
            query = query.filter(User.department_id == dept_id)
        except ValueError:
            pass

    total = query.count()
    employees = query.order_by(User.created_at.desc()).limit(per_page).offset((page-1)*per_page).all()
    departments = Department.query.order_by(Department.name).all()
    active_count = User.query.filter_by(is_active=True).count()
    inactive_count = total - active_count
    user_counts = {"active": active_count, "inactive": inactive_count}

    recent_activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()

    return render_template(
        'dashboard/general_director.html',
        user=current_user,
        user_list=employees,
        total=total,
        page=page,
        per_page=per_page,
        departments=departments,
        q=q,
        role_filter=role_filter,
        dept_filter=dept_filter,
        user_counts=user_counts,
        new_users_count=User.query.filter(User.created_at >= (datetime.utcnow()-timedelta(days=7))).count(),
        inactive_users_count=inactive_count,
        recent_activities=recent_activities
    )

@dashboard_bp.route('/employee/create', methods=['GET', 'POST'])
@login_required
@role_required(['it_manager', 'general_director'])
def employee_create():
    departments = Department.query.order_by(Department.name).all()
    if request.method == 'POST':
        form_data = request.form.to_dict()
        try:
            employee = create_employee_service(form_data)  # use service
            audit_log(f'Created employee: {employee.email}', user_id=current_user.id, action='create')
            flash('Employee created successfully', 'success')
            return redirect(url_for('dashboard.role_dashboard'))
        except Exception as e:
            flash(f'Error creating employee: {str(e)}', 'danger')
            return redirect(url_for('dashboard.employee_create'))
    return render_template('dashboard/employee_form.html', departments=departments)


@dashboard_bp.route('/employee/<int:id>/edit', methods=['GET', 'POST'])
@login_required
@role_required(['it_manager', 'general_director'])
def employee_edit(id):
    employee = User.query.get_or_404(id)
    departments = Department.query.order_by(Department.name).all()
    if request.method == 'POST':
        form_data = request.form.to_dict()
        try:
            employee = update_employee_service(id, form_data)
            audit_log(f'Updated employee: {employee.email}', user_id=current_user.id, action='update')
            flash('Employee updated successfully', 'success')
            return redirect(url_for('dashboard.role_dashboard'))
        except Exception as e:
            flash(f'Error updating employee: {str(e)}', 'danger')
            return redirect(url_for('dashboard.employee_edit', id=id))
    return render_template('dashboard/employee_form.html', employee=employee, departments=departments)

@dashboard_bp.route('/employee/<int:id>/delete', methods=['POST'])
@login_required
@role_required(['it_manager', 'general_director'])
def employee_delete(id):
    try:
        employee = delete_employee_service(id)
        audit_log(f'Deleted employee: {employee.email}', user_id=current_user.id, action='delete')
        flash('Employee deleted successfully', 'success')
    except Exception as e:
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
    # User's own documents
    from core.models import UserDocument
    documents = UserDocument.query.filter_by(user_id=current_user.id)\
        .order_by(UserDocument.uploaded_at.desc()).all()

    # Shared documents (accessible but not uploaded by user)
    shared_documents = [
        doc for doc in UserDocument.query.all()
        if doc.can_user_access(current_user) and doc.user_id != current_user.id
    ]

    # Recent activities
    recent_activities = ActivityLog.query.filter_by(user_id=current_user.id)\
        .order_by(ActivityLog.timestamp.desc()).limit(10).all()

    # Optional: user's recent leave requests
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
    folder_id = request.form.get('folder_id')
    files = request.files.getlist('document')
    visibility_type = request.form.get('visibility_type', 'private')

    if not files or all(f.filename == '' for f in files):
        flash("No files selected for upload.", "danger")
        return redirect(url_for('dashboard.employee_dashboard'))

    for file in files:
        if file.filename == '':
            continue  # skip empty file inputs

        try:
            # Create folder if it doesn't exist
            os.makedirs("uploads/personal", exist_ok=True)

            # Safe filename
            safe_filename = f"{current_user.id}_{file.filename.replace(' ', '_')}"
            filepath = os.path.join("uploads/personal", safe_filename)
            file.save(filepath)

            # Insert document record
            new_doc = UserDocument(
                user_id=current_user.id,          # REQUIRED
                filename=file.filename,
                filepath=filepath,
                folder_id=int(folder_id) if folder_id else None,
                visibility_type=visibility_type,
                uploaded_at=datetime.utcnow()     # make sure the column exists
            )
            db.session.add(new_doc)

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Error uploading {file.filename}: {str(e)}")
            flash(f"Error uploading {file.filename}: {str(e)}", "danger")

    try:
        db.session.commit()
        flash("Document(s) uploaded successfully!", "success")
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"DB commit failed: {str(e)}")
        flash("Failed to save documents. Please try again.", "danger")

    return redirect(url_for('dashboard.employee_dashboard'))




@dashboard_bp.route('/employee-summary')
@login_required
@role_required(['it_manager', 'general_director'])
def employee_summary():
    employees = User.query.order_by(User.created_at.desc()).all()
    return render_template('dashboard/partials/employee_summary.html', employees=employees)


# -------------------- DEPARTMENT SUMMARY FOR DASHBOARD --------------------
@dashboard_bp.route('/department-summary')
@login_required
@permission_required(Permission.VIEW)
def department_summary():
    # Preload employees + their users to avoid N+1 queries
    departments = Department.query.options(
        joinedload(Department.employees).joinedload(Employee.user)
    ).order_by(Department.name).all()

    summary = []
    for dept in departments:
        summary.append({
            'id': dept.id,
            'name': dept.name,
            'description': dept.description,
            'members': dept.members,  # comes from your @property
            'member_count': len(dept.members)
        })

    return render_template(
        'dashboard/departments/list.html',  # ✅ use the partial
        departments=summary
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

            # Set the department separately
            user.department_id = form.department.data

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
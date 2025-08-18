from flask import Blueprint, request, redirect, url_for, flash
from flask_login import login_required, current_user
from core.decorators import permission_required
from core.permissions import Permission
from .services import create_employee, update_employee

employee_bp = Blueprint('employee', __name__)

@employee_bp.route('/create', methods=['POST'])
@login_required
@permission_required(Permission.ADMIN)
def create():
    try:
        # Step 1. Create the Employee record
        employee = create_employee(request.form)

        # Step 2. Create corresponding User account
        from core.models import User, db
        from werkzeug.security import generate_password_hash

        email = request.form.get("email")
        raw_password = request.form.get("password") or "changeme123"
        role = request.form.get("role", "employee")

        user = User(
            username=email,
            email=email,
            password_hash=generate_password_hash(raw_password),
            role=role,
            employee_id=employee.id
        )
        db.session.add(user)
        db.session.commit()

        flash(f'Employee created successfully. Login with {email}', 'success')
        return redirect(url_for('dashboard.employee_management'))

    except Exception as e:
        flash(f'Error: {str(e)}', 'danger')
        return redirect(url_for('dashboard.employee_form'))


@employee_bp.route('/<int:id>/update', methods=['POST'])
@login_required
@permission_required(Permission.EDIT)
def update(id):
    try:
        update_employee(id, request.form)
        flash('Employee updated successfully', 'success')
        return redirect(url_for('dashboard.employee_profile', id=id))
    except Exception as e:
        flash(f'Error: {str(e)}', 'danger')
        return redirect(url_for('dashboard.edit_employee', id=id))
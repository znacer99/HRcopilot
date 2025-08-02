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
        employee = create_employee(request.form)
        flash('Employee created successfully', 'success')
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
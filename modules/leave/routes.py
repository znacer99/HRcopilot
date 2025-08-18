# modules/leave/routes.py
from flask import render_template, request, redirect, url_for, flash
from flask_login import login_required, current_user
from . import leave_bp
from .services import (
    create_leave_request,
    list_user_requests,
    list_pending_requests,
    set_leave_status,
)
from core.decorators import role_required
from core.forms import LeaveForm
from core.models import User


# --- CREATE REQUEST ---
@leave_bp.route('/requests/new', methods=['GET', 'POST'])
@login_required
def new_request():
    form = LeaveForm()
    
    # Approver choices depend on user's role
    if current_user.role in ['it_manager', 'general_director']:
        # Directors/managers can choose other managers/directors
        approvers = User.query.filter(User.id != current_user.id).all()
    else:
        # Employees: only their manager or head of department
        approvers = User.query.filter(
            User.department_id == current_user.department_id,
            User.role.in_(['manager', 'head_of_department', 'it_manager', 'general_director'])
        ).all()

    form.approver_id.choices = [(u.id, f"{u.name} ({u.role.replace('_', ' ').title()})") for u in approvers]
    
    if form.validate_on_submit():
        payload = {
            'type': form.type.data,
            'start_date': form.start_date.data.strftime("%Y-%m-%d"),
            'end_date': form.end_date.data.strftime("%Y-%m-%d"),
            'reason': form.reason.data,
            'approver_id': form.approver_id.data,
        }
        create_leave_request(current_user.id, payload)
        flash("Leave request submitted successfully!", "success")
        return redirect(url_for('leave.my_requests'))

    return render_template('leave/leave_form.html', form=form)


# --- MY REQUESTS ---
@leave_bp.route('/my-requests')
@login_required
def my_requests():
    """Show logged-in user's leave requests"""
    items = list_user_requests(current_user.id)
    return render_template('leave/my_leaves.html', requests=items)


# --- PENDING REQUESTS (for managers/directors) ---
@leave_bp.route('/pending-requests')
@login_required
@role_required(['manager', 'head_of_department', 'it_manager', 'general_director'])
def pending_requests():
    """Show pending leave requests assigned to current approver"""
    # list_pending_requests now accepts current_user and filters by approver_id
    items = list_pending_requests(current_user)
    return render_template('leave/pending_leaves.html', requests=items)


# --- APPROVE / REJECT REQUEST ---
@leave_bp.route('/<int:lr_id>/<action>', methods=['POST'])
@login_required
@role_required(['manager', 'head_of_department', 'it_manager', 'general_director'])
def set_status(lr_id, action):
    """Approve or reject a leave request assigned to current approver"""
    if action not in ["approve", "reject"]:
        flash("Invalid action", "danger")
        return redirect(url_for('leave.pending_requests'))

    # Map action to service status
    status_map = {"approve": "approved", "reject": "rejected"}
    status = status_map[action]

    lr = set_leave_status(lr_id, current_user.id, status)
    flash(f"Leave request #{lr.id} {status}", "success")
    return redirect(url_for('leave.pending_requests'))

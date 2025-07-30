# modules/dashboard/routes.py
from flask import Blueprint, render_template, redirect, url_for
from flask_login import login_required, current_user
from sqlalchemy.orm import joinedload  # Import for eager loading
from .services import get_director_dashboard_data
from core.models import User, Department, ActivityLog  # Import all required models
from core.extensions import db

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@login_required
def index():
    if current_user.role == "General Director":
        dashboard_data = get_director_dashboard_data()
        return render_template('dashboard/general_director.html',
                               user=current_user,
                               **dashboard_data)
    # Add other role dashboards here
    return render_template('dashboard/base_dashboard.html', user=current_user)

@dashboard_bp.route('/employee-summary')
@login_required
def employee_summary():
    if current_user.role != "General Director":
        return redirect(url_for('dashboard.index'))
    
    employees = User.query.order_by(User.created_at.desc()).limit(10).all()
    return render_template('dashboard/partials/employee_summary.html', 
                          employees=employees)

@dashboard_bp.route('/department-summary')
@login_required
def department_summary():
    if current_user.role != "General Director":
        return redirect(url_for('dashboard.index'))
    
    # Fixed eager loading syntax
    departments = Department.query.options(joinedload(Department.members)).all()
    return render_template('dashboard/partials/department_summary.html',
                          departments=departments)

@dashboard_bp.route('/recent-activities')
@login_required
def recent_activities():
    if current_user.role != "General Director":
        return redirect(url_for('dashboard.index'))
    
    activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    return render_template('dashboard/partials/recent_activities.html', 
                          activities=activities)
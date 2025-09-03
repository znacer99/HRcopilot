# modules/department/routes.py
from flask import Blueprint, render_template, request, redirect, url_for, flash
from core.extensions import db
from core.models import Department, Employee, Candidate
from flask_login import login_required
from modules.department.forms import DepartmentForm

department_bp = Blueprint('department', __name__, url_prefix='/department')


# -------------------- LIST DEPARTMENTS --------------------
@department_bp.route('/')
@login_required
def list_departments():
    departments = Department.query.order_by(Department.name).all()
    summary = []
    for dept in departments:
        summary.append({
            'id': dept.id,
            'name': dept.name,
            'description': dept.description,
            'members': [{'id': u.id, 'name': u.full_name, 'role': u.job_title} for u in dept.employees]
        })
    return render_template('dashboard/departments/list.html', departments=summary)



# -------------------- CREATE DEPARTMENT --------------------
@department_bp.route('/create', methods=['GET', 'POST'])
@login_required
def create_department():
    form = DepartmentForm()

    if form.validate_on_submit():
        name = form.name.data.strip()
        description = form.description.data.strip() if form.description.data else None

        if Department.query.filter_by(name=name).first():
            flash('Department with this name already exists', 'danger')
            return redirect(url_for('department.create_department'))

        dept = Department(name=name, description=description)
        db.session.add(dept)
        db.session.commit()
        flash('Department created successfully', 'success')
        return redirect(url_for('department.list_departments'))

    return render_template('dashboard/departments/form.html', form=form, department=None)


# -------------------- EDIT DEPARTMENT --------------------
@department_bp.route('/<int:dept_id>/edit', methods=['GET', 'POST'])
@login_required
def edit_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    form = DepartmentForm(obj=dept)

    if form.validate_on_submit():
        dept.name = form.name.data.strip()
        dept.description = form.description.data.strip() if form.description.data else None
        db.session.commit()
        flash('Department updated successfully', 'success')
        return redirect(url_for('department.list_departments'))

    return render_template('dashboard/departments/form.html', form=form, department=dept)



# -------------------- DELETE DEPARTMENT --------------------
@department_bp.route('/<int:dept_id>/delete', methods=['POST'])
@login_required
def delete_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    db.session.delete(dept)
    db.session.commit()
    flash('Department deleted successfully', 'success')
    return redirect(url_for('department.list_departments'))


# -------------------- VIEW DEPARTMENT TEAM --------------------
@department_bp.route('/<int:dept_id>/view')
@login_required
def view_department(dept_id):
    dept = Department.query.get_or_404(dept_id)
    employees = dept.employees  # list of Employee objects
    candidates = dept.candidates  # list of Candidate objects

    return render_template(
        'dashboard/departments/team.html',
        department=dept,
        employees=employees,
        candidates=candidates
    )


# -------------------- DEPARTMENT SUMMARY FOR DASHBOARD --------------------
@department_bp.route('/summary')
@login_required
def department_summary():
    departments = Department.query.order_by(Department.name).all()

    summary = []
    for dept in departments:
        members = [{'id': e.id, 'name': e.full_name, 'role': e.job_title} for e in dept.employees]
        summary.append({
            'id': dept.id,
            'name': dept.name,
            'description': dept.description,
            'members': members
        })

    return render_template('dashboard/partials/department_summary.html', departments=summary)

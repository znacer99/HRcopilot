from flask import Blueprint, request, redirect, url_for, flash, current_app, send_file
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from core.decorators import permission_required
from core.permissions import Permission
from .services import create_employee, update_employee, delete_employee, _save_documents
from core.models import EmployeeDocument
from core.extensions import db
import os

employee_bp = Blueprint('employee', __name__)

# Allowed file types
ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'jpg', 'png'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# -----------------------
# Create Employee
# -----------------------
@employee_bp.route('/create', methods=['POST'])
@login_required
@permission_required(Permission.ADMIN)
def create():
    try:
        employee = create_employee(request.form)
        flash(f'✅ Employee {employee.name} created successfully.', 'success')
        return redirect(url_for('dashboard.employee_management'))
    except Exception as e:
        flash(f'❌ Error creating employee: {str(e)}', 'danger')
        return redirect(url_for('dashboard.employee_form'))


# -----------------------
# Update Employee
# -----------------------
@employee_bp.route('/<int:employee_id>/update', methods=['POST'])
@login_required
@permission_required(Permission.EDIT)
def update(employee_id):
    try:
        employee = update_employee(employee_id, request.form)
        flash(f'✅ Employee {employee.name} updated successfully.', 'success')
        return redirect(url_for('dashboard.employee_profile', id=employee.id))
    except Exception as e:
        flash(f'❌ Error updating employee: {str(e)}', 'danger')
        return redirect(url_for('dashboard.edit_employee', id=employee_id))


# -----------------------
# Delete Employee
# -----------------------
@employee_bp.route('/<int:employee_id>/delete', methods=['POST'])
@login_required
@permission_required(Permission.ADMIN)
def delete(employee_id):
    try:
        employee = delete_employee(employee_id)
        flash(f'🗑️ Employee {employee.name} deleted successfully.', 'success')
        return redirect(url_for('dashboard.employee_management'))
    except Exception as e:
        flash(f'❌ Error deleting employee: {str(e)}', 'danger')
        return redirect(url_for('dashboard.employee_profile', id=employee_id))


# -----------------------
# Upload Document
# -----------------------
@employee_bp.route('/upload-document', methods=['POST'])
@login_required
def upload_document():
    if 'document' not in request.files:
        flash('No file part', 'error')
        return redirect(url_for('dashboard.employee_dashboard'))

    file = request.files['document']
    if file.filename == '':
        flash('No selected file', 'error')
        return redirect(url_for('dashboard.employee_dashboard'))

    if file and allowed_file(file.filename):
        # Use service helper for saving
        _save_documents(current_user, [file])
        try:
            db.session.commit()
            flash('✅ Document uploaded successfully!', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'❌ Error saving document: {str(e)}', 'danger')
        return redirect(url_for('dashboard.employee_dashboard'))

    flash('❌ File type not allowed', 'error')
    return redirect(url_for('dashboard.employee_dashboard'))


# -----------------------
# Download Document
# -----------------------
@employee_bp.route('/document/<int:doc_id>')
@login_required
def download_document(doc_id):
    doc = EmployeeDocument.query.get_or_404(doc_id)
    if doc.user_id != current_user.id:
        flash("❌ You are not allowed to access this document.", "danger")
        return redirect(url_for('dashboard.employee_dashboard'))

    # Resolve full path dynamically
    full_path = os.path.join(current_app.root_path, doc.filepath)
    if not os.path.exists(full_path):
        flash("❌ File not found.", "danger")
        return redirect(url_for('dashboard.employee_dashboard'))

    return send_file(full_path, as_attachment=True)


# -----------------------
# Delete Document
# -----------------------
@employee_bp.route('/document/<int:doc_id>/delete', methods=['POST'])
@login_required
def delete_document(doc_id):
    doc = EmployeeDocument.query.get_or_404(doc_id)
    if doc.user_id != current_user.id:
        flash("❌ You cannot delete this document.", "danger")
        return redirect(url_for('dashboard.employee_dashboard'))

    # Delete file from disk
    full_path = os.path.join(current_app.root_path, doc.filepath)
    if os.path.exists(full_path):
        os.remove(full_path)

    # Delete record from DB
    db.session.delete(doc)
    try:
        db.session.commit()
        flash(f'🗑️ Document "{doc.filename}" deleted successfully.', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'❌ Error deleting document: {str(e)}', 'danger')

    return redirect(url_for('dashboard.employee_dashboard'))

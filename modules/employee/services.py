import os
import secrets
from datetime import datetime
from flask import current_app, request
from werkzeug.utils import secure_filename

from core.extensions import db
from core.models import User, UserDocument, Employee

# ------------------------
# Helpers
# ------------------------
def _generate_avatar(name: str) -> str:
    if not name:
        return "??"
    parts = name.strip().split()
    if len(parts) == 1:
        return (parts[0][0] + (parts[0][1] if len(parts[0]) > 1 else '')).upper()
    return (parts[0][0] + parts[-1][0]).upper()

def _generate_access_code():
    return secrets.token_hex(3).upper()

def _ensure_folder_dir(owner_id: int, folder_name: str | None) -> str:
    """
    Makes sure the upload folder for the owner (+ optional subfolder) exists
    and returns the absolute base path.
    """
    base_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(owner_id))
    if folder_name:
        base_folder = os.path.join(base_folder, secure_filename(folder_name))
    os.makedirs(base_folder, exist_ok=True)
    return base_folder

# ------------------------
# Document Handling
# ------------------------
def _save_documents(
    owner,
    files,
    folder_name: str | None = None,
    visibility_type: str = "private",
    allowed_users: str | None = None,
    allowed_roles: str | None = None,
    allowed_departments: str | None = None,
):
    if not files:
        return

    if not isinstance(files, (list, tuple)):
        files = [files]

    owner_id = getattr(owner, "id", None)
    if owner_id is None:
        raise ValueError("Owner object must have an 'id' attribute.")

    base_folder = _ensure_folder_dir(owner_id, folder_name)

    for f in files:
        if not f or not getattr(f, "filename", None):
            continue
        filename = secure_filename(f.filename)
        filepath = os.path.join(base_folder, filename)
        f.save(filepath)

        rel_path = os.path.relpath(filepath, current_app.config['UPLOAD_FOLDER'])

        doc = UserDocument(
            owner_id=owner_id,
            filename=filename,
            filepath=rel_path,
            folder_id=None,
            visibility_type=(visibility_type or "private").lower(),
            allowed_users=(allowed_users or None),
            allowed_roles=(allowed_roles or None),
            allowed_departments=(allowed_departments or None),
            uploaded_at=datetime.utcnow(),
        )
        db.session.add(doc)

# ------------------------
# Folder Ops
# ------------------------
def create_folder_for_user(owner, folder_name: str):
    folder_name = (folder_name or "").strip()
    if not folder_name:
        raise ValueError("Folder name is required.")
    _ensure_folder_dir(owner.id, folder_name)
    return folder_name

def update_document_visibility(doc_id: int, form_data, acting_user):
    doc = UserDocument.query.get_or_404(doc_id)
    if doc.owner_id != acting_user.id:
        raise PermissionError("Not allowed to change visibility for this document.")

    vtype = (form_data.get("visibility_type") or "private").lower()
    doc.visibility_type = vtype
    doc.allowed_users = form_data.get("allowed_users") or None
    doc.allowed_roles = form_data.get("allowed_roles") or None
    doc.allowed_departments = form_data.get("allowed_departments") or None

    db.session.add(doc)
    db.session.commit()
    return doc

# ------------------------
# Employee CRUD
# ------------------------
def create_employee(form_data, files=None):
    name = form_data.get("name") or "Unnamed"
    position = form_data.get("position")
    phone = form_data.get("phone")
    department_id = form_data.get("department") or form_data.get("department_id")
    if department_id:
        try:
            department_id = int(department_id)
        except:
            department_id = None

    employee = Employee(
        full_name=name,
        job_title=position,
        phone=phone,
        department_id=department_id
    )
    db.session.add(employee)
    db.session.commit()

    # Documents
    folder_name = form_data.get("folder_name")
    visibility_type = (form_data.get("visibility_type") or "private").lower()
    allowed_users = form_data.get("allowed_users")
    allowed_roles = form_data.get("allowed_roles")
    allowed_departments = form_data.get("allowed_departments")

    if files:
        _save_documents(
            owner=employee,
            files=files,
            folder_name=folder_name,
            visibility_type=visibility_type,
            allowed_users=allowed_users,
            allowed_roles=allowed_roles,
            allowed_departments=allowed_departments
        )

    db.session.commit()
    return employee

def update_employee(employee_id, form_data):
    employee = Employee.query.get_or_404(employee_id)

    for field in ["full_name", "job_title", "phone", "address", "nationality", "id_number"]:
        if form_data.get(field):
            setattr(employee, field, form_data.get(field))

    if form_data.get("department"):
        try:
            employee.department_id = int(form_data.get("department"))
        except Exception:
            pass

    # Document uploads
    files = request.files.getlist("documents") or []
    single = request.files.get("document")
    if single and getattr(single, "filename", ""):
        files.append(single)

    folder_name = request.form.get("folder_name")
    visibility_type = (request.form.get("visibility_type") or "private").lower()
    allowed_users = request.form.get("allowed_users")
    allowed_roles = request.form.get("allowed_roles")
    allowed_departments = request.form.get("allowed_departments")

    if files:
        _save_documents(
            employee,
            files,
            folder_name=folder_name,
            visibility_type=visibility_type,
            allowed_users=allowed_users,
            allowed_roles=allowed_roles,
            allowed_departments=allowed_departments,
        )

    db.session.add(employee)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

    return employee

def delete_employee(employee_id):
    employee = Employee.query.get_or_404(employee_id)

    # Delete all documents
    docs = UserDocument.query.filter_by(owner_id=employee.id).all()
    for doc in docs:
        try:
            abs_path = os.path.join(current_app.config['UPLOAD_FOLDER'], doc.filepath)
            if os.path.exists(abs_path):
                os.remove(abs_path)
        except Exception:
            pass
        db.session.delete(doc)

    db.session.delete(employee)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

    return employee

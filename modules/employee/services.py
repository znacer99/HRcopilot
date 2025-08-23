import os
import secrets
from datetime import datetime
from flask import current_app, request
from werkzeug.utils import secure_filename

from core.extensions import db
from core.models import User, UserDocument

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


def _ensure_folder_dir(user_id: int, folder_name: str | None) -> str:
    """
    Makes sure the upload folder for the user (+ optional subfolder) exists
    and returns the absolute base path.
    """
    base_folder = os.path.join(current_app.config['UPLOAD_FOLDER'], str(user_id))
    if folder_name:
        base_folder = os.path.join(base_folder, secure_filename(folder_name))
    os.makedirs(base_folder, exist_ok=True)
    return base_folder


def _save_documents(
    user,
    files,
    folder_name: str | None = None,
    visibility_type: str = "private",
    allowed_users: str | None = None,
    allowed_roles: str | None = None,
    allowed_departments: str | None = None,
):
    """
    Save uploaded files and create UserDocument entries.
    Folder structure: UPLOAD_FOLDER/<user.id>/<folder_name>/<filename>
    """
    if not files:
        return

    if not isinstance(files, (list, tuple)):
        files = [files]

    base_folder = _ensure_folder_dir(user.id, folder_name)

    for f in files:
        if not f or not getattr(f, "filename", None):
            continue
        filename = secure_filename(f.filename)
        filepath = os.path.join(base_folder, filename)
        f.save(filepath)

        # store relative to UPLOAD_FOLDER
        rel_path = os.path.relpath(filepath, current_app.config['UPLOAD_FOLDER'])

        doc = UserDocument(
            uploaded_by=user.id,
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
        db.session.commit()


# ------------------------
# Folder Ops (filesystem only)
# ------------------------
def create_folder_for_user(user, folder_name: str):
    folder_name = (folder_name or "").strip()
    if not folder_name:
        raise ValueError("Folder name is required.")
    _ensure_folder_dir(user.id, folder_name)
    # No DB row for folders; folders are “virtual” (based on names in docs)
    return folder_name


def update_document_visibility(doc_id: int, form_data, acting_user):
    doc = UserDocument.query.get_or_404(doc_id)
    # Only the owner can change visibility; privileged roles could be added later
    if doc.user_id != acting_user.id:
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
def create_employee(form_data):
    email = form_data.get("email")
    name = form_data.get("name") or "Unnamed"
    role = (form_data.get("role") or "employee").lower()
    password = form_data.get("password") or secrets.token_urlsafe(10)
    department_id = form_data.get("department") or form_data.get("department_id")
    access_code = form_data.get("access_code") or _generate_access_code()
    avatar = form_data.get("avatar") or _generate_avatar(name)
    position = form_data.get("position")
    phone = form_data.get("phone")

    if department_id:
        try:
            department_id = int(department_id)
        except Exception:
            department_id = None

    user = User(
        email=email,
        name=name,
        role=role,
        access_code=access_code,
        avatar=avatar,
        department_id=department_id,
        position=position,
        phone=phone,
        is_active=True,
    )
    user.set_password(password)
    db.session.add(user)
    try:
        db.session.commit()  # commit so user.id exists

        # handle uploads: 'documents' (list) or 'document' (single)
        files = request.files.getlist("documents") or []
        single = request.files.get("document")
        if single and getattr(single, "filename", ""):
            files.append(single)

        # Optional folder + visibility (on create page)
        folder_name = request.form.get("folder_name")
        visibility_type = (request.form.get("visibility_type") or "private").lower()
        allowed_users = request.form.get("allowed_users")
        allowed_roles = request.form.get("allowed_roles")
        allowed_departments = request.form.get("allowed_departments")

        _save_documents(
            user,
            files,
            folder_name=folder_name,
            visibility_type=visibility_type,
            allowed_users=allowed_users,
            allowed_roles=allowed_roles,
            allowed_departments=allowed_departments,
        )
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

    return user


def update_employee(employee_id, form_data):
    user = User.query.get_or_404(employee_id)

    for field in ["email", "name", "access_code", "avatar", "position", "phone"]:
        if form_data.get(field):
            setattr(user, field, form_data.get(field))
    if form_data.get("role"):
        user.role = form_data.get("role").lower()
    if form_data.get("department"):
        try:
            user.department_id = int(form_data.get("department"))
        except Exception:
            pass
    if form_data.get("password"):
        user.set_password(form_data.get("password"))

    # Handle document uploads
    files = request.files.getlist("documents") or []
    single = request.files.get("document")
    if single and getattr(single, "filename", ""):
        files.append(single)

    folder_name = request.form.get("folder_name")
    visibility_type = (request.form.get("visibility_type") or "private").lower()
    allowed_users = request.form.get("allowed_users")
    allowed_roles = request.form.get("allowed_roles")
    allowed_departments = request.form.get("allowed_departments")

    _save_documents(
        user,
        files,
        folder_name=folder_name,
        visibility_type=visibility_type,
        allowed_users=allowed_users,
        allowed_roles=allowed_roles,
        allowed_departments=allowed_departments,
    )

    db.session.add(user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

    return user


def delete_employee(employee_id):
    user = User.query.get_or_404(employee_id)

    # Delete all documents
    docs = UserDocument.query.filter_by(user_id=user.id).all()
    for doc in docs:
        try:
            abs_path = os.path.join(current_app.config['UPLOAD_FOLDER'], doc.filepath)
            if os.path.exists(abs_path):
                os.remove(abs_path)
        except Exception:
            pass
        db.session.delete(doc)

    db.session.delete(user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

    return user

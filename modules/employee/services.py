# modules/employee/services.py

import os
import secrets
from datetime import datetime
from flask import current_app, request
from werkzeug.utils import secure_filename

from core.extensions import db
from core.models import User, EmployeeDocument


# ------------------------
# Helpers
# ------------------------
def _generate_avatar(name: str) -> str:
    """Return 2-letter avatar (initials) or '??'"""
    if not name:
        return "??"
    parts = name.strip().split()
    if len(parts) == 1:
        return (parts[0][0] + (parts[0][1] if len(parts[0]) > 1 else '')).upper()
    return (parts[0][0] + parts[-1][0]).upper()


def _generate_access_code():
    return secrets.token_hex(3).upper()  # 6 hex chars


def _save_documents(user, files):
    """Save uploaded documents for employee"""
    if not files:
        return

    # Normalize to list if a single FileStorage object
    if not isinstance(files, (list, tuple)):
        files = [files]

    upload_folder = os.path.join(
        current_app.root_path, "uploads", "employee_docs", str(user.id)
    )
    os.makedirs(upload_folder, exist_ok=True)

    for f in files:
        if f and f.filename:
            filename = secure_filename(f.filename)
            filepath = os.path.join(upload_folder, filename)
            f.save(filepath)

            doc = EmployeeDocument(
                user_id=user.id,
                filename=filename,
                filepath=os.path.relpath(filepath, current_app.root_path),
                uploaded_at=datetime.utcnow(),
            )
            db.session.add(doc)


# ------------------------
# Employee CRUD
# ------------------------
def create_employee(form_data):
    """
    Create new employee from form_data (request.form).
    Also supports file uploads via request.files['documents'].
    """
    email = form_data.get("email")
    name = form_data.get("name") or "Unnamed"
    role = (form_data.get("role") or "employee").lower()
    password = form_data.get("password") or secrets.token_urlsafe(10)
    department_id = form_data.get("department") or form_data.get("department_id")
    access_code = form_data.get("access_code") or _generate_access_code()
    avatar = form_data.get("avatar") or _generate_avatar(name)
    position = form_data.get("position")
    phone = form_data.get("phone")

    # Normalize department_id
    if department_id:
        try:
            department_id = int(department_id)
        except Exception:
            department_id = None

    # Create user
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
        db.session.commit()  # commit first so user.id exists

        # Handle document uploads
        files = request.files.getlist("documents")
        _save_documents(user, files)
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

    return user


def update_employee(employee_id, form_data):
    """
    Update existing employee.
    """
    user = User.query.get_or_404(employee_id)

    if form_data.get("email"):
        user.email = form_data.get("email")
    if form_data.get("name"):
        user.name = form_data.get("name")
    if form_data.get("role"):
        user.role = form_data.get("role").lower()
    if form_data.get("department"):
        try:
            user.department_id = int(form_data.get("department"))
        except Exception:
            pass
    if form_data.get("access_code"):
        user.access_code = form_data.get("access_code")
    if form_data.get("avatar"):
        user.avatar = form_data.get("avatar")
    if form_data.get("password"):
        user.set_password(form_data.get("password"))
    if form_data.get("position"):
        user.position = form_data.get("position")
    if form_data.get("phone"):
        user.phone = form_data.get("phone")

    # Save new uploaded docs (don’t remove old ones)
    files = request.files.getlist("documents")
    _save_documents(user, files)

    db.session.add(user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise e

    return user


def delete_employee(employee_id):
    """
    Delete an employee and all their documents.
    """
    user = User.query.get_or_404(employee_id)

    # Delete docs on disk + db
    docs = EmployeeDocument.query.filter_by(user_id=user.id).all()
    for doc in docs:
        try:
            abs_path = os.path.join(current_app.root_path, doc.filepath)
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

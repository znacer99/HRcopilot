# modules/employee/services.py
from core.extensions import db
from core.models import User
from datetime import datetime
import secrets

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


def create_employee(form_data):
    """
    form_data: dict-like from request.form
    required: email, name, password (recommended), role
    """
    email = form_data.get('email')
    name = form_data.get('name') or 'Unnamed'
    role = (form_data.get('role') or 'employee').lower()
    password = form_data.get('password') or None
    department_id = form_data.get('department') or form_data.get('department_id') or None
    access_code = form_data.get('access_code') or _generate_access_code()
    avatar = form_data.get('avatar') or _generate_avatar(name)

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
        is_active=True
    )

    if password:
        user.set_password(password)
    else:
        # set a random temporary password if none provided
        user.set_password(secrets.token_urlsafe(10))

    db.session.add(user)
    try:
        db.session.commit()
    except Exception as e:
        db.session.rollback()
        raise

    return user


def update_employee(employee_id, form_data):
    user = User.query.get_or_404(employee_id)
    # Update fields if present
    if 'email' in form_data and form_data.get('email'):
        user.email = form_data.get('email')
    if 'name' in form_data and form_data.get('name'):
        user.name = form_data.get('name')
    if 'role' in form_data and form_data.get('role'):
        user.role = form_data.get('role').lower()
    if 'department' in form_data and form_data.get('department'):
        try:
            user.department_id = int(form_data.get('department'))
        except Exception:
            pass
    if 'access_code' in form_data and form_data.get('access_code'):
        user.access_code = form_data.get('access_code')
    if 'avatar' in form_data and form_data.get('avatar'):
        user.avatar = form_data.get('avatar')
    if 'password' in form_data and form_data.get('password'):
        user.set_password(form_data.get('password'))

    db.session.add(user)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return user


def delete_employee(employee_id):
    user = User.query.get_or_404(employee_id)
    db.session.delete(user)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return user

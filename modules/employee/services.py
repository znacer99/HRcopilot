from core import db
from core.models import User

def create_employee(form_data):
    employee = User(
        email=form_data['email'],
        name=form_data['name'],
        role=form_data['role'],
        department_id=form_data.get('department_id'),
        access_code=form_data.get('access_code')
    )
    employee.set_password(form_data['password'])
    db.session.add(employee)
    db.session.commit()
    return employee

def update_employee(employee_id, form_data):
    employee = User.query.get(employee_id)
    for field in ['name', 'email', 'role', 'department_id', 'access_code']:
        if field in form_data:
            setattr(employee, field, form_data[field])
    if 'password' in form_data:
        employee.set_password(form_data['password'])
    db.session.commit()
    return employee
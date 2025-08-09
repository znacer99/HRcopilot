# core/forms.py
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField
from wtforms.validators import DataRequired, Email, Length
from core.models import Department

class LoginForm(FlaskForm):
    email = StringField('Email', validators=[
        DataRequired("Please enter your email address"),
        Email("Please enter a valid email address")
    ])
    password = PasswordField('Password', validators=[
        DataRequired("Please enter your password"),
        Length(min=8, message="Password must be at least 8 characters")
    ])
    submit = SubmitField('Login')

class UserForm(FlaskForm):
    name = StringField('Full Name', validators=[DataRequired()])
    email = StringField('Email', validators=[DataRequired(), Email()])
    role = SelectField('Role', choices=[
        ('employee', 'Employee'),
        ('manager', 'Manager'),
        ('head_of_department', 'Department Head'),
        ('general_director', 'General Director'),
        ('it_manager', 'IT Manager')
    ], validators=[DataRequired()])
    department = SelectField('Department', coerce=int, validators=[DataRequired()])
    submit = SubmitField('Save User')
    
    # Add this to populate department choices
    def __init__(self, *args, **kwargs):
        super(UserForm, self).__init__(*args, **kwargs)
        self.department.choices = [(d.id, d.name) for d in Department.query.all()]
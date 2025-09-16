from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, SelectField, DateField, TextAreaField
from wtforms.validators import DataRequired, Email, Length, Optional
from core.models import Department
from flask_wtf.file import FileField, FileAllowed


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
    department = SelectField('Department', coerce=int, validators=[Optional()])
    position = StringField('Position / Job Title', validators=[Optional()])
    phone = StringField('Phone Number', validators=[Optional()])
    password = PasswordField('Password', validators=[
        Optional(),
        Length(min=8, message="Password must be at least 8 characters")
    ])
    documents = FileField(
        'Upload Documents', 
        validators=[FileAllowed(['pdf', 'doc', 'docx', 'jpg', 'png'], 'Documents only!')],
        render_kw={"multiple": True}
    )
    submit = SubmitField('Save User')
    
    def __init__(self, *args, **kwargs):
        super(UserForm, self).__init__(*args, **kwargs)
        self.department.choices = [(d.id, d.name) for d in Department.query.all()]


class LeaveForm(FlaskForm):
    type = SelectField('Leave Type', choices=[
        ('annual', 'Annual Leave'),
        ('sick', 'Sick Leave'),
        ('unpaid', 'Unpaid Leave'),
        ('other', 'Other')
    ], validators=[DataRequired()])
    
    start_date = DateField('Start Date', validators=[DataRequired()])
    end_date = DateField('End Date', validators=[DataRequired()])
    reason = TextAreaField('Reason', validators=[DataRequired()])
    approver_id = SelectField('Send To', coerce=int, validators=[DataRequired()])
    
    submit = SubmitField('Submit')


class LogoutForm(FlaskForm):
    pass

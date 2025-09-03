# app.py
# pyright: reportMissingImports=false
# pyright: reportMissingModuleSource=false

import logging
import os
from datetime import datetime
from flask import Flask, render_template, redirect, url_for
from flask_wtf.csrf import CSRFProtect
from flask_login import current_user, logout_user
from config import config
from core.extensions import db, login_manager, migrate

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)


def create_app():
    """Application factory function"""
    app = Flask(__name__)

    # Load configuration
    env = os.environ.get('FLASK_ENV', 'development')
    if env == 'production':
        app.config.from_object('config.ProductionConfig')
    else:
        app.config.from_object('config.DevelopmentConfig')

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'

    csrf = CSRFProtect()
    csrf.init_app(app)

    # Make sure SECRET_KEY is set
    app.config['SECRET_KEY'] = app.config.get('SECRET_KEY') or 'mqM_nXhDHOYlb0T8E9bT4c7XCLiDImpINnVHFmCLR-Q'

    # Inject logout_form
    from modules.auth.forms import LogoutForm

    @app.context_processor
    def inject_logout_form():
        return dict(logout_form=LogoutForm())

    # Register blueprints
    register_blueprints(app)

    # Initialize database and default data
    with app.app_context():
        db.create_all()
        initialize_database()

    return app


def register_blueprints(app):
    """Register all application blueprints"""
    from modules.auth.routes import auth_bp
    from modules.dashboard.routes import dashboard_bp
    from modules.leave.routes import leave_bp
    from modules.employee.routes import employee_bp
    from routes.document_routes import docs_bp
    from modules.department.routes import department_bp
    from modules.candidate.routes import candidate_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(leave_bp, url_prefix='/leave')
    app.register_blueprint(employee_bp, url_prefix='/employee')
    app.register_blueprint(docs_bp)
    app.register_blueprint(department_bp)
    app.register_blueprint(candidate_bp, url_prefix='/candidate')

    print("All registered endpoints:")
    for rule in app.url_map.iter_rules():
        print(rule.endpoint, rule)


def initialize_database():
    """Create departments, employees, and initial users safely (idempotent)"""
    from core.models import User, Department, Employee

    # 1️⃣ Departments
    departments_data = [
        {"key": "executive", "name": "Executive Leadership", "description": "Company executives"},
        {"key": "it", "name": "IT Department", "description": "Technology team"},
        {"key": "hr", "name": "Human Resources", "description": "HR team"},
        {"key": "operations", "name": "Operations", "description": "Company operations"}
    ]
    departments = {}
    for dept_data in departments_data:
        dept = Department.query.filter_by(name=dept_data["name"]).first()
        if not dept:
            dept = Department(name=dept_data["name"], description=dept_data["description"])
            db.session.add(dept)
            db.session.commit()  # commit now to get dept.id
        departments[dept_data["key"]] = dept

    # 2️⃣ Users
    users_data = [
        {"email": "it@alghaith.com", "name": "IT Manager", "role": "it_manager", "dept": "it", "access_code": "IT-001", "password": "SecurePassword123!"},
        {"email": "director@alghaith.com", "name": "General Director", "role": "general_director", "dept": "executive", "access_code": "GD-001", "password": "DirectorPass123!"},
        {"email": "manager@alghaith.com", "name": "General Manager", "role": "general_manager", "dept": "operations", "access_code": "GM-001", "password": "ManagerPass123!"},
        {"email": "hr@alghaith.com", "name": "Head of HR", "role": "head_of_department", "dept": "hr", "access_code": "HR-001", "password": "HRPass123!"},
        {"email": "dept@alghaith.com", "name": "Department Manager", "role": "manager", "dept": "operations", "access_code": "DM-001", "password": "DeptPass123!"},
        {"email": "employee@alghaith.com", "name": "Regular Employee", "role": "employee", "dept": "operations", "access_code": "EE-001", "password": "EmployeePass123!"}
    ]

    for user_data in users_data:
        # Skip if user already exists
        if User.query.filter_by(email=user_data["email"]).first():
            continue

        # Create Employee first if not exists
        employee = Employee.query.filter_by(full_name=user_data["name"]).first()
        if not employee:
            employee = Employee(
                full_name=user_data["name"],
                job_title=user_data["role"],
                department=departments[user_data["dept"]],
                phone=""
            )
            db.session.add(employee)
            db.session.commit()  # commit to get employee.id

        # Create User
        user = User(
            email=user_data["email"],
            name=user_data["name"],
            role=user_data["role"],
            access_code=user_data["access_code"],
            employee_id=employee.id,
            avatar=user_data["name"][0] + user_data["name"].split()[-1][0],
            is_active=True
        )
        user.set_password(user_data["password"])
        db.session.add(user)

    db.session.commit()
    print("✅ Database initialized successfully (idempotent)!")



# Create the app instance
app = create_app()


# User loader
@login_manager.user_loader
def load_user(user_id):
    from core.models import User
    return db.session.get(User, int(user_id))


# Error handlers
@app.errorhandler(403)
def forbidden_error(error):
    return render_template('errors/403.html'), 403


@app.errorhandler(404)
def not_found_error(error):
    return render_template('errors/404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return render_template('errors/500.html'), 500


# Routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        logout_user()
    return redirect(url_for('auth.login'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

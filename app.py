# app.py
# pyright: reportMissingImports=false
# pyright: reportMissingModuleSource=false
import logging
import os
from datetime import datetime, timedelta
from flask import Flask, render_template, redirect, url_for
from flask_wtf.csrf import CSRFProtect
from werkzeug.middleware.proxy_fix import ProxyFix
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

    app.config['SECRET_KEY'] = 'mqM_nXhDHOYlb0T8E9bT4c7XCLiDImpINnVHFmCLR-Q'

    # Inject logout_form
    from modules.auth.forms import LogoutForm
    @app.context_processor
    def inject_logout_form():
        return dict(logout_form=LogoutForm())

    # Register blueprints
    register_blueprints(app)

    # Create directories and database
    with app.app_context():
        # Import all models BEFORE create_all
        from core.models import User, Department, ActivityLog, LeaveRequest, EmployeeDocument

        # Create instance directory if missing
        db_path = app.config['SQLALCHEMY_DATABASE_URI'].split('///')[1]
        db_dir = os.path.dirname(db_path)
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)

        # Create uploads directory
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])

        # Create all tables
        db.create_all()

        # Initialize database with default data
        initialize_database()

    return app


def register_blueprints(app):
    """Register all application blueprints"""
    from modules.auth.routes import auth_bp
    from modules.dashboard.routes import dashboard_bp
    from modules.leave.routes import leave_bp
    from modules.employee.routes import employee_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp, url_prefix='/dashboard')
    app.register_blueprint(leave_bp, url_prefix='/leave')
    app.register_blueprint(employee_bp, url_prefix='/employee')

    print("All registered endpoints:")
    for rule in app.url_map.iter_rules():
        print(rule.endpoint, rule)


def initialize_database():
    """Create initial roles and admin user and ensure 'position' and 'phone' columns exist"""
    from core.models import User, Department
    from sqlalchemy import inspect, text

    # Map of extra columns and their SQL types
    extra_columns = {
        "position": "TEXT",
        "phone": "TEXT"
    }

    inspector = inspect(db.engine)
    existing_columns = [col['name'] for col in inspector.get_columns('users')]

    # Add missing columns
    for col_name, col_type in extra_columns.items():
        if col_name not in existing_columns:
            print(f"Adding missing '{col_name}' column to users table...")
            with db.engine.connect() as conn:
                conn.execute(text(f'ALTER TABLE users ADD COLUMN {col_name} {col_type};'))
            db.session.commit()

    # Stop if users already exist
    if User.query.count() > 0:
        return

    # Departments
    departments = {
        "executive": Department(name="Executive Leadership", description="Company executives"),
        "it": Department(name="IT Department", description="Technology team"),
        "hr": Department(name="Human Resources", description="HR team"),
        "operations": Department(name="Operations", description="Company operations")
    }
    for dept in departments.values():
        if not Department.query.filter_by(name=dept.name).first():
            db.session.add(dept)
    db.session.commit()

    # Users
    users = [
        {"email": "it@alghaith.com", "name": "IT Manager", "role": "it_manager", "dept": "it", "access_code": "IT-001", "password": "SecurePassword123!"},
        {"email": "director@alghaith.com", "name": "General Director", "role": "general_director", "dept": "executive", "access_code": "GD-001", "password": "DirectorPass123!"},
        {"email": "manager@alghaith.com", "name": "General Manager", "role": "general_manager", "dept": "operations", "access_code": "GM-001", "password": "ManagerPass123!"},
        {"email": "hr@alghaith.com", "name": "Head of HR", "role": "head_of_department", "dept": "hr", "access_code": "HR-001", "password": "HRPass123!"},
        {"email": "dept@alghaith.com", "name": "Department Manager", "role": "manager", "dept": "operations", "access_code": "DM-001", "password": "DeptPass123!"},
        {"email": "employee@alghaith.com", "name": "Regular Employee", "role": "employee", "dept": "operations", "access_code": "EE-001", "password": "EmployeePass123!"}
    ]

    for user_data in users:
        if not User.query.filter_by(email=user_data["email"]).first():
            dept = departments[user_data["dept"]]
            user = User(
                email=user_data["email"],
                name=user_data["name"],
                role=user_data["role"],
                access_code=user_data["access_code"],
                department=dept,
                avatar=user_data["name"][0] + user_data["name"].split()[-1][0],
                is_active=True,
                position="",  # default empty string
                phone=""      # default empty string
            )
            user.set_password(user_data["password"])
            db.session.add(user)

    db.session.commit()
    print("Database initialized successfully!")



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
    print(f"🔍 INDEX ROUTE: User authenticated? {current_user.is_authenticated}")
    if current_user.is_authenticated:
        logout_user()
        print("🔍 Forced logout - redirecting to login")
    return redirect(url_for('auth.login'))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

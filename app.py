# app.py
from flask import Flask, render_template
from config import Config
from core.extensions import db, login_manager, migrate
from flask_login import LoginManager, current_user
import logging
import os

logging.basicConfig()
logging.getLogger('sqlalchemy.engine').setLevel(logging.INFO)

def create_app():
    """Application factory function"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)
    
    # Register blueprints
    register_blueprints(app)
    
    # Create database tables
    with app.app_context():
        # Create instance directory if missing
        db_dir = app.config['SQLALCHEMY_DATABASE_URI'].split('///')[1].rsplit('/', 1)[0]
        if not os.path.exists(db_dir):
            os.makedirs(db_dir)
        
        # Create uploads directory
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        
        db.create_all()
        initialize_database()
    
    return app

def register_blueprints(app):
    """Register all application blueprints"""
    from modules.auth.routes import auth_bp
    from modules.dashboard.routes import dashboard_bp
    
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(dashboard_bp)

def initialize_database():
    """Create initial roles and admin user"""
    from core.models import User, Department
    
    # Check if data already exists
    if User.query.count() > 0:
        return
    
    # Create IT department
    it_dept = Department(name="IT Department", description="Technology team")
    db.session.add(it_dept)
    
    # Create IT Manager (full access)
    it_manager = User(
        email="it@alghaith.com",
        name="IT Manager",
        role="it_manager",
        avatar="IT",
        access_code="IT-001",
        department=it_dept,
        is_active=True
    )
    it_manager.set_password("SecurePassword123!")
    db.session.add(it_manager)
    
    # Create General Director
    director = User(
        email="director@alghaith.com",
        name="General Director",
        role="general_director",
        avatar="GD",
        access_code="GD-001",
        is_active=True
    )
    director.set_password("DirectorPass123!")
    db.session.add(director)
    
    # Create General Manager
    gen_manager = User(
        email="manager@alghaith.com",
        name="General Manager",
        role="general_manager",
        avatar="GM",
        access_code="GM-001",
        is_active=True
    )
    gen_manager.set_password("ManagerPass123!")
    db.session.add(gen_manager)
    
    # Create Department Head
    hr_head = User(
        email="hr@alghaith.com",
        name="Head of HR",
        role="head_of_department",
        avatar="HH",
        access_code="HR-001",
        is_active=True
    )
    hr_head.set_password("HRPass123!")
    db.session.add(hr_head)
    
    # Create Manager
    dept_manager = User(
        email="dept@alghaith.com",
        name="Department Manager",
        role="manager",
        avatar="DM",
        access_code="DM-001",
        is_active=True
    )
    dept_manager.set_password("DeptPass123!")
    db.session.add(dept_manager)
    
    # Create Employee
    employee = User(
        email="employee@alghaith.com",
        name="Regular Employee",
        role="employee",
        avatar="EE",
        access_code="EE-001",
        is_active=True
    )
    employee.set_password("EmployeePass123!")
    db.session.add(employee)
    
    db.session.commit()
    print("Database initialized successfully!")

# Create the app instance
app = create_app()

# User loader function
@login_manager.user_loader
def load_user(user_id):
    from core.models import User
    # Use session.get() to avoid SQLAlchemy 2.0 warnings
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

# Fix favicon error
@app.route('/favicon.ico')
def favicon():
    return '', 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
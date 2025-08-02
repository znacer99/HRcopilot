# pyright: reportMissingImports=false
# pyright: reportMissingModuleSource=false
from datetime import datetime
from core.extensions import db
from argon2 import PasswordHasher
from flask_login import UserMixin

ph = PasswordHasher()

class User(db.Model, UserMixin):
    """Enterprise user model with advanced security features"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)
    avatar = db.Column(db.String(2), nullable=False)
    access_code = db.Column(db.String(20), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    login_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    department = db.relationship('Department', back_populates='members')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    
    def set_password(self, password):
        """Securely hash password with Argon2"""
        self.password_hash = ph.hash(password)
    
    def check_password(self, password):
        """Verify password against hash"""
        try:
            return ph.verify(self.password_hash, password)
        except:
            return False
    
    def has_permission(self, resource, required_level):
        """Check if user has required permission level for a feature"""
        from core.permissions import Permission
        return Permission.check(self.role, resource, required_level)
    
    # Add these required methods for Flask-Login
    def get_id(self):
        return str(self.id)
    
    @property
    def is_authenticated(self):
        return True
    
    @property
    def is_anonymous(self):
        return False

class Department(db.Model):
    """Department model with hierarchy support"""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationships
    members = db.relationship('User', back_populates='department')

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100))
    target = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='activities')
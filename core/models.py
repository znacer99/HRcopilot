# core/models.py
from datetime import datetime
from core.extensions import db
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash  # Correct import
from flask_login import UserMixin
from flask import current_app

# Single instance for password hashing
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
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    
    # Relationships
    department = db.relationship('Department', back_populates='members')
    
    def set_password(self, password):
        """Securely hash password with Argon2"""
        self.password_hash = ph.hash(password)
    
    def check_password(self, password):
        """Verify password against hash"""
        try:
            return ph.verify(self.password_hash, password)
        except (VerifyMismatchError, InvalidHash):  # Fixed exception name
            return False
        except Exception as e:
            # Log unexpected errors
            current_app.logger.error(f"Password verification error: {str(e)}")
            return False
    
    def get_id(self):
        return str(self.id)
    
    # Flask-Login properties
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
    members = db.relationship('User', back_populates='department', lazy='dynamic')

class ActivityLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100))
    target = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    user = db.relationship('User', backref='activities')

class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'

    id = db.Column(db.Integer, primary_key=True)
    # requester
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    # optional approver (set when approved/rejected)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'))

    type = db.Column(db.String(30), nullable=False, default='annual')  # annual/sick/unpaid/other
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text)

    status = db.Column(db.String(20), nullable=False, default='pending')  # pending/approved/rejected
    decided_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationships
    requester = db.relationship('User', foreign_keys=[user_id], backref='leave_requests')
    approver = db.relationship('User', foreign_keys=[approver_id])

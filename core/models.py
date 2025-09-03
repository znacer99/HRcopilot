from datetime import datetime
from core.extensions import db
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, InvalidHash
from flask_login import UserMixin
from flask import current_app

ph = PasswordHasher()

# -------------------- USER --------------------
class User(db.Model, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False)   # General Director, IT Manager, etc.
    avatar = db.Column(db.String(255), nullable=True)  # <-- updated: now nullable and bigger
    access_code = db.Column(db.String(20), unique=True, nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'))  # Link to Employee
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    login_count = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    # Relationships
    employee = db.relationship('Employee', back_populates='user', uselist=False)
    documents = db.relationship('UserDocument', back_populates='user', cascade="all, delete-orphan")
    folders_created = db.relationship('Folder', back_populates='creator', cascade="all, delete-orphan")
    activities = db.relationship('ActivityLog', back_populates='user', cascade="all, delete-orphan")
    approved_requests = db.relationship('LeaveRequest', back_populates='approver', foreign_keys='LeaveRequest.approver_id')

    def set_password(self, password):
        self.password_hash = ph.hash(password)

    def check_password(self, password):
        try:
            return ph.verify(self.password_hash, password)
        except (VerifyMismatchError, InvalidHash):
            return False
        except Exception as e:
            current_app.logger.error(f"Password verification error: {str(e)}")
            return False

    def get_id(self):
        return str(self.id)

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False



# -------------------- EMPLOYEE --------------------
class Employee(db.Model):
    __tablename__ = "employees"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    job_title = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(255), nullable=True)
    nationality = db.Column(db.String(50), nullable=True)
    id_number = db.Column(db.String(50), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Foreign Keys
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"))

    # Relationships
    department = db.relationship("Department", back_populates="employees")
    user = db.relationship("User", back_populates="employee", uselist=False)

    def __repr__(self):
        return f"<Employee {self.full_name} - {self.job_title}>"


# -------------------- DEPARTMENT --------------------
class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True, nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    employees = db.relationship("Employee", back_populates="department", lazy="selectin")

    # New property to access users directly
    @property
    def members(self):
        """Return all User objects in this department."""
        return [e.user for e in self.employees if e.user is not None]

    def __repr__(self):
        return f"<Department {self.name}>"



# -------------------- FOLDER --------------------
class Folder(db.Model):
    __tablename__ = 'folders'
    __table_args__ = (db.UniqueConstraint('name', 'created_by', name='uix_user_folder'),)

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    documents = db.relationship('UserDocument', back_populates='folder', cascade="all, delete-orphan")
    creator = db.relationship('User', back_populates='folders_created')

    def __repr__(self):
        return f"<Folder {self.name}>"


# -------------------- USERDOCUMENT --------------------
class UserDocument(db.Model):
    __tablename__ = 'user_documents'

    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(255), nullable=False)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)  # who uploaded the document
    visibility_type = db.Column(db.String(50), default='private')  # private for personal, shared for everyone
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='documents')
    folder = db.relationship('Folder', back_populates='documents')

    def __repr__(self):
        return f"<UserDocument id={self.id} filename={self.filename} user_id={self.user_id} folder_id={self.folder_id}>"

    def can_user_access(self, user):
        """
        Determines if a user can view/download the document.
        - Shared documents: everyone can view.
        - Private/folder documents: only uploader can view.
        """
        if self.visibility_type == 'shared':
            return True
        # If it's in a folder (private) or root private
        return self.user_id == user.id

    def can_user_delete(self, user):
        """
        Determines if a user can delete the document.
        - Only uploader or admins (general_director, it_manager) can delete.
        """
        return self.user_id == user.id or user.role.lower() in ['general_director', 'it_manager']

    @staticmethod
    def visible_documents_for(user):
        """
        Returns all documents the user is allowed to see.
        """
        all_docs = UserDocument.query.all()
        return [doc for doc in all_docs if doc.can_user_access(user)]




# -------------------- ACTIVITY LOG --------------------
class ActivityLog(db.Model):
    __tablename__ = 'activity_log'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    action = db.Column(db.String(100))
    target = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user = db.relationship('User', back_populates='activities')


# -------------------- LEAVE REQUEST --------------------
class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    type = db.Column(db.String(30), nullable=False, default='annual')
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='pending')
    decided_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    requester = db.relationship('User', foreign_keys=[user_id], backref='leave_requests')
    approver = db.relationship('User', foreign_keys=[approver_id])

# -------------------- CANDIDATE --------------------
class Candidate(db.Model):
    __tablename__ = 'candidates'

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    nationality = db.Column(db.String(50), nullable=True)
    applied_position = db.Column(db.String(120), nullable=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=True)
    cv_filepath = db.Column(db.String(255), nullable=True)
    id_document_filepath = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(50), default='new')  # new, interviewed, hired, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    department = db.relationship("Department", backref="candidates", lazy=True)

    def __repr__(self):
        return f"<Candidate {self.full_name} - {self.applied_position} ({self.status})>"

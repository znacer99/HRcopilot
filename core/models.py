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
    position = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20), nullable=True)

    # Relationships
    department = db.relationship('Department', back_populates='members')
    documents = db.relationship('UserDocument', back_populates='user', cascade="all, delete-orphan")
    folders_created = db.relationship('Folder', back_populates='creator', cascade="all, delete-orphan")
    activities = db.relationship('ActivityLog', back_populates='user', cascade="all, delete-orphan")

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

# -------------------- DEPARTMENT --------------------
class Department(db.Model):
    __tablename__ = 'departments'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    members = db.relationship('User', back_populates='department', lazy='dynamic')

# -------------------- FOLDER --------------------
class Folder(db.Model):
    __tablename__ = 'folders'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), unique=True, nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # FIXED: relationship to UserDocument via foreign key
    documents = db.relationship('UserDocument', back_populates='folder', cascade="all, delete-orphan")

    # Creator relationship
    creator = db.relationship('User', back_populates='folders_created')

    def __repr__(self):
        return f"<Folder {self.name}>"

# -------------------- USERDOCUMENT --------------------
class UserDocument(db.Model):
    __tablename__ = 'user_document'
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    filepath = db.Column(db.String(255), nullable=False)
    folder_id = db.Column(db.Integer, db.ForeignKey('folders.id'), nullable=True)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    visibility_type = db.Column(db.String(50), default='private')  # 'private' or 'public'
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    user = db.relationship('User', back_populates='documents')
    folder = db.relationship('Folder', back_populates='documents')

    def __repr__(self):
        return f"<UserDocument id={self.id} filename={self.filename} user_id={self.uploaded_by} folder_id={self.folder_id}>"

    def can_user_access(self, user):
        # uploader always can
        if user.id == self.uploaded_by:
            return True
        # public documents are visible to everyone
        if self.visibility_type == 'public':
            return True
        # otherwise private
        return False

    @staticmethod
    def visible_documents_for(user):
        all_docs = UserDocument.query.all()
        return [doc for doc in all_docs if doc.can_user_access(user)]


# -------------------- ACTIVITY LOG --------------------
class ActivityLog(db.Model):
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

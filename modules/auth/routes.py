# modules/auth/routes.py
# pyright: reportMissingImports=false
# pyright: reportMissingModuleSource=false
from flask import Blueprint, render_template, redirect, url_for, flash
from flask_login import login_user, logout_user, current_user, login_required
from core.extensions import db
from core.models import User
from datetime import datetime
from modules.auth.forms import LoginForm

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Redirect if already logged in
    if current_user.is_authenticated:

        # Redirect IT Managers to admin portal
        if current_user.role == "it_manager":
            return redirect(url_for('admin.dashboard'))
        return redirect(url_for('dashboard.role_dashboard'))
    logout_user

    form = LoginForm()
    
    if form.validate_on_submit():
        email = form.email.data
        password = form.password.data
        
        # Find user by email
        user = User.query.filter_by(email=email).first()
        
        # Validate credentials
        if user and user.check_password(password):
            login_user(user)
            
            # Update login stats
            user.login_count += 1
            user.last_login = datetime.utcnow()
            db.session.commit()

            # debug print
            print(f"Logged in as: {user.email} with role: {user.role}")
            
            # Redirect to appropriate dashboard
            if user.role == "it_manager":
                return redirect(url_for('admin.dashboard'))
            return redirect(url_for('dashboard.role_dashboard'))
        else:
            flash('Invalid email or password', 'error')
    
    return render_template('auth/login.html', form=form)

@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'success')
    return redirect(url_for('auth.login'))

@auth_bp.route('/admin-login', methods=['GET', 'POST'])
def admin_login():
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data).first()
        if user and user.role == 'it_manager':  # Only allow IT managers
            login_user(user)
            return redirect(url_for('admin.dashboard'))
        flash('Admin access denied')
    return render_template('auth/login.html', form=form)
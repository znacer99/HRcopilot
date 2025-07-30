# modules/dashboard/services.py
from core.extensions import db
from core.models import User, Department

def get_director_dashboard_data():
    return {
        'total_employees': User.query.count(),
        'total_departments': Department.query.count(),
        'recent_employees': User.query.order_by(User.created_at.desc()).limit(5).all()
    }
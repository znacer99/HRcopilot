# pyright: reportMissingImports=false
# pyright: reportMissingModuleSource=false
from core.models import User, Department, ActivityLog
from sqlalchemy import func

def get_director_dashboard_data():
    """Get data for General Director dashboard"""
    return {
        'employee_count': User.query.count(),
        'department_count': Department.query.count(),
        'recent_employees': User.query.order_by(User.created_at.desc()).limit(5).all(),
        'department_stats': get_department_stats(),
        'activity_log': ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()
    }

def get_manager_dashboard_data(user):
    """Get data for Department Manager dashboard"""
    return {
        'department_employee_count': User.query.filter_by(department_id=user.department_id).count(),
        'department_activities': ActivityLog.query.filter_by(user_id=user.id)
                               .order_by(ActivityLog.timestamp.desc())
                               .limit(10).all()
    }

def get_department_stats():
    """Get statistics about departments"""
    return Department.query \
        .join(User) \
        .group_by(Department.id) \
        .with_entities(
            Department.name,
            func.count(User.id).label('employee_count')
        ).all()
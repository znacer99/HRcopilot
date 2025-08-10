# pyright: reportMissingImports=false
# pyright: reportMissingModuleSource=false
from core.models import User, Department, ActivityLog, db
from sqlalchemy import func

def get_director_dashboard_data():
    total_users = User.query.count()
    active_users = User.query.filter_by(is_active=True).count()
    inactive_users = total_users - active_users
    departments_count = Department.query.count()

    recent_activities = ActivityLog.query.order_by(ActivityLog.timestamp.desc()).limit(10).all()

    departments = (
        db.session.query(
            Department,
            func.count(User.id).label('member_count')
        )
        .outerjoin(User)
        .group_by(Department.id)
        .all()
    )

    return {
        'total_users': total_users,
        'active_users': active_users,
        'inactive_users': inactive_users,
        'departments_count': departments_count,
        'recent_activities': recent_activities,
        'departments': departments
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
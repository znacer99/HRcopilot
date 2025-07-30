# core/permissions.py
class Permission:
    """Defines all permission levels and features"""
    # Permission levels
    NONE = 0
    PERSONAL = 1
    DEPARTMENT = 2
    ALL = 3
    WITH_APPROVAL = 4
    
    # Feature lines
    COMPANY_ANALYTICS = "company_analytics"
    DEPARTMENT_MGMT = "department_mgmt"
    EMPLOYEE_MGMT = "employee_mgmt"
    DOCUMENT_MGMT = "document_mgmt"
    SYSTEM_CONFIG = "system_config"
    REPORTS = "reports"
    
    # Role definitions
    ROLES = {
        "general_director": {
            COMPANY_ANALYTICS: ALL,
            DEPARTMENT_MGMT: ALL,
            EMPLOYEE_MGMT: ALL,
            DOCUMENT_MGMT: ALL,
            SYSTEM_CONFIG: NONE,
            REPORTS: ALL
        },
        "general_manager": {
            COMPANY_ANALYTICS: WITH_APPROVAL,
            DEPARTMENT_MGMT: ALL,
            EMPLOYEE_MGMT: ALL,
            DOCUMENT_MGMT: WITH_APPROVAL,
            SYSTEM_CONFIG: NONE,
            REPORTS: ALL
        },
        "manager": {
            COMPANY_ANALYTICS: NONE,
            DEPARTMENT_MGMT: DEPARTMENT,
            EMPLOYEE_MGMT: DEPARTMENT,
            DOCUMENT_MGMT: DEPARTMENT,
            SYSTEM_CONFIG: NONE,
            REPORTS: DEPARTMENT
        },
        "it_manager": {
            COMPANY_ANALYTICS: ALL,
            DEPARTMENT_MGMT: ALL,
            EMPLOYEE_MGMT: ALL,
            DOCUMENT_MGMT: ALL,
            SYSTEM_CONFIG: ALL,
            REPORTS: ALL
        },
        "head_of_department": {
            COMPANY_ANALYTICS: NONE,
            DEPARTMENT_MGMT: ALL,
            EMPLOYEE_MGMT: ALL,
            DOCUMENT_MGMT: WITH_APPROVAL,
            SYSTEM_CONFIG: NONE,
            REPORTS: WITH_APPROVAL
        },
        "employee": {
            COMPANY_ANALYTICS: NONE,
            DEPARTMENT_MGMT: NONE,
            EMPLOYEE_MGMT: NONE,
            DOCUMENT_MGMT: PERSONAL,
            SYSTEM_CONFIG: NONE,
            REPORTS: NONE
        }
    }
    
    @classmethod
    def get_role_permissions(cls, role):
        """Get permission structure for a specific role"""
        return cls.ROLES.get(role, {})
    
    
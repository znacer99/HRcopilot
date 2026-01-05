export function getPermissions(user) {
  const role = user?.role?.toLowerCase() || "";

  return {
    VIEW_EMPLOYEES:
      role.includes("director") ||
      role.includes("manager") ||
      role.includes("it_manager"),

    EDIT_EMPLOYEE:
      role.includes("director") ||
      role.includes("manager") ||
      role.includes("it_manager"),

    UPLOAD_EMPLOYEE_DOCS:
      role.includes("director") ||
      role.includes("manager") ||
      role.includes("it_manager"),

    MANAGE_SYSTEM: role.includes("it_manager"),
  };
}

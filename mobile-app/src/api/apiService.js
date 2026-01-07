import AsyncStorage from '@react-native-async-storage/async-storage';
export const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000").replace(/\/+$/, "");

console.log("✅ API BASE_URL:", BASE_URL);

const apiService = {

  async request(endpoint, options = {}) {
    try {
      const token = await AsyncStorage.getItem("token");
      const isFormData = options.body instanceof FormData;

      const config = {
        method: options.method || "GET",
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      };

      if (options.body) {
        config.body = isFormData ? options.body : JSON.stringify(options.body);
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, config);

      const text = await response.text();
      let data;

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { success: false, message: "Invalid JSON response", raw: text };
      }

      if (!response.ok) throw { ...data, status: response.status };


      return data;

    } catch (error) {
      console.error("❌ API ERROR:", endpoint, error);
      throw error;
    }
  },

  // AUTH
  async login(email, password) {
    return this.request('/api/mobile/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  },

  async getMe() {
    return this.request('/api/mobile/auth/me');
  },

  async updateProfile(data) {
    return this.request('/api/mobile/auth/profile', {
      method: 'PUT',
      body: data
    });
  },

  async changePassword(oldPassword, newPassword) {
    return this.request('/api/mobile/auth/change-password', {
      method: 'POST',
      body: { old_password: oldPassword, new_password: newPassword }
    });
  },

  // DASHBOARD
  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
  },

  // USERS
  async getUsers(includeInactive = false) {
    return this.request(`/api/users?include_inactive=${includeInactive}`);
  },

  async getUser(id) {
    return this.request(`/api/users/${id}`);
  },

  async createUser(data) {
    return this.request('/api/users', {
      method: 'POST',
      body: data
    });
  },

  async updateUser(id, data) {
    return this.request(`/api/users/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async deleteUser(id) {
    return this.request(`/api/users/${id}`, {
      method: 'DELETE'
    });
  },

  // EMPLOYEES
  async getEmployees() {
    return this.request('/api/employees');
  },

  async getEmployee(id) {
    return this.request(`/api/employees/${id}`);
  },

  async updateEmployee(id, data) {
    return this.request(`/api/employees/${id}`, {
      method: 'PUT',
      body: data,
    });
  },

  async createEmployee(data) {
    return this.request('/api/employees', {
      method: 'POST',
      body: data,
    });
  },

  async deleteEmployee(id) {
    return this.request(`/api/employees/${id}`, {
      method: 'DELETE',
    });
  },

  async uploadEmployeeDocuments(empId, formData) {
    return this.request(`/api/employees/${empId}/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        // fetch will auto set it
      }
    });
  },

  // CANDIDATES
  async getCandidates() {
    return this.request('/api/candidates');
  },

  async getCandidate(id) {
    return this.request(`/api/candidates/${id}`);
  },

  async createCandidate(data) {
    return this.request('/api/candidates', {
      method: 'POST',
      body: data
    });
  },

  async updateCandidate(id, data) {
    return this.request(`/api/candidates/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async deleteCandidate(id) {
    return this.request(`/api/candidates/${id}`, {
      method: 'DELETE'
    });
  },

  // LEAVES
  async getLeaves() {
    return this.request('/api/leaves');
  },

  async createLeave(data) {
    return this.request('/api/leaves', {
      method: 'POST',
      body: data
    });
  },

  async getPendingLeaves() {
    return this.request('/api/leaves/pending');
  },

  async approveLeave(id) {
    return this.request(`/api/leaves/${id}/approve`, {
      method: 'POST',
      body: {}
    });
  },

  async rejectLeave(id) {
    return this.request(`/api/leaves/${id}/reject`, {
      method: 'POST',
      body: {}
    });
  },

  // DOCUMENTS (USER DOCUMENTS – this endpoint EXISTS)
  async getDocuments() {
    // backend: /api/documents/user
    return this.request('/api/documents/user');
  },

  async deleteDocument(docId) {
    return this.request(`/api/documents/${docId}`, {
      method: "DELETE",
    });
  },

  async getEmployeeDocuments(employeeId) {
    return this.request(`/api/documents/employee/${employeeId}`);
  },

  async deleteEmployeeDocument(docId) {
    return this.request(`/api/documents/employee/${docId}`, {
      method: "DELETE",
    });
  },

  async getToken() {
    return await AsyncStorage.getItem("token");
  },

  // DEPARTMENTS
  async getDepartments() {
    return this.request("/api/departments");
  },

  async getDepartment(id) {
    return this.request(`/api/departments/${id}`);
  },

  async createDepartment(data) {
    return this.request("/api/departments", { method: "POST", body: data });
  },

  async updateDepartment(id, data) {
    return this.request(`/api/departments/${id}`, { method: "PUT", body: data });
  },

  async deleteDepartment(id) {
    return this.request(`/api/departments/${id}`, { method: "DELETE" });
  },

  // ⚠ uploadDocument: your backend has NO /api/documents/upload
  // Web upload uses /documents/upload (HTML form + CSRF).
  // Mobile upload would need a dedicated API; for now this will 404 if called.
  async uploadDocument(formData) {
    const token = await AsyncStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  },

  // REQUESTS (Generic - IT, HR, etc)
  async fetchRequests() {
    return this.request('/api/mobile/requests');
  },

  async createRequest(data) {
    return this.request('/api/mobile/requests', {
      method: 'POST',
      body: data
    });
  },

  // MANAGER REQUESTS
  async fetchAllRequests() {
    return this.request('/api/mobile/requests/all');
  },

  async updateRequest(id, data) {
    return this.request(`/api/mobile/requests/${id}`, {
      method: 'PUT',
      body: data
    });
  },

};

export default apiService;

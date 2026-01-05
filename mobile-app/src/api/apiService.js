import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = "http://102.213.182.101:5000";

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

      if (!response.ok) throw data;

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

  // DASHBOARD
  async getDashboardStats() {
    return this.request('/api/dashboard/stats');
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

  // LEAVES
  async getLeaves() {
    return this.request('/api/leaves');
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

};

export default apiService;

// ============================================================================
// BLOOD BANK MANAGEMENT SYSTEM - REST API CLIENT
// ============================================================================

const API_BASE = '/api';

const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = localStorage.getItem('lifeFlow_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || `HTTP error ${response.status}`);
            }
            return data;
        } catch (error) {
            console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, error);
            throw error;
        }
    },

    // Auth
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    },

    // Dashboard
    async getDashboard() {
        return this.request('/dashboard');
    },

    // Donors
    async getDonors(search = '', bloodGroup = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (bloodGroup && bloodGroup !== 'all') params.append('blood_group', bloodGroup);
        return this.request(`/donors?${params.toString()}`);
    },

    async getDonor(id) {
        return this.request(`/donors/${id}`);
    },

    async createDonor(data) {
        return this.request('/donors', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateDonor(id, data) {
        return this.request(`/donors/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteDonor(id) {
        return this.request(`/donors/${id}`, {
            method: 'DELETE'
        });
    },

    // Patients
    async getPatients(search = '', bloodGroup = '', status = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (bloodGroup && bloodGroup !== 'all') params.append('blood_group', bloodGroup);
        if (status && status !== 'all') params.append('status', status);
        return this.request(`/patients?${params.toString()}`);
    },

    async getPatient(id) {
        return this.request(`/patients/${id}`);
    },

    async createPatient(data) {
        return this.request('/patients', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updatePatient(id, data) {
        return this.request(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deletePatient(id) {
        return this.request(`/patients/${id}`, {
            method: 'DELETE'
        });
    },

    // Inventory
    async getInventory() {
        return this.request('/inventory');
    },

    async updateInventory(bloodGroup, units) {
        return this.request(`/inventory/${encodeURIComponent(bloodGroup)}`, {
            method: 'PUT',
            body: JSON.stringify({ available_units: units })
        });
    },

    // Donations
    async getDonations(search = '', bloodGroup = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (bloodGroup && bloodGroup !== 'all') params.append('blood_group', bloodGroup);
        return this.request(`/donations?${params.toString()}`);
    },

    async createDonation(data) {
        return this.request('/donations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateDonation(id, data) {
        return this.request(`/donations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteDonation(id) {
        return this.request(`/donations/${id}`, {
            method: 'DELETE'
        });
    },

    // Requests
    async getRequests(search = '', status = '', priority = '') {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (status && status !== 'all') params.append('status', status);
        if (priority && priority !== 'all') params.append('priority', priority);
        return this.request(`/requests?${params.toString()}`);
    },

    async createRequest(data) {
        return this.request('/requests', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateRequest(id, data) {
        return this.request(`/requests/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async fulfillRequest(id) {
        return this.request(`/requests/${id}/fulfill`, {
            method: 'PUT'
        });
    },

    async updateRequestStatus(id, status) {
        return this.request(`/requests/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
    },

    async deleteRequest(id) {
        return this.request(`/requests/${id}`, {
            method: 'DELETE'
        });
    },

    // Reports
    async getReports() {
        return this.request('/reports');
    },

    // Schema & Database Inspector
    async getSchema() {
        return this.request('/database/schema');
    },

    async getTableRecords(tableName) {
        return this.request(`/database/tables/${tableName}`);
    },

    async resetDatabase() {
        return this.request('/database/reset', {
            method: 'POST'
        });
    }
};

window.api = api;

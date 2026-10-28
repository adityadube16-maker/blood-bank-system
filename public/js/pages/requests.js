// ============================================================================
// PAGE CONTROLLER: BLOOD REQUEST MANAGEMENT
// ============================================================================

window.requestsPage = {
    requestsList: [],
    patientsCache: [],

    async render() {
        return `
            <div class="table-toolbar">
                <div class="table-search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="request-search-input" placeholder="Search by patient, hospital, or ID...">
                </div>

                <div class="table-filters">
                    <select id="request-status-filter" class="select-filter">
                        <option value="all">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Rejected">Rejected</option>
                    </select>

                    <select id="request-priority-filter" class="select-filter">
                        <option value="all">All Priorities</option>
                        <option value="Urgent">Urgent</option>
                        <option value="High">High</option>
                        <option value="Normal">Normal</option>
                    </select>

                    <button class="btn btn-primary" id="btn-add-request">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        New Blood Request
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--primary-red)"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Hospital Blood Dispatch Orders & Requests
                    </div>
                    <span id="requests-count-badge" class="nav-badge" style="background: var(--bg-card-subtle);">Loading...</span>
                </div>
                <div class="table-responsive">
                    <table class="custom-table" id="requests-table">
                        <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>Patient Name</th>
                                <th>Hospital</th>
                                <th>Blood Group</th>
                                <th>Units Needed</th>
                                <th>Date</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th style="text-align: right;">Fulfill / Actions</th>
                            </tr>
                        </thead>
                        <tbody id="requests-table-body">
                            <tr>
                                <td colspan="9" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                    Loading blood requests...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async loadRequests(search = '', status = 'all', priority = 'all') {
        try {
            const res = await api.getRequests(search, status, priority);
            this.requestsList = res.data;
            this.renderTableRows(this.requestsList);
            document.getElementById('requests-count-badge').textContent = `${this.requestsList.length} Orders`;
        } catch (err) {
            app.showToast('Failed to load blood requests: ' + err.message, 'error');
        }
    },

    async loadPatientsCache() {
        if (this.patientsCache.length === 0) {
            try {
                const res = await api.getPatients();
                this.patientsCache = res.data;
            } catch (e) {
                console.error('Failed to load patients cache', e);
            }
        }
    },

    renderTableRows(requests) {
        const tbody = document.getElementById('requests-table-body');
        if (!tbody) return;

        if (requests.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        No blood requests matching the filters.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = requests.map(r => {
            const priorityClass = r.priority === 'Urgent' ? 'status-urgent' : (r.priority === 'High' ? 'priority-high' : 'status-normal');
            const statusClass = r.status === 'Fulfilled' ? 'status-fulfilled' : (r.status === 'Approved' ? 'status-approved' : (r.status === 'Rejected' ? 'status-rejected' : 'status-pending'));

            const canFulfill = (r.status === 'Pending' || r.status === 'Approved');

            return `
                <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--primary-red);">#REQ-${String(r.request_id).padStart(3, '0')}</td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-main);">${r.patient_name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Ref: #PAT-${r.patient_id}</div>
                    </td>
                    <td>
                        <div style="font-weight: 500;">${r.hospital}</div>
                    </td>
                    <td><span class="blood-badge">${r.blood_group}</span></td>
                    <td><strong>${r.required_units}</strong> Bags</td>
                    <td>${r.request_date}</td>
                    <td><span class="status-badge ${priorityClass}">${r.priority}</span></td>
                    <td><span class="status-badge ${statusClass}">${r.status}</span></td>
                    <td style="text-align: right;">
                        <div class="action-buttons" style="justify-content: flex-end;">
                            ${canFulfill ? `
                                <button class="btn btn-action-fulfill" title="Fulfill from Blood Inventory" onclick="requestsPage.confirmFulfill(${r.request_id}, '${r.blood_group}', ${r.required_units})">
                                    ✓ Fulfill
                                </button>
                                <button class="btn btn-icon-only btn-secondary" title="Quick Approve" style="font-size: 0.75rem; width: 28px; height: 28px;" onclick="requestsPage.updateStatus(${r.request_id}, 'Approved')">
                                    Approve
                                </button>
                            ` : ''}
                            <button class="btn btn-icon-only btn-action-edit" title="Edit Request" onclick="requestsPage.openFormModal(${r.request_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="btn btn-icon-only btn-action-delete" title="Delete Request" onclick="requestsPage.confirmDelete(${r.request_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async bindEvents() {
        await this.loadPatientsCache();
        await this.loadRequests();

        const searchInput = document.getElementById('request-search-input');
        const statusFilter = document.getElementById('request-status-filter');
        const priorityFilter = document.getElementById('request-priority-filter');
        const addBtn = document.getElementById('btn-add-request');

        const doFilter = () => {
            this.loadRequests(searchInput.value.trim(), statusFilter.value, priorityFilter.value);
        };

        let debounceTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(doFilter, 300);
        });

        statusFilter.addEventListener('change', doFilter);
        priorityFilter.addEventListener('change', doFilter);

        addBtn.addEventListener('click', () => {
            this.openFormModal();
        });
    },

    async openFormModal(requestId = null) {
        await this.loadPatientsCache();
        const isEdit = Boolean(requestId);
        const req = isEdit ? this.requestsList.find(r => r.request_id === requestId) : {
            patient_id: this.patientsCache[0]?.patient_id || '',
            blood_group: this.patientsCache[0]?.blood_group || 'O+',
            required_units: 2,
            request_date: new Date().toISOString().split('T')[0],
            priority: 'Normal',
            status: 'Pending'
        };

        const patientOptions = this.patientsCache.map(p => `
            <option value="${p.patient_id}" data-blood="${p.blood_group}" data-hospital="${p.hospital}" ${p.patient_id == req.patient_id ? 'selected' : ''}>
                ${p.name} (${p.blood_group}) - ${p.hospital}
            </option>
        `).join('');

        const modalBody = `
            <form id="form-blood-request" class="form-grid">
                <div class="form-group full-width">
                    <label class="form-label" for="request-patient-id">Select Patient (Foreign Key) *</label>
                    <select id="request-patient-id" class="form-control" required>
                        ${patientOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="request-blood-group">Required Blood Group *</label>
                    <input type="text" id="request-blood-group" class="form-control" value="${req.blood_group}" readonly style="background: #f1f5f9; font-weight: 700;">
                </div>

                <div class="form-group">
                    <label class="form-label" for="request-units">Required Units (Bags) *</label>
                    <input type="number" id="request-units" class="form-control" value="${req.required_units}" min="1" max="15" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="request-date">Request Date *</label>
                    <input type="date" id="request-date" class="form-control" value="${req.request_date}" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="request-priority">Clinical Priority *</label>
                    <select id="request-priority" class="form-control" required>
                        <option value="Normal" ${req.priority === 'Normal' ? 'selected' : ''}>Normal</option>
                        <option value="High" ${req.priority === 'High' ? 'selected' : ''}>High</option>
                        <option value="Urgent" ${req.priority === 'Urgent' ? 'selected' : ''}>Urgent (Trauma / Emergency)</option>
                    </select>
                </div>

                <div class="form-group full-width">
                    <label class="form-label" for="request-status">Request Workflow Status *</label>
                    <select id="request-status" class="form-control" required>
                        <option value="Pending" ${req.status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Approved" ${req.status === 'Approved' ? 'selected' : ''}>Approved</option>
                        <option value="Fulfilled" ${req.status === 'Fulfilled' ? 'selected' : ''}>Fulfilled</option>
                        <option value="Rejected" ${req.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </div>
            </form>
        `;

        app.openModal({
            title: isEdit ? 'Edit Blood Request Order' : 'Submit Hospital Blood Request',
            body: modalBody,
            confirmText: isEdit ? 'Save Changes' : 'Submit Request',
            onConfirm: async () => {
                const patient_id = document.getElementById('request-patient-id').value;
                const blood_group = document.getElementById('request-blood-group').value;
                const required_units = parseInt(document.getElementById('request-units').value, 10);
                const request_date = document.getElementById('request-date').value;
                const priority = document.getElementById('request-priority').value;
                const status = document.getElementById('request-status').value;

                if (!patient_id || !request_date) {
                    app.showToast('Please fill all required request fields.', 'error');
                    return false;
                }

                const payload = { patient_id, blood_group, required_units, request_date, priority, status };

                try {
                    if (isEdit) {
                        await api.updateRequest(requestId, payload);
                        app.showToast('Blood request updated successfully!', 'success');
                    } else {
                        await api.createRequest(payload);
                        app.showToast('Blood request submitted successfully!', 'success');
                    }
                    if (app.currentPage === 'dashboard') {
                        app.navigateTo('dashboard');
                    } else if (app.currentPage === 'requests') {
                        this.loadRequests();
                    }
                    return true;
                } catch (err) {
                    app.showToast(err.message || 'Operation failed', 'error');
                    return false;
                }
            }
        });

        // Auto sync blood group when patient changes
        setTimeout(() => {
            const patientSelect = document.getElementById('request-patient-id');
            const bgInput = document.getElementById('request-blood-group');
            if (patientSelect && bgInput) {
                patientSelect.addEventListener('change', () => {
                    const opt = patientSelect.options[patientSelect.selectedIndex];
                    bgInput.value = opt.getAttribute('data-blood') || 'O+';
                });
            }
        }, 100);
    },

    confirmFulfill(requestId, bloodGroup, units) {
        app.confirmDialog({
            title: 'Fulfill Blood Request Order',
            message: `Are you sure you want to fulfill request <strong>#REQ-${requestId}</strong>? <br><br>This will automatically verify stock and deduct <strong>${units} unit(s) of ${bloodGroup}</strong> directly from the blood bank inventory.`,
            confirmText: 'Yes, Fulfill & Deduct Stock',
            onConfirm: async () => {
                try {
                    const res = await api.fulfillRequest(requestId);
                    app.showToast(res.message, 'success');
                    this.loadRequests();
                } catch (err) {
                    app.showToast(err.message || 'Failed to fulfill request', 'error');
                }
            }
        });
    },

    async updateStatus(requestId, newStatus) {
        try {
            await api.updateRequestStatus(requestId, newStatus);
            app.showToast(`Request #${requestId} status set to ${newStatus}`, 'success');
            this.loadRequests();
        } catch (err) {
            app.showToast(err.message || 'Status update failed', 'error');
        }
    },

    confirmDelete(requestId) {
        app.confirmDialog({
            title: 'Delete Blood Request',
            message: `Are you sure you want to remove blood request <strong>#REQ-${requestId}</strong>?`,
            confirmText: 'Yes, Delete Request',
            onConfirm: async () => {
                try {
                    await api.deleteRequest(requestId);
                    app.showToast('Blood request removed', 'success');
                    this.loadRequests();
                } catch (err) {
                    app.showToast('Failed to delete request: ' + err.message, 'error');
                }
            }
        });
    }
};

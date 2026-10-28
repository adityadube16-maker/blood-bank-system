// ============================================================================
// PAGE CONTROLLER: PATIENT MANAGEMENT
// ============================================================================

window.patientsPage = {
    patientsList: [],

    async render() {
        return `
            <div class="table-toolbar">
                <div class="table-search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="patient-search-input" placeholder="Search by patient name, hospital, phone...">
                </div>

                <div class="table-filters">
                    <select id="patient-blood-filter" class="select-filter">
                        <option value="all">All Blood Groups</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>

                    <select id="patient-status-filter" class="select-filter">
                        <option value="all">All Statuses</option>
                        <option value="Critical">Critical</option>
                        <option value="Admitted">Admitted</option>
                        <option value="Stable">Stable</option>
                        <option value="Discharged">Discharged</option>
                    </select>

                    <button class="btn btn-primary" id="btn-add-patient">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Patient
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--primary-red)"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        Hospitalized Patients & Blood Demands
                    </div>
                    <span id="patient-count-badge" class="nav-badge" style="background: var(--bg-card-subtle);">Loading...</span>
                </div>
                <div class="table-responsive">
                    <table class="custom-table" id="patients-table">
                        <thead>
                            <tr>
                                <th>Patient ID</th>
                                <th>Patient Name</th>
                                <th>Required Group</th>
                                <th>Units Needed</th>
                                <th>Hospital</th>
                                <th>Contact</th>
                                <th>Status</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="patients-table-body">
                            <tr>
                                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                    Loading patient records...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async loadPatients(search = '', bloodGroup = 'all', status = 'all') {
        try {
            const res = await api.getPatients(search, bloodGroup, status);
            this.patientsList = res.data;
            this.renderTableRows(this.patientsList);
            document.getElementById('patient-count-badge').textContent = `${this.patientsList.length} Patients`;
        } catch (err) {
            app.showToast('Failed to load patients: ' + err.message, 'error');
        }
    },

    renderTableRows(patients) {
        const tbody = document.getElementById('patients-table-body');
        if (!tbody) return;

        if (patients.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        No patients found matching your search.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = patients.map(p => {
            const statusClass = p.status === 'Critical' ? 'status-critical' : (p.status === 'Admitted' ? 'status-admitted' : (p.status === 'Stable' ? 'status-stable' : 'status-completed'));
            return `
                <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--primary-red);">#PAT-${String(p.patient_id).padStart(3, '0')}</td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-main);">${p.name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${p.age} yrs • ${p.gender}</div>
                    </td>
                    <td><span class="blood-badge">${p.blood_group}</span></td>
                    <td><strong>${p.required_units}</strong> Bags</td>
                    <td>
                        <div style="font-weight: 500;">${p.hospital}</div>
                    </td>
                    <td>${p.phone}</td>
                    <td><span class="status-badge ${statusClass}">${p.status}</span></td>
                    <td style="text-align: right;">
                        <div class="action-buttons" style="justify-content: flex-end;">
                            <button class="btn btn-icon-only btn-action-view" title="View Patient Details" onclick="patientsPage.openViewModal(${p.patient_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button class="btn btn-icon-only btn-action-edit" title="Edit Patient" onclick="patientsPage.openFormModal(${p.patient_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="btn btn-icon-only btn-action-delete" title="Delete Patient" onclick="patientsPage.confirmDelete(${p.patient_id}, '${p.name.replace(/'/g, "\\'")}')">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async bindEvents() {
        await this.loadPatients();

        const searchInput = document.getElementById('patient-search-input');
        const bloodFilter = document.getElementById('patient-blood-filter');
        const statusFilter = document.getElementById('patient-status-filter');
        const addBtn = document.getElementById('btn-add-patient');

        const doFilter = () => {
            this.loadPatients(searchInput.value.trim(), bloodFilter.value, statusFilter.value);
        };

        let debounceTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(doFilter, 300);
        });

        bloodFilter.addEventListener('change', doFilter);
        statusFilter.addEventListener('change', doFilter);

        addBtn.addEventListener('click', () => {
            this.openFormModal();
        });
    },

    openFormModal(patientId = null) {
        const isEdit = Boolean(patientId);
        const patient = isEdit ? this.patientsList.find(p => p.patient_id === patientId) : {
            name: '', age: 30, gender: 'Male', blood_group: 'O+', hospital: 'City General Medical Center', phone: '', required_units: 2, status: 'Admitted'
        };

        const modalBody = `
            <form id="form-patient" class="form-grid">
                <div class="form-group full-width">
                    <label class="form-label" for="patient-name">Patient Full Name *</label>
                    <input type="text" id="patient-name" class="form-control" value="${patient.name}" required placeholder="e.g. Robert Williams">
                </div>

                <div class="form-group">
                    <label class="form-label" for="patient-age">Age *</label>
                    <input type="number" id="patient-age" class="form-control" value="${patient.age}" min="0" max="120" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="patient-gender">Gender *</label>
                    <select id="patient-gender" class="form-control" required>
                        <option value="Male" ${patient.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${patient.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${patient.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="patient-blood-group">Blood Group Required *</label>
                    <select id="patient-blood-group" class="form-control" required>
                        <option value="A+" ${patient.blood_group === 'A+' ? 'selected' : ''}>A+</option>
                        <option value="A-" ${patient.blood_group === 'A-' ? 'selected' : ''}>A-</option>
                        <option value="B+" ${patient.blood_group === 'B+' ? 'selected' : ''}>B+</option>
                        <option value="B-" ${patient.blood_group === 'B-' ? 'selected' : ''}>B-</option>
                        <option value="AB+" ${patient.blood_group === 'AB+' ? 'selected' : ''}>AB+</option>
                        <option value="AB-" ${patient.blood_group === 'AB-' ? 'selected' : ''}>AB-</option>
                        <option value="O+" ${patient.blood_group === 'O+' ? 'selected' : ''}>O+</option>
                        <option value="O-" ${patient.blood_group === 'O-' ? 'selected' : ''}>O-</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="patient-units">Required Units *</label>
                    <input type="number" id="patient-units" class="form-control" value="${patient.required_units}" min="1" max="20" required>
                </div>

                <div class="form-group full-width">
                    <label class="form-label" for="patient-hospital">Hospital / Medical Center *</label>
                    <input type="text" id="patient-hospital" class="form-control" value="${patient.hospital}" required placeholder="Hospital name, Ward / Room">
                </div>

                <div class="form-group">
                    <label class="form-label" for="patient-phone">Contact Phone *</label>
                    <input type="text" id="patient-phone" class="form-control" value="${patient.phone}" required placeholder="+1 (555) 000-0000">
                </div>

                <div class="form-group">
                    <label class="form-label" for="patient-status">Clinical Status *</label>
                    <select id="patient-status" class="form-control" required>
                        <option value="Critical" ${patient.status === 'Critical' ? 'selected' : ''}>Critical</option>
                        <option value="Admitted" ${patient.status === 'Admitted' ? 'selected' : ''}>Admitted</option>
                        <option value="Stable" ${patient.status === 'Stable' ? 'selected' : ''}>Stable</option>
                        <option value="Discharged" ${patient.status === 'Discharged' ? 'selected' : ''}>Discharged</option>
                    </select>
                </div>
            </form>
        `;

        app.openModal({
            title: isEdit ? 'Edit Patient Information' : 'Register New Patient',
            body: modalBody,
            confirmText: isEdit ? 'Save Changes' : 'Register Patient',
            onConfirm: async () => {
                const name = document.getElementById('patient-name').value.trim();
                const age = parseInt(document.getElementById('patient-age').value, 10);
                const gender = document.getElementById('patient-gender').value;
                const blood_group = document.getElementById('patient-blood-group').value;
                const required_units = parseInt(document.getElementById('patient-units').value, 10);
                const hospital = document.getElementById('patient-hospital').value.trim();
                const phone = document.getElementById('patient-phone').value.trim();
                const status = document.getElementById('patient-status').value;

                if (!name || !hospital || !phone) {
                    app.showToast('Please fill all required patient details.', 'error');
                    return false;
                }

                const payload = { name, age, gender, blood_group, required_units, hospital, phone, status };

                try {
                    if (isEdit) {
                        await api.updatePatient(patientId, payload);
                        app.showToast('Patient record updated successfully!', 'success');
                    } else {
                        await api.createPatient(payload);
                        app.showToast('Patient registered successfully!', 'success');
                    }
                    this.loadPatients();
                    return true;
                } catch (err) {
                    app.showToast(err.message || 'Operation failed', 'error');
                    return false;
                }
            }
        });
    },

    async openViewModal(patientId) {
        try {
            const res = await api.getPatient(patientId);
            const patient = res.data;

            const requestsHtml = patient.requests && patient.requests.length > 0
                ? patient.requests.map(r => `
                    <tr>
                        <td>#REQ-${String(r.request_id).padStart(3, '0')}</td>
                        <td>${r.request_date}</td>
                        <td><strong>${r.required_units}</strong> Bags</td>
                        <td><span class="status-badge ${r.priority === 'Urgent' ? 'status-urgent' : 'status-normal'}">${r.priority}</span></td>
                        <td><span class="status-badge ${r.status === 'Fulfilled' ? 'status-fulfilled' : (r.status === 'Approved' ? 'status-approved' : 'status-pending')}">${r.status}</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No blood requests submitted yet for this patient.</td></tr>';

            const modalBody = `
                <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-color);">
                    <div class="blood-type-symbol" style="width: 64px; height: 64px; font-size: 1.75rem;">${patient.blood_group}</div>
                    <div>
                        <h3 style="font-size: 1.35rem; color: var(--text-main); margin-bottom: 0.2rem;">${patient.name}</h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">
                            Patient ID: <strong>#PAT-${String(patient.patient_id).padStart(3, '0')}</strong> • ${patient.age} yrs • ${patient.gender}
                        </div>
                        <div style="margin-top: 0.4rem;">
                            <span class="status-badge ${patient.status === 'Critical' ? 'status-critical' : 'status-admitted'}">
                                Clinical Status: ${patient.status}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="form-grid" style="margin-bottom: 1.5rem; font-size: 0.88rem;">
                    <div><span style="color: var(--text-muted);">Hospital:</span> <strong>${patient.hospital}</strong></div>
                    <div><span style="color: var(--text-muted);">Contact:</span> <strong>${patient.phone}</strong></div>
                    <div><span style="color: var(--text-muted);">Required Units:</span> <strong>${patient.required_units} Bags</strong></div>
                    <div><span style="color: var(--text-muted);">Blood Group:</span> <strong style="color: var(--primary-red);">${patient.blood_group}</strong></div>
                </div>

                <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Associated Blood Requests (${patient.requests ? patient.requests.length : 0})</h4>
                <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                    <table class="custom-table" style="font-size: 0.82rem;">
                        <thead>
                            <tr>
                                <th>Request ID</th>
                                <th>Date</th>
                                <th>Units</th>
                                <th>Priority</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${requestsHtml}</tbody>
                    </table>
                </div>
            `;

            app.openModal({
                title: 'Patient Profile & Medical History',
                body: modalBody,
                showConfirm: false,
                cancelText: 'Close'
            });
        } catch (err) {
            app.showToast('Failed to view patient: ' + err.message, 'error');
        }
    },

    confirmDelete(patientId, patientName) {
        app.confirmDialog({
            title: 'Delete Patient Record',
            message: `Are you sure you want to delete patient <strong>${patientName}</strong> (ID: #PAT-${patientId})? This will also remove their blood requests.`,
            confirmText: 'Yes, Delete Patient',
            onConfirm: async () => {
                try {
                    await api.deletePatient(patientId);
                    app.showToast('Patient record deleted successfully', 'success');
                    this.loadPatients();
                } catch (err) {
                    app.showToast('Failed to delete patient: ' + err.message, 'error');
                }
            }
        });
    }
};

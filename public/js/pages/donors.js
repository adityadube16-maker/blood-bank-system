// ============================================================================
// PAGE CONTROLLER: DONOR MANAGEMENT
// ============================================================================

window.donorsPage = {
    donorsList: [],

    async render() {
        return `
            <div class="table-toolbar">
                <div class="table-search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="donor-search-input" placeholder="Search by name, phone, email, or ID...">
                </div>

                <div class="table-filters">
                    <select id="donor-blood-filter" class="select-filter">
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

                    <button class="btn btn-primary" id="btn-add-donor">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Add Donor
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--primary-red)"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        Registered Donors Directory
                    </div>
                    <span id="donor-count-badge" class="nav-badge" style="background: var(--bg-card-subtle);">Loading...</span>
                </div>
                <div class="table-responsive">
                    <table class="custom-table" id="donors-table">
                        <thead>
                            <tr>
                                <th>Donor ID</th>
                                <th>Full Name</th>
                                <th>Blood Group</th>
                                <th>Age / Gender</th>
                                <th>Contact Details</th>
                                <th>Last Donation</th>
                                <th>Eligibility</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="donors-table-body">
                            <tr>
                                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                    Loading donors from relational database...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async loadDonors(search = '', bloodGroup = 'all') {
        try {
            const res = await api.getDonors(search, bloodGroup);
            this.donorsList = res.data;
            this.renderTableRows(this.donorsList);
            document.getElementById('donor-count-badge').textContent = `${this.donorsList.length} Donors`;
        } catch (err) {
            app.showToast('Failed to load donors: ' + err.message, 'error');
        }
    },

    isEligible(lastDonationDate) {
        if (!lastDonationDate) return { eligible: true, text: 'Eligible (First Time)' };
        const last = new Date(lastDonationDate);
        const now = new Date();
        const diffDays = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        if (diffDays >= 90) {
            return { eligible: true, text: 'Eligible to Donate' };
        } else {
            return { eligible: false, text: `Wait ${90 - diffDays}d` };
        }
    },

    renderTableRows(donors) {
        const tbody = document.getElementById('donors-table-body');
        if (!tbody) return;

        if (donors.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        No donors found matching the criteria.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = donors.map(d => {
            const eligibility = this.isEligible(d.last_donation_date);
            return `
                <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--primary-red);">#DNR-${String(d.donor_id).padStart(3, '0')}</td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-main);">${d.name}</div>
                        <div style="font-size: 0.78rem; color: var(--text-muted);">${d.address}</div>
                    </td>
                    <td><span class="blood-badge">${d.blood_group}</span></td>
                    <td>${d.age} yrs • ${d.gender}</td>
                    <td>
                        <div style="font-weight: 600;">${d.phone}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${d.email}</div>
                    </td>
                    <td>${d.last_donation_date || '<span style="color: var(--text-light);">Never</span>'}</td>
                    <td>
                        <span class="status-badge ${eligibility.eligible ? 'status-available' : 'status-low-stock'}" style="font-size: 0.72rem;">
                            ${eligibility.text}
                        </span>
                    </td>
                    <td style="text-align: right;">
                        <div class="action-buttons" style="justify-content: flex-end;">
                            <button class="btn btn-icon-only btn-action-view" title="View Donor Details" onclick="donorsPage.openViewModal(${d.donor_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button class="btn btn-icon-only btn-action-edit" title="Edit Donor" onclick="donorsPage.openFormModal(${d.donor_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="btn btn-icon-only btn-action-delete" title="Delete Donor" onclick="donorsPage.confirmDelete(${d.donor_id}, '${d.name.replace(/'/g, "\\'")}')">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async bindEvents() {
        await this.loadDonors();

        const searchInput = document.getElementById('donor-search-input');
        const bloodFilter = document.getElementById('donor-blood-filter');
        const addBtn = document.getElementById('btn-add-donor');

        let debounceTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.loadDonors(searchInput.value.trim(), bloodFilter.value);
            }, 300);
        });

        bloodFilter.addEventListener('change', () => {
            this.loadDonors(searchInput.value.trim(), bloodFilter.value);
        });

        addBtn.addEventListener('click', () => {
            this.openFormModal();
        });
    },

    openFormModal(donorId = null) {
        const isEdit = Boolean(donorId);
        const donor = isEdit ? this.donorsList.find(d => d.donor_id === donorId) : {
            name: '', age: 25, gender: 'Male', blood_group: 'O+', phone: '', email: '', address: '', last_donation_date: ''
        };

        const modalBody = `
            <form id="form-donor" class="form-grid">
                <div class="form-group full-width">
                    <label class="form-label" for="donor-name">Full Name *</label>
                    <input type="text" id="donor-name" class="form-control" value="${donor.name}" required placeholder="e.g. Johnathan Doe">
                </div>

                <div class="form-group">
                    <label class="form-label" for="donor-age">Age (18-65) *</label>
                    <input type="number" id="donor-age" class="form-control" value="${donor.age}" min="18" max="65" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="donor-gender">Gender *</label>
                    <select id="donor-gender" class="form-control" required>
                        <option value="Male" ${donor.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${donor.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${donor.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="donor-blood-group">Blood Group *</label>
                    <select id="donor-blood-group" class="form-control" required>
                        <option value="A+" ${donor.blood_group === 'A+' ? 'selected' : ''}>A+</option>
                        <option value="A-" ${donor.blood_group === 'A-' ? 'selected' : ''}>A-</option>
                        <option value="B+" ${donor.blood_group === 'B+' ? 'selected' : ''}>B+</option>
                        <option value="B-" ${donor.blood_group === 'B-' ? 'selected' : ''}>B-</option>
                        <option value="AB+" ${donor.blood_group === 'AB+' ? 'selected' : ''}>AB+</option>
                        <option value="AB-" ${donor.blood_group === 'AB-' ? 'selected' : ''}>AB-</option>
                        <option value="O+" ${donor.blood_group === 'O+' ? 'selected' : ''}>O+</option>
                        <option value="O-" ${donor.blood_group === 'O-' ? 'selected' : ''}>O-</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="donor-phone">Phone Number *</label>
                    <input type="text" id="donor-phone" class="form-control" value="${donor.phone}" required placeholder="+1 (555) 000-0000">
                </div>

                <div class="form-group">
                    <label class="form-label" for="donor-email">Email Address *</label>
                    <input type="email" id="donor-email" class="form-control" value="${donor.email}" required placeholder="donor@domain.com">
                </div>

                <div class="form-group">
                    <label class="form-label" for="donor-last-date">Last Donation Date</label>
                    <input type="date" id="donor-last-date" class="form-control" value="${donor.last_donation_date || ''}">
                </div>

                <div class="form-group full-width">
                    <label class="form-label" for="donor-address">Residential Address *</label>
                    <textarea id="donor-address" class="form-control" rows="2" required placeholder="Street address, City, State">${donor.address}</textarea>
                </div>
            </form>
        `;

        app.openModal({
            title: isEdit ? 'Edit Donor Profile' : 'Register New Donor',
            body: modalBody,
            confirmText: isEdit ? 'Save Changes' : 'Register Donor',
            onConfirm: async () => {
                const name = document.getElementById('donor-name').value.trim();
                const age = parseInt(document.getElementById('donor-age').value, 10);
                const gender = document.getElementById('donor-gender').value;
                const blood_group = document.getElementById('donor-blood-group').value;
                const phone = document.getElementById('donor-phone').value.trim();
                const email = document.getElementById('donor-email').value.trim();
                const address = document.getElementById('donor-address').value.trim();
                const last_donation_date = document.getElementById('donor-last-date').value || null;

                if (!name || !phone || !email || !address) {
                    app.showToast('Please fill all required fields.', 'error');
                    return false;
                }

                if (isNaN(age) || age < 18 || age > 65) {
                    app.showToast('Donor age must be between 18 and 65.', 'error');
                    return false;
                }

                const payload = { name, age, gender, blood_group, phone, email, address, last_donation_date };

                try {
                    if (isEdit) {
                        await api.updateDonor(donorId, payload);
                        app.showToast('Donor profile updated successfully!', 'success');
                    } else {
                        await api.createDonor(payload);
                        app.showToast('New donor registered successfully!', 'success');
                    }
                    this.loadDonors();
                    return true;
                } catch (err) {
                    app.showToast(err.message || 'Operation failed', 'error');
                    return false;
                }
            }
        });
    },

    async openViewModal(donorId) {
        try {
            const res = await api.getDonor(donorId);
            const donor = res.data;
            const eligibility = this.isEligible(donor.last_donation_date);

            const donationsHtml = donor.donations && donor.donations.length > 0
                ? donor.donations.map(d => `
                    <tr>
                        <td>#DON-${String(d.donation_id).padStart(3, '0')}</td>
                        <td>${d.donation_date}</td>
                        <td>${d.quantity} Bag (${d.quantity * 450} ml)</td>
                        <td>${d.collection_center}</td>
                        <td><span class="status-badge status-completed">${d.status}</span></td>
                    </tr>
                `).join('')
                : '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No past donation records on file.</td></tr>';

            const modalBody = `
                <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid var(--border-color);">
                    <div class="blood-type-symbol" style="width: 64px; height: 64px; font-size: 1.75rem;">${donor.blood_group}</div>
                    <div>
                        <h3 style="font-size: 1.35rem; color: var(--text-main); margin-bottom: 0.2rem;">${donor.name}</h3>
                        <div style="font-size: 0.85rem; color: var(--text-muted);">
                            Donor ID: <strong>#DNR-${String(donor.donor_id).padStart(3, '0')}</strong> • ${donor.age} yrs • ${donor.gender}
                        </div>
                        <div style="margin-top: 0.4rem;">
                            <span class="status-badge ${eligibility.eligible ? 'status-available' : 'status-low-stock'}">
                                ${eligibility.text}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="form-grid" style="margin-bottom: 1.5rem; font-size: 0.88rem;">
                    <div><span style="color: var(--text-muted);">Phone:</span> <strong>${donor.phone}</strong></div>
                    <div><span style="color: var(--text-muted);">Email:</span> <strong>${donor.email}</strong></div>
                    <div class="full-width"><span style="color: var(--text-muted);">Address:</span> <strong>${donor.address}</strong></div>
                    <div><span style="color: var(--text-muted);">Last Donated:</span> <strong>${donor.last_donation_date || 'None'}</strong></div>
                </div>

                <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 0.75rem;">Blood Donation History (${donor.donations ? donor.donations.length : 0})</h4>
                <div class="table-responsive" style="border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                    <table class="custom-table" style="font-size: 0.82rem;">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Date</th>
                                <th>Quantity</th>
                                <th>Center</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>${donationsHtml}</tbody>
                    </table>
                </div>
            `;

            app.openModal({
                title: 'Donor Information Profile',
                body: modalBody,
                showConfirm: false,
                cancelText: 'Close'
            });
        } catch (err) {
            app.showToast('Failed to view donor: ' + err.message, 'error');
        }
    },

    confirmDelete(donorId, donorName) {
        app.confirmDialog({
            title: 'Delete Donor Record',
            message: `Are you sure you want to permanently delete donor <strong>${donorName}</strong> (ID: #DNR-${donorId})? This will also remove associated donation history via relational cascading.`,
            confirmText: 'Yes, Delete Donor',
            onConfirm: async () => {
                try {
                    await api.deleteDonor(donorId);
                    app.showToast('Donor deleted successfully', 'success');
                    this.loadDonors();
                } catch (err) {
                    app.showToast('Failed to delete donor: ' + err.message, 'error');
                }
            }
        });
    }
};

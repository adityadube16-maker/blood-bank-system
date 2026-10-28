// ============================================================================
// PAGE CONTROLLER: BLOOD DONATION MANAGEMENT
// ============================================================================

window.donationsPage = {
    donationsList: [],
    donorsCache: [],

    async render() {
        return `
            <div class="table-toolbar">
                <div class="table-search-box">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" id="donation-search-input" placeholder="Search by donor name, center, or ID...">
                </div>

                <div class="table-filters">
                    <select id="donation-blood-filter" class="select-filter">
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

                    <button class="btn btn-primary" id="btn-add-donation">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Record Blood Donation
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--primary-red)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0 7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                        Donation Records & Camp Logs
                    </div>
                    <span id="donations-count-badge" class="nav-badge" style="background: var(--bg-card-subtle);">Loading...</span>
                </div>
                <div class="table-responsive">
                    <table class="custom-table" id="donations-table">
                        <thead>
                            <tr>
                                <th>Donation ID</th>
                                <th>Donor Name</th>
                                <th>Blood Group</th>
                                <th>Donation Date</th>
                                <th>Volume (Bags)</th>
                                <th>Collection Center</th>
                                <th>Status</th>
                                <th style="text-align: right;">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="donations-table-body">
                            <tr>
                                <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">
                                    Loading donations from database...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },

    async loadDonations(search = '', bloodGroup = 'all') {
        try {
            const res = await api.getDonations(search, bloodGroup);
            this.donationsList = res.data;
            this.renderTableRows(this.donationsList);
            document.getElementById('donations-count-badge').textContent = `${this.donationsList.length} Records`;
        } catch (err) {
            app.showToast('Failed to load donations: ' + err.message, 'error');
        }
    },

    async loadDonorsCache() {
        if (this.donorsCache.length === 0) {
            try {
                const res = await api.getDonors();
                this.donorsCache = res.data;
            } catch (e) {
                console.error('Failed to load donors cache', e);
            }
        }
    },

    renderTableRows(donations) {
        const tbody = document.getElementById('donations-table-body');
        if (!tbody) return;

        if (donations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                        No blood donations found.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = donations.map(d => {
            const statusClass = d.status === 'Completed' ? 'status-completed' : (d.status === 'Under Testing' ? 'status-under-testing' : 'status-discarded');
            return `
                <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--primary-red);">#DON-${String(d.donation_id).padStart(3, '0')}</td>
                    <td>
                        <div style="font-weight: 700; color: var(--text-main);">${d.donor_name}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${d.donor_phone || 'Ref: Donor #' + d.donor_id}</div>
                    </td>
                    <td><span class="blood-badge">${d.blood_group}</span></td>
                    <td><strong>${d.donation_date}</strong></td>
                    <td>${d.quantity} Bag (${d.quantity * 450} ml)</td>
                    <td>
                        <div style="font-weight: 500;">${d.collection_center}</div>
                    </td>
                    <td><span class="status-badge ${statusClass}">${d.status}</span></td>
                    <td style="text-align: right;">
                        <div class="action-buttons" style="justify-content: flex-end;">
                            <button class="btn btn-icon-only btn-action-edit" title="Edit Donation" onclick="donationsPage.openFormModal(${d.donation_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                            </button>
                            <button class="btn btn-icon-only btn-action-delete" title="Delete Record" onclick="donationsPage.confirmDelete(${d.donation_id})">
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async bindEvents() {
        await this.loadDonorsCache();
        await this.loadDonations();

        const searchInput = document.getElementById('donation-search-input');
        const bloodFilter = document.getElementById('donation-blood-filter');
        const addBtn = document.getElementById('btn-add-donation');

        let debounceTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                this.loadDonations(searchInput.value.trim(), bloodFilter.value);
            }, 300);
        });

        bloodFilter.addEventListener('change', () => {
            this.loadDonations(searchInput.value.trim(), bloodFilter.value);
        });

        addBtn.addEventListener('click', () => {
            this.openFormModal();
        });
    },

    async openFormModal(donationId = null) {
        await this.loadDonorsCache();
        const isEdit = Boolean(donationId);
        const donation = isEdit ? this.donationsList.find(d => d.donation_id === donationId) : {
            donor_id: this.donorsCache[0]?.donor_id || '',
            blood_group: this.donorsCache[0]?.blood_group || 'O+',
            donation_date: new Date().toISOString().split('T')[0],
            quantity: 1,
            collection_center: 'Central Red Cross Center',
            status: 'Completed'
        };

        const donorOptions = this.donorsCache.map(d => `
            <option value="${d.donor_id}" data-blood="${d.blood_group}" ${d.donor_id == donation.donor_id ? 'selected' : ''}>
                ${d.name} (${d.blood_group}) - ID: #${d.donor_id}
            </option>
        `).join('');

        const modalBody = `
            <form id="form-donation" class="form-grid">
                <div class="form-group full-width">
                    <label class="form-label" for="donation-donor-id">Select Donor (Foreign Key) *</label>
                    <select id="donation-donor-id" class="form-control" required>
                        ${donorOptions}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label" for="donation-blood-group">Blood Group *</label>
                    <input type="text" id="donation-blood-group" class="form-control" value="${donation.blood_group}" readonly style="background: #f1f5f9; font-weight: 700;">
                </div>

                <div class="form-group">
                    <label class="form-label" for="donation-quantity">Quantity (450ml Bags) *</label>
                    <input type="number" id="donation-quantity" class="form-control" value="${donation.quantity}" min="1" max="5" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="donation-date">Donation Date *</label>
                    <input type="date" id="donation-date" class="form-control" value="${donation.donation_date}" required>
                </div>

                <div class="form-group">
                    <label class="form-label" for="donation-status">Status *</label>
                    <select id="donation-status" class="form-control" required>
                        <option value="Completed" ${donation.status === 'Completed' ? 'selected' : ''}>Completed (Adds to Inventory)</option>
                        <option value="Under Testing" ${donation.status === 'Under Testing' ? 'selected' : ''}>Under Testing</option>
                        <option value="Discarded" ${donation.status === 'Discarded' ? 'selected' : ''}>Discarded</option>
                    </select>
                </div>

                <div class="form-group full-width">
                    <label class="form-label" for="donation-center">Collection Center / Camp *</label>
                    <input type="text" id="donation-center" class="form-control" value="${donation.collection_center}" required placeholder="e.g. Metro Mobile Bus, Central Blood Bank">
                </div>
            </form>
        `;

        app.openModal({
            title: isEdit ? 'Edit Donation Record' : 'Record New Blood Donation',
            body: modalBody,
            confirmText: isEdit ? 'Save Changes' : 'Record & Sync Inventory',
            onConfirm: async () => {
                const donor_id = document.getElementById('donation-donor-id').value;
                const blood_group = document.getElementById('donation-blood-group').value;
                const donation_date = document.getElementById('donation-date').value;
                const quantity = parseInt(document.getElementById('donation-quantity').value, 10);
                const collection_center = document.getElementById('donation-center').value.trim();
                const status = document.getElementById('donation-status').value;

                if (!donor_id || !donation_date || !collection_center) {
                    app.showToast('Please fill all required donation fields.', 'error');
                    return false;
                }

                const payload = { donor_id, blood_group, donation_date, quantity, collection_center, status };

                try {
                    if (isEdit) {
                        await api.updateDonation(donationId, payload);
                        app.showToast('Donation record updated successfully!', 'success');
                    } else {
                        await api.createDonation(payload);
                        app.showToast(`Donation recorded! +${quantity} bag(s) synced to ${blood_group} inventory.`, 'success');
                    }
                    if (app.currentPage === 'dashboard') {
                        app.navigateTo('dashboard');
                    } else if (app.currentPage === 'donations') {
                        this.loadDonations();
                    } else if (app.currentPage === 'inventory' && window.inventoryPage) {
                        window.inventoryPage.loadInventory();
                    }
                    return true;
                } catch (err) {
                    app.showToast(err.message || 'Operation failed', 'error');
                    return false;
                }
            }
        });

        // Auto update blood group when donor changes
        setTimeout(() => {
            const donorSelect = document.getElementById('donation-donor-id');
            const bgInput = document.getElementById('donation-blood-group');
            if (donorSelect && bgInput) {
                donorSelect.addEventListener('change', () => {
                    const selectedOpt = donorSelect.options[donorSelect.selectedIndex];
                    bgInput.value = selectedOpt.getAttribute('data-blood') || 'O+';
                });
            }
        }, 100);
    },

    confirmDelete(donationId) {
        app.confirmDialog({
            title: 'Delete Donation Record',
            message: `Are you sure you want to delete blood donation record <strong>#DON-${donationId}</strong>? Note: This does not automatically deduct past allocated inventory.`,
            confirmText: 'Yes, Delete Record',
            onConfirm: async () => {
                try {
                    await api.deleteDonation(donationId);
                    app.showToast('Donation record deleted', 'success');
                    this.loadDonations();
                } catch (err) {
                    app.showToast('Failed to delete donation: ' + err.message, 'error');
                }
            }
        });
    }
};

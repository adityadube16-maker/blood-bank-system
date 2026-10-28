// ============================================================================
// PAGE CONTROLLER: DASHBOARD
// ============================================================================

window.dashboardPage = {
    async render() {
        return `
            <div id="dashboard-loading" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <div class="pulse-indicator" style="margin: 0 auto 1rem; width: 14px; height: 14px;"></div>
                Loading Real-Time Blood Bank Analytics...
            </div>
            <div id="dashboard-content" style="display: none;"></div>
        `;
    },

    async bindEvents() {
        try {
            const res = await api.getDashboard();
            const { summary, inventory, recentDonations, recentRequests } = res.data;

            const container = document.getElementById('dashboard-content');
            const loader = document.getElementById('dashboard-loading');

            container.innerHTML = `
                <!-- 1. Top Summary KPI Cards -->
                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Total Donors</p>
                            <div class="kpi-value">${summary.totalDonors}</div>
                            <div class="kpi-meta"><span style="color: var(--status-success); font-weight:700;">+2</span> registered this month</div>
                        </div>
                        <div class="kpi-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Total Patients</p>
                            <div class="kpi-value">${summary.totalPatients}</div>
                            <div class="kpi-meta">Active hospital cases</div>
                        </div>
                        <div class="kpi-icon" style="background: #e0f2fe; color: #0284c7;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Available Units</p>
                            <div class="kpi-value" style="color: var(--primary-red);">${summary.availableUnits}</div>
                            <div class="kpi-meta">Across 8 blood groups</div>
                        </div>
                        <div class="kpi-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Pending Requests</p>
                            <div class="kpi-value" style="color: #b45309;">${summary.pendingRequests}</div>
                            <div class="kpi-meta"><span style="color: #dc2626; font-weight:700;">Needs Immediate Action</span></div>
                        </div>
                        <div class="kpi-icon" style="background: #fef3c7; color: #d97706;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        </div>
                    </div>
                </div>

                <!-- Quick Action Dispatch Banner -->
                <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, #ffffff, #fff5f5); border-left: 4px solid var(--primary-red);">
                    <div class="card-body" style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
                        <div>
                            <div style="font-weight: 800; font-size: 1.05rem; color: var(--text-main); display: flex; align-items: center; gap: 0.5rem;">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" color="var(--primary-red)"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                                Fast Actions & Dispatch Center
                            </div>
                            <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 0.2rem;">
                                Quickly log new donations or create hospital urgent blood orders from anywhere
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                            <button class="btn btn-primary" onclick="app.openNewDonationModal()">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                + Record Blood Donation
                            </button>
                            <button class="btn btn-secondary" style="border-color: #93c5fd; color: #1d4ed8; background: #eff6ff;" onclick="app.openNewRequestModal()">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                + Submit Blood Request
                            </button>
                            <button class="btn btn-secondary" onclick="donorsPage.openFormModal()">
                                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                                + Add Donor
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 2. Blood Group Availability Overview -->
                <div class="card" style="margin-bottom: 2rem;">
                    <div class="card-header">
                        <div class="card-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" color="var(--primary-red)"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                            Blood Group Availability Overview
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="app.navigateTo('inventory')">
                            Manage Inventory &rarr;
                        </button>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem;">
                            ${inventory.map(item => {
                                const fillClass = item.available_units >= 10 ? 'fill-available' : (item.available_units > 0 ? 'fill-low' : 'fill-empty');
                                const statusBadgeClass = item.status === 'Available' ? 'status-available' : (item.status === 'Low Stock' ? 'status-low-stock' : 'status-out-of-stock');
                                const percent = Math.min(100, Math.round((item.available_units / 40) * 100));
                                return `
                                    <div style="background: var(--bg-page); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; text-align: center;">
                                        <div class="blood-badge" style="font-size: 1.1rem; padding: 0.35rem 0.85rem; margin-bottom: 0.5rem;">${item.blood_group}</div>
                                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-main);">${item.available_units} <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">Units</span></div>
                                        <div class="stock-meter-bar" style="height: 6px; margin: 0.6rem 0;">
                                            <div class="stock-meter-fill ${fillClass}" style="width: ${percent}%;"></div>
                                        </div>
                                        <span class="status-badge ${statusBadgeClass}" style="font-size: 0.65rem; padding: 0.15rem 0.5rem;">${item.status}</span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <!-- 3. Interactive Charts Grid -->
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-card-header">
                            <h3>Blood Units Stock Distribution</h3>
                            <span class="status-badge status-available">Live Database</span>
                        </div>
                        <div class="chart-container">
                            <canvas id="chart-dashboard-inventory"></canvas>
                        </div>
                    </div>

                    <div class="chart-card">
                        <div class="chart-card-header">
                            <h3>Donations vs Patient Requests (6-Month Trend)</h3>
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Monthly Inflow/Outflow</span>
                        </div>
                        <div class="chart-container">
                            <canvas id="chart-dashboard-trends"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 4. Recent Activities Tables Grid -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 1.5rem;">
                    <!-- Recent Donations -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--primary-red)"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                Recent Blood Donations
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="app.navigateTo('donations')">View All</button>
                        </div>
                        <div class="table-responsive">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Donor</th>
                                        <th>Group</th>
                                        <th>Units</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentDonations.map(d => `
                                        <tr>
                                            <td><strong>${d.donor_name}</strong></td>
                                            <td><span class="blood-badge sm">${d.blood_group}</span></td>
                                            <td>${d.quantity} Bag</td>
                                            <td>${d.donation_date}</td>
                                            <td><span class="status-badge ${d.status === 'Completed' ? 'status-completed' : 'status-under-testing'}">${d.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Recent Blood Requests -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="#2563eb"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                Recent Blood Requests
                            </div>
                            <button class="btn btn-secondary btn-sm" onclick="app.navigateTo('requests')">View All</button>
                        </div>
                        <div class="table-responsive">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Hospital</th>
                                        <th>Group</th>
                                        <th>Priority</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${recentRequests.map(r => `
                                        <tr>
                                            <td><strong>${r.patient_name}</strong></td>
                                            <td style="font-size: 0.8rem; color: var(--text-muted);">${r.hospital}</td>
                                            <td><span class="blood-badge sm">${r.blood_group}</span></td>
                                            <td><span class="status-badge ${r.priority === 'Urgent' ? 'status-urgent' : (r.priority === 'High' ? 'priority-high' : 'status-normal')}">${r.priority}</span></td>
                                            <td><span class="status-badge ${r.status === 'Fulfilled' ? 'status-fulfilled' : (r.status === 'Approved' ? 'status-approved' : (r.status === 'Rejected' ? 'status-rejected' : 'status-pending'))}">${r.status}</span></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;

            loader.style.display = 'none';
            container.style.display = 'block';

            // Render Charts
            charts.renderInventoryChart('chart-dashboard-inventory', inventory);
            charts.renderTrendsChart('chart-dashboard-trends');

        } catch (err) {
            console.error('Dashboard load error:', err);
            app.showToast('Failed to load dashboard metrics: ' + err.message, 'error');
        }
    }
};

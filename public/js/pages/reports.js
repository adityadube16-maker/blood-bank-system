// ============================================================================
// PAGE CONTROLLER: REPORTS & ANALYTICS
// ============================================================================

window.reportsPage = {
    async render() {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-main);">Comprehensive System Reports & Audit</h3>
                    <p style="font-size: 0.82rem; color: var(--text-muted);">Analytical summary of blood inventory, donor demographics, and hospital demand fulfillment</p>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-secondary btn-sm" onclick="window.print()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                        Print Official Report
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="reportsPage.loadReports()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        Recalculate Statistics
                    </button>
                </div>
            </div>

            <div id="reports-loading" style="text-align: center; padding: 3rem; color: var(--text-muted);">
                <div class="pulse-indicator" style="margin: 0 auto 1rem;"></div>
                Aggregating clinical reports and records...
            </div>

            <div id="reports-content" style="display: none;"></div>
        `;
    },

    async loadReports() {
        try {
            const res = await api.getReports();
            const data = res.data;

            const container = document.getElementById('reports-content');
            const loader = document.getElementById('reports-loading');

            const totalStock = data.inventory.reduce((a, b) => a + b.available_units, 0);
            const totalDonations = data.donationsByGroup.reduce((a, b) => a + b.total_units, 0);
            const totalRequestsUnits = data.requestsByStatus.reduce((a, b) => a + b.total_units, 0);
            const fulfilledUnits = data.requestsByStatus.find(s => s.status === 'Fulfilled')?.total_units || 0;
            const fulfillmentRate = totalRequestsUnits > 0 ? Math.round((fulfilledUnits / totalRequestsUnits) * 100) : 100;

            container.innerHTML = `
                <!-- 1. Executive Summary Strip -->
                <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-bottom: 2rem;">
                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Total Stock on Hand</p>
                            <div class="kpi-value" style="color: var(--primary-red);">${totalStock}</div>
                            <div class="kpi-meta">Standard blood bags</div>
                        </div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Units Collected</p>
                            <div class="kpi-value" style="color: #059669;">${totalDonations}</div>
                            <div class="kpi-meta">From verified donors</div>
                        </div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Demand Fulfillment</p>
                            <div class="kpi-value" style="color: #2563eb;">${fulfillmentRate}%</div>
                            <div class="kpi-meta">${fulfilledUnits} of ${totalRequestsUnits} units supplied</div>
                        </div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-info">
                            <p>Donor Registrations</p>
                            <div class="kpi-value">${data.donorsByGroup.reduce((a, b) => a + b.count, 0)}</div>
                            <div class="kpi-meta">Active blood donors</div>
                        </div>
                    </div>
                </div>

                <!-- 2. Charts Section -->
                <div class="charts-grid" style="margin-bottom: 2rem;">
                    <div class="chart-card">
                        <div class="chart-card-header">
                            <h3>Blood Stock Proportion by Group</h3>
                            <span class="status-badge status-available">Inventory Share</span>
                        </div>
                        <div class="chart-container">
                            <canvas id="chart-reports-doughnut"></canvas>
                        </div>
                    </div>

                    <div class="chart-card">
                        <div class="chart-card-header">
                            <h3>Hospital Demand Analysis</h3>
                            <span class="status-badge status-normal">Demand In Units</span>
                        </div>
                        <div class="chart-container">
                            <canvas id="chart-reports-hospital"></canvas>
                        </div>
                    </div>
                </div>

                <!-- 3. Tabular Summaries Section -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(460px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <!-- Blood Inventory Summary Table -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">Blood Inventory Reserve Table</div>
                            <span class="blood-badge sm">8 Groups</span>
                        </div>
                        <div class="table-responsive">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Blood Group</th>
                                        <th>Available (Bags)</th>
                                        <th>Volume (mL)</th>
                                        <th>Status</th>
                                        <th>Last Calibration</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.inventory.map(i => `
                                        <tr>
                                            <td><span class="blood-badge">${i.blood_group}</span></td>
                                            <td><strong>${i.available_units}</strong></td>
                                            <td>${i.available_units * 450} mL</td>
                                            <td><span class="status-badge ${i.status === 'Available' ? 'status-available' : (i.status === 'Low Stock' ? 'status-low-stock' : 'status-out-of-stock')}">${i.status}</span></td>
                                            <td style="font-size: 0.78rem; color: var(--text-muted);">${i.last_updated.substring(0, 16)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Donor Demographic Breakdown -->
                    <div class="card">
                        <div class="card-header">
                            <div class="card-title">Donor Statistics & Demographics</div>
                            <span class="nav-badge">Roster</span>
                        </div>
                        <div class="table-responsive">
                            <table class="custom-table">
                                <thead>
                                    <tr>
                                        <th>Category</th>
                                        <th>Segment</th>
                                        <th>Registered Donors</th>
                                        <th>% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.donorsByGender.map(g => {
                                        const total = data.donorsByGender.reduce((a, b) => a + b.count, 0);
                                        const pct = Math.round((g.count / total) * 100);
                                        return `
                                            <tr>
                                                <td style="color: var(--text-muted);">Gender</td>
                                                <td><strong>${g.gender}</strong></td>
                                                <td>${g.count} Donors</td>
                                                <td>${pct}%</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    ${data.donorsByGroup.slice(0, 4).map(bg => {
                                        return `
                                            <tr>
                                                <td style="color: var(--text-muted);">Blood Type</td>
                                                <td><span class="blood-badge sm">${bg.blood_group}</span></td>
                                                <td>${bg.count} Donors</td>
                                                <td>${Math.round((bg.count / 10) * 100)}%</td>
                                            </tr>
                                        `;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 4. Hospital Fulfillment Matrix -->
                <div class="card">
                    <div class="card-header">
                        <div class="card-title">Hospital Blood Dispatch Demand Matrix</div>
                        <span class="status-badge status-fulfilled">Active Facilities</span>
                    </div>
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Hospital / Medical Institution</th>
                                    <th>Total Requisitions</th>
                                    <th>Total Units Requested</th>
                                    <th>Estimated Volume</th>
                                    <th>Emergency Support Level</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.hospitalDemands.map(h => `
                                    <tr>
                                        <td><strong>${h.hospital}</strong></td>
                                        <td>${h.total_requests} Orders</td>
                                        <td><strong style="color: var(--primary-red);">${h.total_units_needed}</strong> Bags</td>
                                        <td>${h.total_units_needed * 450} mL</td>
                                        <td><span class="status-badge status-available">Priority Partner</span></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            loader.style.display = 'none';
            container.style.display = 'block';

            // Initialize Charts
            charts.renderDistributionDoughnut('chart-reports-doughnut', data.inventory);
            charts.renderHospitalDemandChart('chart-reports-hospital', data.hospitalDemands);

        } catch (err) {
            console.error('Reports load error:', err);
            app.showToast('Failed to generate reports: ' + err.message, 'error');
        }
    },

    async bindEvents() {
        await this.loadReports();
    }
};

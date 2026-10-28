// ============================================================================
// PAGE CONTROLLER: BLOOD INVENTORY
// ============================================================================

window.inventoryPage = {
    inventoryList: [],

    async render() {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
                <div>
                    <h3 style="font-size: 1.2rem; font-weight: 800; color: var(--text-main);">Blood Inventory & Cold Storage</h3>
                    <p style="font-size: 0.82rem; color: var(--text-muted);">Real-time stock levels of processed whole blood and components (450ml units)</p>
                </div>
                <div style="display: flex; gap: 0.75rem;">
                    <button class="btn btn-secondary btn-sm" onclick="inventoryPage.loadInventory()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                        Refresh Stock
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="inventoryPage.openAdjustModal()">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Manual Stock Adjustment
                    </button>
                </div>
            </div>

            <!-- Total Units Summary Card -->
            <div class="kpi-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-bottom: 2rem;">
                <div class="kpi-card" style="padding: 1.25rem;">
                    <div class="kpi-info">
                        <p>Total Inventory</p>
                        <div class="kpi-value" id="inv-total-units">--</div>
                        <div class="kpi-meta">Standard blood bags on shelf</div>
                    </div>
                </div>
                <div class="kpi-card" style="padding: 1.25rem;">
                    <div class="kpi-info">
                        <p>Available Groups</p>
                        <div class="kpi-value" id="inv-available-count" style="color: var(--status-success);">--</div>
                        <div class="kpi-meta">&ge; 10 units safe reserve</div>
                    </div>
                </div>
                <div class="kpi-card" style="padding: 1.25rem;">
                    <div class="kpi-info">
                        <p>Low Stock Groups</p>
                        <div class="kpi-value" id="inv-low-count" style="color: var(--status-warning);">--</div>
                        <div class="kpi-meta">&lt; 10 units urgent replenishment</div>
                    </div>
                </div>
                <div class="kpi-card" style="padding: 1.25rem;">
                    <div class="kpi-info">
                        <p>Critical Out of Stock</p>
                        <div class="kpi-value" id="inv-empty-count" style="color: var(--status-danger);">--</div>
                        <div class="kpi-meta">0 units reserve</div>
                    </div>
                </div>
            </div>

            <!-- 8 Blood Groups Grid -->
            <div class="inventory-grid" id="inventory-cards-container">
                <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
                    Loading blood inventory from database...
                </div>
            </div>

            <!-- Visual Legend & Explanation -->
            <div class="card" style="margin-top: 1rem; background: #fafbfc;">
                <div class="card-body" style="display: flex; align-items: center; justify-content: space-around; flex-wrap: wrap; gap: 1rem; font-size: 0.85rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="status-badge status-available">Available</span>
                        <span style="color: var(--text-muted);">&ge; 10 units in cold storage</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="status-badge status-low-stock">Low Stock</span>
                        <span style="color: var(--text-muted);">1 &ndash; 9 units available</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <span class="status-badge status-out-of-stock">Out of Stock</span>
                        <span style="color: var(--text-muted);">0 units &ndash; Immediate donor dispatch needed</span>
                    </div>
                </div>
            </div>
        `;
    },

    async loadInventory() {
        try {
            const res = await api.getInventory();
            this.inventoryList = res.data;
            this.renderCards(this.inventoryList);

            // Compute summary metrics
            const totalUnits = this.inventoryList.reduce((acc, cur) => acc + cur.available_units, 0);
            const availableCount = this.inventoryList.filter(i => i.status === 'Available').length;
            const lowCount = this.inventoryList.filter(i => i.status === 'Low Stock').length;
            const emptyCount = this.inventoryList.filter(i => i.status === 'Out of Stock').length;

            document.getElementById('inv-total-units').textContent = totalUnits;
            document.getElementById('inv-available-count').textContent = `${availableCount} / 8`;
            document.getElementById('inv-low-count').textContent = `${lowCount} / 8`;
            document.getElementById('inv-empty-count').textContent = `${emptyCount} / 8`;

        } catch (err) {
            app.showToast('Failed to load blood inventory: ' + err.message, 'error');
        }
    },

    renderCards(inventory) {
        const container = document.getElementById('inventory-cards-container');
        if (!container) return;

        container.innerHTML = inventory.map(item => {
            const fillClass = item.available_units >= 10 ? 'fill-available' : (item.available_units > 0 ? 'fill-low' : 'fill-empty');
            const statusBadgeClass = item.status === 'Available' ? 'status-available' : (item.status === 'Low Stock' ? 'status-low-stock' : 'status-out-of-stock');
            const percent = Math.min(100, Math.round((item.available_units / 40) * 100));

            return `
                <div class="blood-card">
                    <div class="blood-card-top">
                        <div class="blood-type-symbol">${item.blood_group}</div>
                        <div style="text-align: right;">
                            <div class="blood-card-units">${item.available_units} <span>Units</span></div>
                            <span class="status-badge ${statusBadgeClass}" style="margin-top: 0.35rem;">${item.status}</span>
                        </div>
                    </div>

                    <div style="font-size: 0.78rem; color: var(--text-muted); display: flex; justify-content: space-between;">
                        <span>Cold Storage Capacity</span>
                        <strong>${percent}%</strong>
                    </div>

                    <div class="stock-meter-bar">
                        <div class="stock-meter-fill ${fillClass}" style="width: ${percent}%;"></div>
                    </div>

                    <div class="blood-card-footer">
                        <span>Last Updated: <strong>${item.last_updated.substring(0, 16)}</strong></span>
                        <button class="btn btn-secondary btn-sm" style="padding: 0.2rem 0.5rem; font-size: 0.75rem;" onclick="inventoryPage.openAdjustModal('${item.blood_group}', ${item.available_units})">
                            Adjust
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    async bindEvents() {
        await this.loadInventory();
    },

    openAdjustModal(preselectedGroup = 'A+', currentUnits = 10) {
        const optionsHtml = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
            .map(bg => `<option value="${bg}" ${bg === preselectedGroup ? 'selected' : ''}>${bg}</option>`)
            .join('');

        const modalBody = `
            <form id="form-adjust-inventory">
                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label" for="adjust-blood-group">Blood Group</label>
                    <select id="adjust-blood-group" class="form-control">
                        ${optionsHtml}
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 1.25rem;">
                    <label class="form-label" for="adjust-units">New Available Units *</label>
                    <input type="number" id="adjust-units" class="form-control" value="${currentUnits}" min="0" max="500" required>
                    <small style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.25rem;">
                        Status automatically recalculates: &ge;10 = Available, 1-9 = Low Stock, 0 = Out of Stock
                    </small>
                </div>

                <div class="form-group">
                    <label class="form-label" for="adjust-reason">Audit / Adjustment Reason</label>
                    <input type="text" id="adjust-reason" class="form-control" placeholder="e.g. Physical inventory audit / stock verification">
                </div>
            </form>
        `;

        app.openModal({
            title: `Adjust Stock for Blood Group`,
            body: modalBody,
            confirmText: 'Update Stock',
            onConfirm: async () => {
                const group = document.getElementById('adjust-blood-group').value;
                const units = parseInt(document.getElementById('adjust-units').value, 10);

                if (isNaN(units) || units < 0) {
                    app.showToast('Please enter a valid non-negative number of units.', 'error');
                    return false;
                }

                try {
                    await api.updateInventory(group, units);
                    app.showToast(`Blood stock for ${group} updated to ${units} units!`, 'success');
                    this.loadInventory();
                    return true;
                } catch (err) {
                    app.showToast('Failed to update stock: ' + err.message, 'error');
                    return false;
                }
            }
        });
    }
};

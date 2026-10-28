// ============================================================================
// PAGE CONTROLLER: DATABASE DESIGN & SCHEMA DEMONSTRATION
// Demonstrates Relational Schema, Visual ERD, Raw Table Inspector & SQL Export
// ============================================================================

window.schemaPage = {
    schemaData: null,
    currentTable: 'Donors',

    async render() {
        return `
            <!-- Schema Header Banner -->
            <div class="schema-overview-banner">
                <div class="schema-banner-text">
                    <h3>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.48 2 2 4.02 2 6.5v11C2 20 6.5 22 12 22s10-2 10-4.5v-11C22 4 17.5 2 12 2z"/><ellipse cx="12" cy="6.5" rx="10" ry="4.5"/><path d="M2 12c0 2.5 4.5 4.5 10 4.5s10-2 10-4.5"/></svg>
                        Relational Database Architecture & ERD
                    </h3>
                    <p>
                        Designed with 3NF relational normalization, strict Foreign Key referential integrity, and automated trigger logic. Backed by MySQL 8.0 (InnoDB) with SQLite fallback and live introspection.
                    </p>
                </div>
                <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                    <a href="/api/mysql.sql" download="blood_bank_mysql.sql" class="btn btn-primary btn-sm" style="background: #2563eb; color: #ffffff; border: none; box-shadow: none;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download MySQL (.sql)
                    </a>
                    <a href="/api/schema.sql" download="blood_bank_schema.sql" class="btn btn-primary btn-sm" style="background: #ffffff; color: #0f172a; box-shadow: none;">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Download SQLite (.sql)
                    </a>
                    <button class="btn btn-secondary btn-sm" onclick="schemaPage.resetSeedData()" style="background: rgba(255,255,255,0.15); color: white; border-color: rgba(255,255,255,0.3);">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        Reset Seed Data
                    </button>
                </div>
            </div>

            <!-- Database Integration Live Status Card -->
            <div class="card" style="margin-bottom: 2.5rem; background: #ffffff; border-left: 4px solid #10b981;">
                <div class="card-body" style="padding: 1.25rem 1.75rem;">
                    <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.65rem;">
                            <span style="width: 10px; height: 10px; border-radius: 50%; background: #10b981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);"></span>
                            <h4 style="font-size: 1.1rem; font-weight: 800; color: var(--text-main);" id="db-integration-engine">Live Database: MySQL 8.0</h4>
                        </div>
                        <span class="status-badge status-available" id="db-integration-status">Active Connection</span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.85rem;">
                        <div style="background: var(--bg-card-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Host / Port</div>
                            <div style="font-weight: 700; color: var(--text-main);" id="db-integration-host">localhost:3306</div>
                        </div>
                        <div style="background: var(--bg-card-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Active Schema</div>
                            <div style="font-weight: 700; color: var(--primary-red);" id="db-integration-name">blood_bank_db</div>
                        </div>
                        <div style="background: var(--bg-card-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Driver / Integration</div>
                            <div style="font-weight: 700; color: var(--text-main);" id="db-integration-driver">mysql2 Connection Pool</div>
                        </div>
                        <div style="background: var(--bg-card-subtle); padding: 0.75rem 1rem; border-radius: var(--radius-md);">
                            <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Integrity Standard</div>
                            <div style="font-weight: 700; color: var(--status-success);">3NF Relational + Cascades</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 1. Visual Entity-Relationship Diagram (ERD) Cards -->
            <div style="margin-bottom: 2.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <div>
                        <h4 style="font-size: 1.15rem; font-weight: 800; color: var(--text-main);">Entity-Relationship Diagram (ERD Schema)</h4>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">Visual mapping of tables, primary keys (PK), foreign keys (FK), and field types</p>
                    </div>
                    <span class="nav-badge" style="background: var(--bg-card-subtle);">6 Relational Tables</span>
                </div>
                <div class="erd-container" id="erd-cards-container">
                    <div style="grid-column: 1 / -1; text-align: center; padding: 2rem; color: var(--text-muted);">
                        Introspecting database schema...
                    </div>
                </div>
            </div>

            <!-- 2. Relational Linkages & Cardinality Explanation -->
            <div class="erd-relations-box">
                <h4 style="font-size: 1.05rem; font-weight: 800; margin-bottom: 0.5rem; color: var(--text-main);">
                    Foreign Key Relationships & Referential Integrity Rules
                </h4>
                <p style="font-size: 0.82rem; color: var(--text-muted); margin-bottom: 1.25rem;">
                    How data integrity and associations are maintained across tables in the relational engine:
                </p>

                <div id="erd-relationships-list">
                    <!-- Populated dynamically -->
                </div>
            </div>

            <!-- 3. Live Database Table Inspector (Raw Records Viewer) -->
            <div class="card" style="margin-bottom: 2.5rem;">
                <div class="card-header" style="flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <div class="card-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--primary-red)"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
                            Live Table Inspector (Direct Relational Engine View)
                        </div>
                        <p style="font-size: 0.78rem; color: var(--text-muted);">Browse live MySQL & Relational database records with schema types and active values</p>
                    </div>

                    <!-- Table Selection Tabs -->
                    <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;" id="table-inspector-tabs">
                        <button class="btn btn-secondary btn-sm" onclick="schemaPage.switchTable('Donors')">Donors</button>
                        <button class="btn btn-secondary btn-sm" onclick="schemaPage.switchTable('Patients')">Patients</button>
                        <button class="btn btn-secondary btn-sm" onclick="schemaPage.switchTable('Blood_Inventory')">Blood_Inventory</button>
                        <button class="btn btn-secondary btn-sm" onclick="schemaPage.switchTable('Blood_Donations')">Blood_Donations</button>
                        <button class="btn btn-secondary btn-sm" onclick="schemaPage.switchTable('Blood_Requests')">Blood_Requests</button>
                        <button class="btn btn-secondary btn-sm" onclick="schemaPage.switchTable('Users')">Users</button>
                    </div>
                </div>

                <div class="table-responsive">
                    <table class="custom-table" id="inspector-table">
                        <thead id="inspector-table-head">
                            <tr><th>Loading...</th></tr>
                        </thead>
                        <tbody id="inspector-table-body">
                            <tr><td style="text-align: center; padding: 2rem;">Loading raw records...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 4. Complete SQL Schema Code Viewer -->
            <div class="sql-viewer-container">
                <div class="sql-header">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                        <span>schema.sql &bull; ANSI SQL / SQLite / MySQL DDL Definition</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary btn-sm" style="background: rgba(255,255,255,0.1); color: white; border: none;" onclick="schemaPage.copySql()">
                            Copy SQL
                        </button>
                        <a href="/api/schema.sql" download="schema.sql" class="btn btn-primary btn-sm" style="font-size: 0.75rem;">
                            Download .sql
                        </a>
                    </div>
                </div>
                <div class="sql-code-box" id="sql-code-display">
                    -- Loading SQL schema script...
                </div>
            </div>
        `;
    },

    async loadSchema() {
        try {
            const res = await api.getSchema();
            this.schemaData = res.data;

            // Populate Database Integration Card
            if (this.schemaData.database) {
                const dbInfo = this.schemaData.database;
                const engineEl = document.getElementById('db-integration-engine');
                const statusEl = document.getElementById('db-integration-status');
                const hostEl = document.getElementById('db-integration-host');
                const nameEl = document.getElementById('db-integration-name');
                const driverEl = document.getElementById('db-integration-driver');

                if (engineEl) engineEl.textContent = `Live Database: ${dbInfo.activeEngine}`;
                if (statusEl) statusEl.textContent = dbInfo.connectionStatus;
                if (hostEl) hostEl.textContent = dbInfo.host;
                if (nameEl) nameEl.textContent = dbInfo.databaseName;
                if (driverEl) driverEl.textContent = dbInfo.driver;
            }

            this.renderErdCards(this.schemaData.tables);
            this.renderRelationships(this.schemaData.relationships);
            await this.switchTable(this.currentTable);
            await this.loadSqlScript();
        } catch (err) {
            app.showToast('Failed to load database schema: ' + err.message, 'error');
        }
    },

    renderErdCards(tables) {
        const container = document.getElementById('erd-cards-container');
        if (!container) return;

        container.innerHTML = tables.map(table => {
            return `
                <div class="erd-card">
                    <div class="erd-header">
                        <div class="erd-table-name">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" color="var(--primary-red)"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                            ${table.name}
                        </div>
                        <span class="erd-count-badge">${table.rowCount} rows</span>
                    </div>

                    <div class="erd-columns">
                        ${table.columns.map(col => {
                            const isFk = table.foreignKeys.some(fk => fk.column === col.name);
                            return `
                                <div class="erd-col-row">
                                    <div class="erd-col-info">
                                        ${col.isPk ? '<span class="badge-pk" title="Primary Key">PK 🔑</span>' : ''}
                                        ${isFk ? '<span class="badge-fk" title="Foreign Key Reference">FK 🔗</span>' : ''}
                                        <strong style="color: ${col.isPk ? 'var(--primary-red)' : 'var(--text-main)'};">${col.name}</strong>
                                    </div>
                                    <div class="erd-col-type">${col.type}</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }).join('');
    },

    renderRelationships(relationships) {
        const container = document.getElementById('erd-relationships-list');
        if (!container) return;

        container.innerHTML = relationships.map(rel => {
            return `
                <div class="erd-relation-item">
                    <div class="relation-diagram">
                        <span>${rel.toTable}</span>
                        <div class="relation-arrow">
                            &larr; <span style="font-size: 0.7rem; font-weight: 800;">${rel.cardinality}</span> &rarr;
                        </div>
                        <span>${rel.fromTable}</span>
                        <span class="relation-cardinality">${rel.type}</span>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); max-width: 480px;">
                        ${rel.description}
                    </div>
                </div>
            `;
        }).join('');
    },

    async switchTable(tableName) {
        this.currentTable = tableName;

        // Update tab styles
        const tabs = document.querySelectorAll('#table-inspector-tabs button');
        tabs.forEach(btn => {
            if (btn.textContent.trim() === tableName) {
                btn.className = 'btn btn-primary btn-sm';
            } else {
                btn.className = 'btn btn-secondary btn-sm';
            }
        });

        const thead = document.getElementById('inspector-table-head');
        const tbody = document.getElementById('inspector-table-body');
        if (!thead || !tbody) return;

        try {
            const res = await api.getTableRecords(tableName);
            const { columns, rows } = res.data;

            thead.innerHTML = `
                <tr>
                    ${columns.map(c => `
                        <th>
                            ${c.pk ? '<span class="badge-pk" style="margin-right: 3px;">PK</span>' : ''}
                            ${c.name}
                            <span style="font-size: 0.65rem; color: var(--text-light); font-weight: normal;">(${c.type})</span>
                        </th>
                    `).join('')}
                </tr>
            `;

            if (rows.length === 0) {
                tbody.innerHTML = `<tr><td colspan="${columns.length}" style="text-align: center; padding: 2rem;">No records currently in this table.</td></tr>`;
                return;
            }

            tbody.innerHTML = rows.map(row => {
                return `
                    <tr>
                        ${columns.map(col => {
                            let val = row[col.name];
                            if (val === null || val === undefined) val = '<span style="color: #cbd5e1;">NULL</span>';
                            if (col.name === 'blood_group') {
                                val = `<span class="blood-badge sm">${val}</span>`;
                            } else if (col.name === 'status' || col.name === 'priority') {
                                val = `<strong>${val}</strong>`;
                            }
                            return `<td>${val}</td>`;
                        }).join('')}
                    </tr>
                `;
            }).join('');
        } catch (err) {
            app.showToast('Failed to inspect table ' + tableName + ': ' + err.message, 'error');
        }
    },

    async loadSqlScript() {
        const display = document.getElementById('sql-code-display');
        if (!display) return;
        try {
            const res = await fetch('/api/schema.sql');
            const sqlText = await res.text();
            display.textContent = sqlText;
        } catch (e) {
            display.textContent = '-- Error fetching schema.sql file.';
        }
    },

    async copySql() {
        const display = document.getElementById('sql-code-display');
        if (!display) return;
        try {
            await navigator.clipboard.writeText(display.textContent);
            app.showToast('SQL schema copied to clipboard!', 'success');
        } catch (e) {
            app.showToast('Could not copy to clipboard automatically', 'info');
        }
    },

    resetSeedData() {
        app.confirmDialog({
            title: 'Reset Database to Seed Data',
            message: 'Are you sure you want to reset the database? All custom modifications will be cleared and the original realistic sample data (donors, patients, donations, requests, inventory) will be re-seeded.',
            confirmText: 'Reset Database',
            onConfirm: async () => {
                try {
                    await api.resetDatabase();
                    app.showToast('Database reset to fresh sample data successfully!', 'success');
                    this.loadSchema();
                } catch (err) {
                    app.showToast('Reset failed: ' + err.message, 'error');
                }
            }
        });
    },

    async bindEvents() {
        await this.loadSchema();
    }
};

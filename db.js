const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'blood_bank.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Initialize database
const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON;');

function initDatabase(forceReset = false) {
    if (forceReset) {
        const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schemaSql);
        return;
    }

    // Check if tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Donors'").all();
    if (tables.length === 0) {
        const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
        db.exec(schemaSql);
    }
}

// Ensure database is initialized
initDatabase();

// Helper to determine status for inventory
function computeInventoryStatus(units) {
    if (units <= 0) return 'Out of Stock';
    if (units < 10) return 'Low Stock';
    return 'Available';
}

// ---------------------------------------------------------
// AUTHENTICATION
// ---------------------------------------------------------
function authenticateUser(usernameOrEmail, password) {
    const user = db.prepare(`
        SELECT user_id, username, email, role 
        FROM Users 
        WHERE (username = ? OR email = ?) AND password = ?
    `).get(usernameOrEmail, usernameOrEmail, password);
    return user || null;
}

// ---------------------------------------------------------
// DASHBOARD & SUMMARY METRICS
// ---------------------------------------------------------
function getDashboardMetrics() {
    const totalDonors = db.prepare('SELECT COUNT(*) as count FROM Donors').get().count;
    const totalPatients = db.prepare('SELECT COUNT(*) as count FROM Patients').get().count;
    const availableUnits = db.prepare('SELECT COALESCE(SUM(available_units), 0) as total FROM Blood_Inventory').get().total;
    const pendingRequests = db.prepare("SELECT COUNT(*) as count FROM Blood_Requests WHERE status = 'Pending'").get().count;

    const inventory = db.prepare(`
        SELECT blood_group, available_units, last_updated, status 
        FROM Blood_Inventory 
        ORDER BY blood_group ASC
    `).all();

    const recentDonations = db.prepare(`
        SELECT bd.donation_id, d.name as donor_name, bd.blood_group, bd.quantity, 
               bd.donation_date, bd.collection_center, bd.status
        FROM Blood_Donations bd
        JOIN Donors d ON bd.donor_id = d.donor_id
        ORDER BY bd.donation_date DESC, bd.donation_id DESC
        LIMIT 6
    `).all();

    const recentRequests = db.prepare(`
        SELECT br.request_id, p.name as patient_name, p.hospital, br.blood_group, 
               br.required_units, br.request_date, br.priority, br.status
        FROM Blood_Requests br
        JOIN Patients p ON br.patient_id = p.patient_id
        ORDER BY br.request_date DESC, br.request_id DESC
        LIMIT 6
    `).all();

    return {
        summary: {
            totalDonors,
            totalPatients,
            availableUnits,
            pendingRequests
        },
        inventory,
        recentDonations,
        recentRequests
    };
}

// ---------------------------------------------------------
// DONOR MANAGEMENT
// ---------------------------------------------------------
function getDonors(search = '', bloodGroup = '') {
    let sql = 'SELECT * FROM Donors WHERE 1=1';
    const params = [];

    if (bloodGroup && bloodGroup !== 'all') {
        sql += ' AND blood_group = ?';
        params.push(bloodGroup);
    }

    if (search && search.trim() !== '') {
        sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR CAST(donor_id AS TEXT) LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm, queryTerm);
    }

    sql += ' ORDER BY donor_id DESC';
    return db.prepare(sql).all(...params);
}

function getDonorById(id) {
    const donor = db.prepare('SELECT * FROM Donors WHERE donor_id = ?').get(id);
    if (!donor) return null;
    const donations = db.prepare(`
        SELECT * FROM Blood_Donations WHERE donor_id = ? ORDER BY donation_date DESC
    `).all(id);
    return { ...donor, donations };
}

function createDonor(data) {
    const stmt = db.prepare(`
        INSERT INTO Donors (name, age, gender, blood_group, phone, email, address, last_donation_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
        data.name,
        parseInt(data.age, 10),
        data.gender,
        data.blood_group,
        data.phone,
        data.email,
        data.address,
        data.last_donation_date || null
    );
    return getDonorById(res.lastInsertRowid);
}

function updateDonor(id, data) {
    const stmt = db.prepare(`
        UPDATE Donors 
        SET name = ?, age = ?, gender = ?, blood_group = ?, phone = ?, email = ?, address = ?, last_donation_date = ?
        WHERE donor_id = ?
    `);
    stmt.run(
        data.name,
        parseInt(data.age, 10),
        data.gender,
        data.blood_group,
        data.phone,
        data.email,
        data.address,
        data.last_donation_date || null,
        id
    );
    return getDonorById(id);
}

function deleteDonor(id) {
    const res = db.prepare('DELETE FROM Donors WHERE donor_id = ?').run(id);
    return res.changes > 0;
}

// ---------------------------------------------------------
// PATIENT MANAGEMENT
// ---------------------------------------------------------
function getPatients(search = '', bloodGroup = '', status = '') {
    let sql = 'SELECT * FROM Patients WHERE 1=1';
    const params = [];

    if (bloodGroup && bloodGroup !== 'all') {
        sql += ' AND blood_group = ?';
        params.push(bloodGroup);
    }
    if (status && status !== 'all') {
        sql += ' AND status = ?';
        params.push(status);
    }
    if (search && search.trim() !== '') {
        sql += ' AND (name LIKE ? OR hospital LIKE ? OR phone LIKE ? OR CAST(patient_id AS TEXT) LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm, queryTerm);
    }

    sql += ' ORDER BY patient_id DESC';
    return db.prepare(sql).all(...params);
}

function getPatientById(id) {
    const patient = db.prepare('SELECT * FROM Patients WHERE patient_id = ?').get(id);
    if (!patient) return null;
    const requests = db.prepare(`
        SELECT * FROM Blood_Requests WHERE patient_id = ? ORDER BY request_date DESC
    `).all(id);
    return { ...patient, requests };
}

function createPatient(data) {
    const stmt = db.prepare(`
        INSERT INTO Patients (name, age, gender, blood_group, hospital, phone, required_units, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
        data.name,
        parseInt(data.age, 10),
        data.gender,
        data.blood_group,
        data.hospital,
        data.phone,
        parseInt(data.required_units, 10),
        data.status || 'Admitted'
    );
    return getPatientById(res.lastInsertRowid);
}

function updatePatient(id, data) {
    const stmt = db.prepare(`
        UPDATE Patients 
        SET name = ?, age = ?, gender = ?, blood_group = ?, hospital = ?, phone = ?, required_units = ?, status = ?
        WHERE patient_id = ?
    `);
    stmt.run(
        data.name,
        parseInt(data.age, 10),
        data.gender,
        data.blood_group,
        data.hospital,
        data.phone,
        parseInt(data.required_units, 10),
        data.status,
        id
    );
    return getPatientById(id);
}

function deletePatient(id) {
    const res = db.prepare('DELETE FROM Patients WHERE patient_id = ?').run(id);
    return res.changes > 0;
}

// ---------------------------------------------------------
// BLOOD INVENTORY MANAGEMENT
// ---------------------------------------------------------
function getInventory() {
    return db.prepare('SELECT * FROM Blood_Inventory ORDER BY blood_group ASC').all();
}

function updateInventoryUnits(blood_group, units) {
    const status = computeInventoryStatus(units);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(`
        UPDATE Blood_Inventory 
        SET available_units = ?, status = ?, last_updated = ?
        WHERE blood_group = ?
    `).run(units, status, now, blood_group);

    return db.prepare('SELECT * FROM Blood_Inventory WHERE blood_group = ?').get(blood_group);
}

function adjustInventory(blood_group, deltaUnits) {
    const current = db.prepare('SELECT available_units FROM Blood_Inventory WHERE blood_group = ?').get(blood_group);
    if (!current) throw new Error(`Blood group ${blood_group} not found in inventory.`);
    const newUnits = Math.max(0, current.available_units + deltaUnits);
    return updateInventoryUnits(blood_group, newUnits);
}

// ---------------------------------------------------------
// BLOOD DONATION MANAGEMENT
// ---------------------------------------------------------
function getDonations(search = '', bloodGroup = '') {
    let sql = `
        SELECT bd.*, d.name as donor_name, d.phone as donor_phone, d.email as donor_email
        FROM Blood_Donations bd
        JOIN Donors d ON bd.donor_id = d.donor_id
        WHERE 1=1
    `;
    const params = [];

    if (bloodGroup && bloodGroup !== 'all') {
        sql += ' AND bd.blood_group = ?';
        params.push(bloodGroup);
    }
    if (search && search.trim() !== '') {
        sql += ' AND (d.name LIKE ? OR bd.collection_center LIKE ? OR CAST(bd.donation_id AS TEXT) LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm);
    }

    sql += ' ORDER BY bd.donation_date DESC, bd.donation_id DESC';
    return db.prepare(sql).all(...params);
}

function createDonation(data) {
    const stmt = db.prepare(`
        INSERT INTO Blood_Donations (donor_id, blood_group, donation_date, quantity, collection_center, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const quantity = parseInt(data.quantity, 10) || 1;
    const res = stmt.run(
        parseInt(data.donor_id, 10),
        data.blood_group,
        data.donation_date,
        quantity,
        data.collection_center,
        data.status || 'Completed'
    );

    // Update donor's last_donation_date
    db.prepare('UPDATE Donors SET last_donation_date = ? WHERE donor_id = ?')
      .run(data.donation_date, data.donor_id);

    // If status is completed, automatically sync and increment blood inventory!
    if (data.status === 'Completed') {
        adjustInventory(data.blood_group, quantity);
    }

    return db.prepare(`
        SELECT bd.*, d.name as donor_name 
        FROM Blood_Donations bd 
        JOIN Donors d ON bd.donor_id = d.donor_id 
        WHERE bd.donation_id = ?
    `).get(res.lastInsertRowid);
}

function updateDonation(id, data) {
    const existing = db.prepare('SELECT * FROM Blood_Donations WHERE donation_id = ?').get(id);
    if (!existing) throw new Error('Donation record not found');

    const stmt = db.prepare(`
        UPDATE Blood_Donations 
        SET donor_id = ?, blood_group = ?, donation_date = ?, quantity = ?, collection_center = ?, status = ?
        WHERE donation_id = ?
    `);
    stmt.run(
        parseInt(data.donor_id, 10),
        data.blood_group,
        data.donation_date,
        parseInt(data.quantity, 10),
        data.collection_center,
        data.status,
        id
    );

    return db.prepare(`
        SELECT bd.*, d.name as donor_name 
        FROM Blood_Donations bd 
        JOIN Donors d ON bd.donor_id = d.donor_id 
        WHERE bd.donation_id = ?
    `).get(id);
}

function deleteDonation(id) {
    const res = db.prepare('DELETE FROM Blood_Donations WHERE donation_id = ?').run(id);
    return res.changes > 0;
}

// ---------------------------------------------------------
// BLOOD REQUEST MANAGEMENT
// ---------------------------------------------------------
function getRequests(search = '', status = '', priority = '') {
    let sql = `
        SELECT br.*, p.name as patient_name, p.hospital, p.phone as patient_phone
        FROM Blood_Requests br
        JOIN Patients p ON br.patient_id = p.patient_id
        WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
        sql += ' AND br.status = ?';
        params.push(status);
    }
    if (priority && priority !== 'all') {
        sql += ' AND br.priority = ?';
        params.push(priority);
    }
    if (search && search.trim() !== '') {
        sql += ' AND (p.name LIKE ? OR p.hospital LIKE ? OR CAST(br.request_id AS TEXT) LIKE ?)';
        const queryTerm = `%${search.trim()}%`;
        params.push(queryTerm, queryTerm, queryTerm);
    }

    sql += " ORDER BY CASE br.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, br.request_date DESC";
    return db.prepare(sql).all(...params);
}

function createRequest(data) {
    const stmt = db.prepare(`
        INSERT INTO Blood_Requests (patient_id, blood_group, required_units, request_date, priority, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    const res = stmt.run(
        parseInt(data.patient_id, 10),
        data.blood_group,
        parseInt(data.required_units, 10),
        data.request_date,
        data.priority || 'Normal',
        data.status || 'Pending'
    );

    return db.prepare(`
        SELECT br.*, p.name as patient_name, p.hospital 
        FROM Blood_Requests br 
        JOIN Patients p ON br.patient_id = p.patient_id 
        WHERE br.request_id = ?
    `).get(res.lastInsertRowid);
}

function updateRequest(id, data) {
    const stmt = db.prepare(`
        UPDATE Blood_Requests 
        SET patient_id = ?, blood_group = ?, required_units = ?, request_date = ?, priority = ?, status = ?
        WHERE request_id = ?
    `);
    stmt.run(
        parseInt(data.patient_id, 10),
        data.blood_group,
        parseInt(data.required_units, 10),
        data.request_date,
        data.priority,
        data.status,
        id
    );

    return db.prepare(`
        SELECT br.*, p.name as patient_name, p.hospital 
        FROM Blood_Requests br 
        JOIN Patients p ON br.patient_id = p.patient_id 
        WHERE br.request_id = ?
    `).get(id);
}

function fulfillRequest(id) {
    const request = db.prepare('SELECT * FROM Blood_Requests WHERE request_id = ?').get(id);
    if (!request) throw new Error('Blood request not found');
    if (request.status === 'Fulfilled') {
        throw new Error('This request has already been fulfilled.');
    }

    const inventory = db.prepare('SELECT available_units FROM Blood_Inventory WHERE blood_group = ?').get(request.blood_group);
    if (!inventory || inventory.available_units < request.required_units) {
        throw new Error(`Insufficient stock for ${request.blood_group}! Required: ${request.required_units} units, Available: ${inventory ? inventory.available_units : 0} units.`);
    }

    // Decrement inventory
    adjustInventory(request.blood_group, -request.required_units);

    // Update request status to Fulfilled
    db.prepare("UPDATE Blood_Requests SET status = 'Fulfilled' WHERE request_id = ?").run(id);

    return db.prepare(`
        SELECT br.*, p.name as patient_name, p.hospital 
        FROM Blood_Requests br 
        JOIN Patients p ON br.patient_id = p.patient_id 
        WHERE br.request_id = ?
    `).get(id);
}

function updateRequestStatus(id, newStatus) {
    if (newStatus === 'Fulfilled') {
        return fulfillRequest(id);
    }
    db.prepare('UPDATE Blood_Requests SET status = ? WHERE request_id = ?').run(newStatus, id);
    return db.prepare(`
        SELECT br.*, p.name as patient_name, p.hospital 
        FROM Blood_Requests br 
        JOIN Patients p ON br.patient_id = p.patient_id 
        WHERE br.request_id = ?
    `).get(id);
}

function deleteRequest(id) {
    const res = db.prepare('DELETE FROM Blood_Requests WHERE request_id = ?').run(id);
    return res.changes > 0;
}

// ---------------------------------------------------------
// REPORTS & ANALYTICS
// ---------------------------------------------------------
function getReportsData() {
    const inventory = db.prepare('SELECT * FROM Blood_Inventory ORDER BY blood_group ASC').all();
    
    const donationsByMonth = db.prepare(`
        SELECT strftime('%Y-%m', donation_date) as month, COUNT(*) as count, SUM(quantity) as total_units
        FROM Blood_Donations
        GROUP BY month
        ORDER BY month ASC
    `).all();

    const donationsByGroup = db.prepare(`
        SELECT blood_group, COUNT(*) as donation_count, SUM(quantity) as total_units
        FROM Blood_Donations
        GROUP BY blood_group
        ORDER BY total_units DESC
    `).all();

    const requestsByStatus = db.prepare(`
        SELECT status, COUNT(*) as count, SUM(required_units) as total_units
        FROM Blood_Requests
        GROUP BY status
    `).all();

    const requestsByPriority = db.prepare(`
        SELECT priority, COUNT(*) as count
        FROM Blood_Requests
        GROUP BY priority
    `).all();

    const donorsByGroup = db.prepare(`
        SELECT blood_group, COUNT(*) as count
        FROM Donors
        GROUP BY blood_group
        ORDER BY blood_group ASC
    `).all();

    const donorsByGender = db.prepare(`
        SELECT gender, COUNT(*) as count
        FROM Donors
        GROUP BY gender
    `).all();

    const hospitalDemands = db.prepare(`
        SELECT p.hospital, COUNT(br.request_id) as total_requests, SUM(br.required_units) as total_units_needed
        FROM Blood_Requests br
        JOIN Patients p ON br.patient_id = p.patient_id
        GROUP BY p.hospital
        ORDER BY total_units_needed DESC
        LIMIT 6
    `).all();

    return {
        inventory,
        donationsByMonth,
        donationsByGroup,
        requestsByStatus,
        requestsByPriority,
        donorsByGroup,
        donorsByGender,
        hospitalDemands
    };
}

// ---------------------------------------------------------
// DATABASE SCHEMA INTROSPECTION & DEMONSTRATION
// ---------------------------------------------------------
function getSchemaDetails() {
    const tableNames = ['Users', 'Donors', 'Patients', 'Blood_Donations', 'Blood_Inventory', 'Blood_Requests'];
    const tables = [];

    for (const name of tableNames) {
        const columns = db.prepare(`PRAGMA table_info(${name})`).all();
        const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${name})`).all();
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get().count;

        tables.push({
            name,
            rowCount: count,
            columns: columns.map(col => ({
                cid: col.cid,
                name: col.name,
                type: col.type,
                notnull: Boolean(col.notnull),
                defaultValue: col.dflt_value,
                isPk: Boolean(col.pk)
            })),
            foreignKeys: foreignKeys.map(fk => ({
                id: fk.id,
                column: fk.from,
                foreignTable: fk.table,
                foreignColumn: fk.to,
                onDelete: fk.on_delete,
                onUpdate: fk.on_update
            }))
        });
    }

    // Explicit Relational Connections description
    const relationships = [
        {
            fromTable: 'Blood_Donations',
            fromColumn: 'donor_id',
            toTable: 'Donors',
            toColumn: 'donor_id',
            cardinality: '1:N',
            type: 'One Donor to Many Donations',
            description: 'A registered donor can contribute blood multiple times over time.'
        },
        {
            fromTable: 'Blood_Requests',
            fromColumn: 'patient_id',
            toTable: 'Patients',
            toColumn: 'patient_id',
            cardinality: '1:N',
            type: 'One Patient to Many Requests',
            description: 'A hospitalized patient may require blood units on multiple occasions.'
        },
        {
            fromTable: 'Blood_Donations',
            fromColumn: 'blood_group',
            toTable: 'Blood_Inventory',
            toColumn: 'blood_group',
            cardinality: 'N:1',
            type: 'Donation Stock Inflow',
            description: 'Completed donations replenish the matching blood group available units.'
        },
        {
            fromTable: 'Blood_Requests',
            fromColumn: 'blood_group',
            toTable: 'Blood_Inventory',
            toColumn: 'blood_group',
            cardinality: 'N:1',
            type: 'Request Stock Outflow',
            description: 'Fulfilled blood requests decrement available units in the blood inventory.'
        }
    ];

    return { tables, relationships };
}

function getTableRecords(tableName, limit = 50) {
    const validTables = ['Users', 'Donors', 'Patients', 'Blood_Donations', 'Blood_Inventory', 'Blood_Requests'];
    if (!validTables.includes(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
    }
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT ?`).all(limit);
    return { tableName, columns, rows, totalRows: rows.length };
}

module.exports = {
    db,
    initDatabase,
    authenticateUser,
    getDashboardMetrics,
    getDonors,
    getDonorById,
    createDonor,
    updateDonor,
    deleteDonor,
    getPatients,
    getPatientById,
    createPatient,
    updatePatient,
    deletePatient,
    getInventory,
    updateInventoryUnits,
    adjustInventory,
    getDonations,
    createDonation,
    updateDonation,
    deleteDonation,
    getRequests,
    createRequest,
    updateRequest,
    fulfillRequest,
    updateRequestStatus,
    deleteRequest,
    getReportsData,
    getSchemaDetails,
    getTableRecords
};

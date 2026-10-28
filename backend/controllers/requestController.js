// ============================================================================
// BACKEND CONTROLLER: BLOOD REQUESTS
// Handles requisitions, status changes, and atomic inventory fulfillment
// ============================================================================

const db = require('../config/database');
const inventoryController = require('./inventoryController');

const requestController = {
    async getRequests(search = '', status = '', priority = '') {
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
            sql += ' AND (p.name LIKE ? OR p.hospital LIKE ? OR CAST(br.request_id AS CHAR) LIKE ?)';
            const q = `%${search.trim()}%`;
            params.push(q, q, q);
        }

        sql += " ORDER BY CASE br.priority WHEN 'Urgent' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, br.request_date DESC";
        return await db.query(sql, params);
    },

    async createRequest(data) {
        const { patient_id, blood_group, required_units, request_date, priority = 'Normal', status = 'Pending' } = data;
        const sql = `
            INSERT INTO Blood_Requests (patient_id, blood_group, required_units, request_date, priority, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const res = await db.execute(sql, [
            parseInt(patient_id, 10),
            blood_group,
            parseInt(required_units, 10),
            request_date,
            priority,
            status
        ]);

        return await db.queryOne(`
            SELECT br.*, p.name as patient_name, p.hospital 
            FROM Blood_Requests br 
            JOIN Patients p ON br.patient_id = p.patient_id 
            WHERE br.request_id = ?
        `, [res.insertId]);
    },

    async updateRequest(id, data) {
        const { patient_id, blood_group, required_units, request_date, priority, status } = data;
        const sql = `
            UPDATE Blood_Requests 
            SET patient_id = ?, blood_group = ?, required_units = ?, request_date = ?, priority = ?, status = ?
            WHERE request_id = ?
        `;
        await db.execute(sql, [
            parseInt(patient_id, 10),
            blood_group,
            parseInt(required_units, 10),
            request_date,
            priority,
            status,
            id
        ]);

        return await db.queryOne(`
            SELECT br.*, p.name as patient_name, p.hospital 
            FROM Blood_Requests br 
            JOIN Patients p ON br.patient_id = p.patient_id 
            WHERE br.request_id = ?
        `, [id]);
    },

    async fulfillRequest(id) {
        const req = await db.queryOne('SELECT * FROM Blood_Requests WHERE request_id = ?', [id]);
        if (!req) throw new Error('Blood request order not found');
        if (req.status === 'Fulfilled') {
            throw new Error('This blood order has already been fulfilled.');
        }

        // Verify stock in inventory
        const inventory = await db.queryOne('SELECT available_units FROM Blood_Inventory WHERE blood_group = ?', [req.blood_group]);
        const currentStock = inventory ? inventory.available_units : 0;

        if (currentStock < req.required_units) {
            throw new Error(`Insufficient inventory stock for ${req.blood_group}! Required: ${req.required_units} bags, Available: ${currentStock} bags.`);
        }

        // Decrement inventory stock
        await inventoryController.adjustStock(req.blood_group, -req.required_units);

        // Update status to Fulfilled
        await db.execute("UPDATE Blood_Requests SET status = 'Fulfilled' WHERE request_id = ?", [id]);

        return await db.queryOne(`
            SELECT br.*, p.name as patient_name, p.hospital 
            FROM Blood_Requests br 
            JOIN Patients p ON br.patient_id = p.patient_id 
            WHERE br.request_id = ?
        `, [id]);
    },

    async updateStatus(id, newStatus) {
        if (newStatus === 'Fulfilled') {
            return await this.fulfillRequest(id);
        }
        await db.execute('UPDATE Blood_Requests SET status = ? WHERE request_id = ?', [newStatus, id]);
        return await db.queryOne(`
            SELECT br.*, p.name as patient_name, p.hospital 
            FROM Blood_Requests br 
            JOIN Patients p ON br.patient_id = p.patient_id 
            WHERE br.request_id = ?
        `, [id]);
    },

    async deleteRequest(id) {
        const res = await db.execute('DELETE FROM Blood_Requests WHERE request_id = ?', [id]);
        return res.affectedRows > 0;
    }
};

module.exports = requestController;

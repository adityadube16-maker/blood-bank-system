// ============================================================================
// BACKEND CONTROLLER: PATIENTS
// ============================================================================

const db = require('../config/database');

const patientController = {
    async getPatients(search = '', bloodGroup = '', status = '') {
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
            sql += ' AND (name LIKE ? OR hospital LIKE ? OR phone LIKE ? OR CAST(patient_id AS CHAR) LIKE ?)';
            const q = `%${search.trim()}%`;
            params.push(q, q, q, q);
        }

        sql += ' ORDER BY patient_id DESC';
        return await db.query(sql, params);
    },

    async getPatientById(id) {
        const patient = await db.queryOne('SELECT * FROM Patients WHERE patient_id = ?', [id]);
        if (!patient) return null;

        const requests = await db.query(
            'SELECT * FROM Blood_Requests WHERE patient_id = ? ORDER BY request_date DESC',
            [id]
        );
        return { ...patient, requests };
    },

    async createPatient(data) {
        const { name, age, gender, blood_group, hospital, phone, required_units, status = 'Admitted' } = data;
        const sql = `
            INSERT INTO Patients (name, age, gender, blood_group, hospital, phone, required_units, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const res = await db.execute(sql, [
            name,
            parseInt(age, 10),
            gender,
            blood_group,
            hospital,
            phone,
            parseInt(required_units, 10),
            status
        ]);

        return await this.getPatientById(res.insertId);
    },

    async updatePatient(id, data) {
        const { name, age, gender, blood_group, hospital, phone, required_units, status } = data;
        const sql = `
            UPDATE Patients 
            SET name = ?, age = ?, gender = ?, blood_group = ?, hospital = ?, phone = ?, required_units = ?, status = ?
            WHERE patient_id = ?
        `;
        await db.execute(sql, [
            name,
            parseInt(age, 10),
            gender,
            blood_group,
            hospital,
            phone,
            parseInt(required_units, 10),
            status,
            id
        ]);

        return await this.getPatientById(id);
    },

    async deletePatient(id) {
        const res = await db.execute('DELETE FROM Patients WHERE patient_id = ?', [id]);
        return res.affectedRows > 0;
    }
};

module.exports = patientController;

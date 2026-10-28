// ============================================================================
// BACKEND CONTROLLER: DONORS
// Demonstrates business logic, parameter binding & referential queries
// ============================================================================

const db = require('../config/database');

const donorController = {
    async getDonors(search = '', bloodGroup = '') {
        let sql = 'SELECT * FROM Donors WHERE 1=1';
        const params = [];

        if (bloodGroup && bloodGroup !== 'all') {
            sql += ' AND blood_group = ?';
            params.push(bloodGroup);
        }

        if (search && search.trim() !== '') {
            sql += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR CAST(donor_id AS CHAR) LIKE ?)';
            const q = `%${search.trim()}%`;
            params.push(q, q, q, q);
        }

        sql += ' ORDER BY donor_id DESC';
        return await db.query(sql, params);
    },

    async getDonorById(id) {
        const donor = await db.queryOne('SELECT * FROM Donors WHERE donor_id = ?', [id]);
        if (!donor) return null;

        const donations = await db.query(
            'SELECT * FROM Blood_Donations WHERE donor_id = ? ORDER BY donation_date DESC',
            [id]
        );
        return { ...donor, donations };
    },

    async createDonor(data) {
        const { name, age, gender, blood_group, phone, email, address, last_donation_date } = data;

        // Validation
        const parsedAge = parseInt(age, 10);
        if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 65) {
            throw new Error('Donor age must be an integer between 18 and 65 years.');
        }

        const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        if (!validGroups.includes(blood_group)) {
            throw new Error(`Invalid blood group: ${blood_group}`);
        }

        const sql = `
            INSERT INTO Donors (name, age, gender, blood_group, phone, email, address, last_donation_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const res = await db.execute(sql, [
            name,
            parsedAge,
            gender,
            blood_group,
            phone,
            email,
            address,
            last_donation_date || null
        ]);

        return await this.getDonorById(res.insertId);
    },

    async updateDonor(id, data) {
        const { name, age, gender, blood_group, phone, email, address, last_donation_date } = data;
        const parsedAge = parseInt(age, 10);

        const sql = `
            UPDATE Donors 
            SET name = ?, age = ?, gender = ?, blood_group = ?, phone = ?, email = ?, address = ?, last_donation_date = ?
            WHERE donor_id = ?
        `;
        await db.execute(sql, [
            name,
            parsedAge,
            gender,
            blood_group,
            phone,
            email,
            address,
            last_donation_date || null,
            id
        ]);

        return await this.getDonorById(id);
    },

    async deleteDonor(id) {
        const res = await db.execute('DELETE FROM Donors WHERE donor_id = ?', [id]);
        return res.affectedRows > 0;
    }
};

module.exports = donorController;

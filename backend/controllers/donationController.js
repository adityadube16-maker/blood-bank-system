// ============================================================================
// BACKEND CONTROLLER: BLOOD DONATIONS
// Automatically synchronizes inventory upon donation completion
// ============================================================================

const db = require('../config/database');
const inventoryController = require('./inventoryController');

const donationController = {
    async getDonations(search = '', bloodGroup = '') {
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
            sql += ' AND (d.name LIKE ? OR bd.collection_center LIKE ? OR CAST(bd.donation_id AS CHAR) LIKE ?)';
            const q = `%${search.trim()}%`;
            params.push(q, q, q);
        }

        sql += ' ORDER BY bd.donation_date DESC, bd.donation_id DESC';
        return await db.query(sql, params);
    },

    async createDonation(data) {
        const { donor_id, blood_group, donation_date, quantity, collection_center, status = 'Completed' } = data;
        const parsedQty = parseInt(quantity, 10) || 1;

        // 1. Insert donation record
        const insertSql = `
            INSERT INTO Blood_Donations (donor_id, blood_group, donation_date, quantity, collection_center, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const res = await db.execute(insertSql, [
            parseInt(donor_id, 10),
            blood_group,
            donation_date,
            parsedQty,
            collection_center,
            status
        ]);

        // 2. Update donor's last_donation_date
        await db.execute(
            'UPDATE Donors SET last_donation_date = ? WHERE donor_id = ?',
            [donation_date, parseInt(donor_id, 10)]
        );

        // 3. Database Integration Trigger: Automatically increment inventory if status is 'Completed'
        if (status === 'Completed') {
            await inventoryController.adjustStock(blood_group, parsedQty);
        }

        return await db.queryOne(`
            SELECT bd.*, d.name as donor_name 
            FROM Blood_Donations bd 
            JOIN Donors d ON bd.donor_id = d.donor_id 
            WHERE bd.donation_id = ?
        `, [res.insertId]);
    },

    async updateDonation(id, data) {
        const { donor_id, blood_group, donation_date, quantity, collection_center, status } = data;
        const updateSql = `
            UPDATE Blood_Donations 
            SET donor_id = ?, blood_group = ?, donation_date = ?, quantity = ?, collection_center = ?, status = ?
            WHERE donation_id = ?
        `;
        await db.execute(updateSql, [
            parseInt(donor_id, 10),
            blood_group,
            donation_date,
            parseInt(quantity, 10),
            collection_center,
            status,
            id
        ]);

        return await db.queryOne(`
            SELECT bd.*, d.name as donor_name 
            FROM Blood_Donations bd 
            JOIN Donors d ON bd.donor_id = d.donor_id 
            WHERE bd.donation_id = ?
        `, [id]);
    },

    async deleteDonation(id) {
        const res = await db.execute('DELETE FROM Blood_Donations WHERE donation_id = ?', [id]);
        return res.affectedRows > 0;
    }
};

module.exports = donationController;

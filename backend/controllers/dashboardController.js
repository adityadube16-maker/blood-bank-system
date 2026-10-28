// ============================================================================
// BACKEND CONTROLLER: DASHBOARD METRICS
// ============================================================================

const db = require('../config/database');

const dashboardController = {
    async getMetrics() {
        const totalDonorsRes = await db.queryOne('SELECT COUNT(*) as count FROM Donors');
        const totalPatientsRes = await db.queryOne('SELECT COUNT(*) as count FROM Patients');
        const availableUnitsRes = await db.queryOne('SELECT COALESCE(SUM(available_units), 0) as total FROM Blood_Inventory');
        const pendingRequestsRes = await db.queryOne("SELECT COUNT(*) as count FROM Blood_Requests WHERE status = 'Pending'");

        const inventory = await db.query('SELECT blood_group, available_units, last_updated, status FROM Blood_Inventory ORDER BY blood_group ASC');

        const recentDonations = await db.query(`
            SELECT bd.donation_id, d.name as donor_name, bd.blood_group, bd.quantity, 
                   bd.donation_date, bd.collection_center, bd.status
            FROM Blood_Donations bd
            JOIN Donors d ON bd.donor_id = d.donor_id
            ORDER BY bd.donation_date DESC, bd.donation_id DESC
            LIMIT 6
        `);

        const recentRequests = await db.query(`
            SELECT br.request_id, p.name as patient_name, p.hospital, br.blood_group, 
                   br.required_units, br.request_date, br.priority, br.status
            FROM Blood_Requests br
            JOIN Patients p ON br.patient_id = p.patient_id
            ORDER BY br.request_date DESC, br.request_id DESC
            LIMIT 6
        `);

        return {
            summary: {
                totalDonors: totalDonorsRes ? totalDonorsRes.count : 0,
                totalPatients: totalPatientsRes ? totalPatientsRes.count : 0,
                availableUnits: availableUnitsRes ? availableUnitsRes.total : 0,
                pendingRequests: pendingRequestsRes ? pendingRequestsRes.count : 0
            },
            inventory,
            recentDonations,
            recentRequests,
            database: db.getEngineInfo()
        };
    }
};

module.exports = dashboardController;

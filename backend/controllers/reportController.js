// ============================================================================
// BACKEND CONTROLLER: REPORTS & ANALYTICS
// ============================================================================

const db = require('../config/database');

const reportController = {
    async getAnalytics() {
        const inventory = await db.query('SELECT * FROM Blood_Inventory ORDER BY blood_group ASC');

        const isMySQL = db.activeEngine() === 'MySQL 8.0';
        const monthExpr = isMySQL ? "DATE_FORMAT(donation_date, '%Y-%m')" : "strftime('%Y-%m', donation_date)";

        const donationsByMonth = await db.query(`
            SELECT ${monthExpr} as month, COUNT(*) as count, SUM(quantity) as total_units
            FROM Blood_Donations
            GROUP BY month
            ORDER BY month ASC
        `);

        const donationsByGroup = await db.query(`
            SELECT blood_group, COUNT(*) as donation_count, SUM(quantity) as total_units
            FROM Blood_Donations
            GROUP BY blood_group
            ORDER BY total_units DESC
        `);

        const requestsByStatus = await db.query(`
            SELECT status, COUNT(*) as count, SUM(required_units) as total_units
            FROM Blood_Requests
            GROUP BY status
        `);

        const requestsByPriority = await db.query(`
            SELECT priority, COUNT(*) as count
            FROM Blood_Requests
            GROUP BY priority
        `);

        const donorsByGroup = await db.query(`
            SELECT blood_group, COUNT(*) as count
            FROM Donors
            GROUP BY blood_group
            ORDER BY blood_group ASC
        `);

        const donorsByGender = await db.query(`
            SELECT gender, COUNT(*) as count
            FROM Donors
            GROUP BY gender
        `);

        const hospitalDemands = await db.query(`
            SELECT p.hospital, COUNT(br.request_id) as total_requests, SUM(br.required_units) as total_units_needed
            FROM Blood_Requests br
            JOIN Patients p ON br.patient_id = p.patient_id
            GROUP BY p.hospital
            ORDER BY total_units_needed DESC
            LIMIT 6
        `);

        return {
            inventory,
            donationsByMonth,
            donationsByGroup,
            requestsByStatus,
            requestsByPriority,
            donorsByGroup,
            donorsByGender,
            hospitalDemands,
            database: db.getEngineInfo()
        };
    }
};

module.exports = reportController;

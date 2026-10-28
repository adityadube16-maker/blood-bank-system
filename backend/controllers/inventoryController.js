// ============================================================================
// BACKEND CONTROLLER: BLOOD INVENTORY
// ============================================================================

const db = require('../config/database');

function computeStockStatus(units) {
    if (units <= 0) return 'Out of Stock';
    if (units < 10) return 'Low Stock';
    return 'Available';
}

const inventoryController = {
    async getInventory() {
        return await db.query('SELECT * FROM Blood_Inventory ORDER BY blood_group ASC');
    },

    async updateUnits(bloodGroup, units) {
        const parsedUnits = parseInt(units, 10);
        if (isNaN(parsedUnits) || parsedUnits < 0) {
            throw new Error('Available units must be a non-negative integer');
        }

        const status = computeStockStatus(parsedUnits);
        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        await db.execute(
            'UPDATE Blood_Inventory SET available_units = ?, status = ?, last_updated = ? WHERE blood_group = ?',
            [parsedUnits, status, now, bloodGroup]
        );

        return await db.queryOne('SELECT * FROM Blood_Inventory WHERE blood_group = ?', [bloodGroup]);
    },

    async adjustStock(bloodGroup, deltaUnits) {
        const item = await db.queryOne('SELECT available_units FROM Blood_Inventory WHERE blood_group = ?', [bloodGroup]);
        if (!item) {
            throw new Error(`Blood group ${bloodGroup} does not exist in inventory.`);
        }
        const newUnits = Math.max(0, item.available_units + deltaUnits);
        return await this.updateUnits(bloodGroup, newUnits);
    }
};

module.exports = inventoryController;

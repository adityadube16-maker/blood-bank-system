// ============================================================================
// DATABASE SCHEMA & RECORD INSPECTOR UTILITY
// Run with: node view_db.js [optional_table_name]
// ============================================================================

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

const DB_PATH = path.join(__dirname, 'blood_bank.db');
const db = new DatabaseSync(DB_PATH);

const targetTable = process.argv[2];

console.log('===============================================================');
console.log('     LIFEFLOW BLOOD BANK - RELATIONAL DATABASE INSPECTOR       ');
console.log('===============================================================\n');

if (!targetTable) {
    // 1. List all tables with schema details
    const tables = ['Users', 'Donors', 'Patients', 'Blood_Donations', 'Blood_Inventory', 'Blood_Requests'];
    
    console.log('--- DATABASE TABLES & SCHEMAS ---\n');
    for (const table of tables) {
        const columns = db.prepare(`PRAGMA table_info(${table})`).all();
        const fks = db.prepare(`PRAGMA foreign_key_list(${table})`).all();
        const rowCount = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;

        console.log(`📌 TABLE: ${table} (${rowCount} rows)`);
        console.log('   COLUMNS:');
        for (const col of columns) {
            const pk = col.pk ? ' [PRIMARY KEY 🔑]' : '';
            const fk = fks.find(f => f.from === col.name);
            const fkInfo = fk ? ` [FOREIGN KEY 🔗 -> ${fk.table}(${fk.to})]` : '';
            const notNull = col.notnull ? ' NOT NULL' : '';
            console.log(`     - ${col.name.padEnd(20)} ${col.type.padEnd(12)}${notNull}${pk}${fkInfo}`);
        }
        console.log('');
    }

    console.log('---------------------------------------------------------------');
    console.log('💡 TIP: To view live records from a specific table, run:');
    console.log('   node view_db.js Donors');
    console.log('   node view_db.js Blood_Inventory');
    console.log('   node view_db.js Blood_Requests');
    console.log('---------------------------------------------------------------');
} else {
    // 2. View records of a specific table
    try {
        const rows = db.prepare(`SELECT * FROM ${targetTable}`).all();
        console.log(`📊 RECORDS FOR TABLE: ${targetTable} (${rows.length} rows)\n`);
        console.table(rows);
    } catch (e) {
        console.error(`❌ Error querying table "${targetTable}": ${e.message}`);
    }
}

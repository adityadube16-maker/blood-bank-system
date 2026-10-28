// ============================================================================
// BACKEND CONTROLLER: DATABASE SCHEMA & INTROSPECTION
// ============================================================================

const db = require('../config/database');
const fs = require('node:fs');
const path = require('node:path');

const schemaController = {
    async getSchemaDetails() {
        const tableNames = ['Users', 'Donors', 'Patients', 'Blood_Donations', 'Blood_Inventory', 'Blood_Requests'];
        const tables = [];
        const isMySQL = db.activeEngine() === 'MySQL 8.0';

        for (const name of tableNames) {
            let columns = [];
            let foreignKeys = [];

            if (isMySQL) {
                // MySQL Information Schema
                const colRows = await db.query(`
                    SELECT COLUMN_NAME as name, DATA_TYPE as type, IS_NULLABLE as is_nullable, COLUMN_KEY as col_key
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = 'blood_bank_db' AND TABLE_NAME = ?
                    ORDER BY ORDINAL_POSITION
                `, [name]);

                columns = colRows.map(c => ({
                    name: c.name,
                    type: c.type.toUpperCase(),
                    notnull: c.is_nullable === 'NO',
                    isPk: c.col_key === 'PRI'
                }));

                const fkRows = await db.query(`
                    SELECT COLUMN_NAME as col, REFERENCED_TABLE_NAME as ref_table, REFERENCED_COLUMN_NAME as ref_col
                    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = 'blood_bank_db' AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL
                `, [name]);

                foreignKeys = fkRows.map(f => ({
                    column: f.col,
                    foreignTable: f.ref_table,
                    foreignColumn: f.ref_col
                }));
            } else {
                // SQLite PRAGMA
                const colRows = await db.query(`PRAGMA table_info(${name})`);
                columns = colRows.map(c => ({
                    name: c.name,
                    type: c.type,
                    notnull: Boolean(c.notnull),
                    isPk: Boolean(c.pk)
                }));

                const fkRows = await db.query(`PRAGMA foreign_key_list(${name})`);
                foreignKeys = fkRows.map(f => ({
                    column: f.from,
                    foreignTable: f.table,
                    foreignColumn: f.to
                }));
            }

            const countRes = await db.queryOne(`SELECT COUNT(*) as count FROM ${name}`);

            tables.push({
                name,
                rowCount: countRes ? countRes.count : 0,
                columns,
                foreignKeys
            });
        }

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

        return {
            tables,
            relationships,
            database: db.getEngineInfo()
        };
    },

    async getTableRecords(tableName, limit = 50) {
        const validTables = ['Users', 'Donors', 'Patients', 'Blood_Donations', 'Blood_Inventory', 'Blood_Requests'];
        const found = validTables.find(t => t.toLowerCase() === tableName.toLowerCase());
        if (!found) {
            throw new Error(`Invalid table name: ${tableName}`);
        }

        const isMySQL = db.activeEngine() === 'MySQL 8.0';
        let columns = [];

        if (isMySQL) {
            const colRows = await db.query(`
                SELECT COLUMN_NAME as name, DATA_TYPE as type, COLUMN_KEY as col_key
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = 'blood_bank_db' AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            `, [found]);
            columns = colRows.map(c => ({
                name: c.name,
                type: c.type.toUpperCase(),
                pk: c.col_key === 'PRI'
            }));
        } else {
            const colRows = await db.query(`PRAGMA table_info(${found})`);
            columns = colRows.map(c => ({
                name: c.name,
                type: c.type,
                pk: Boolean(c.pk)
            }));
        }

        const rows = await db.query(`SELECT * FROM ${found} LIMIT ?`, [limit]);
        return {
            tableName: found,
            columns,
            rows,
            totalRows: rows.length,
            database: db.getEngineInfo()
        };
    },

    async resetSeedData() {
        if (db.activeEngine() === 'MySQL 8.0') {
            const mysqlScript = fs.readFileSync(path.join(__dirname, '..', '..', 'blood_bank_mysql.sql'), 'utf-8');
            // Execute statements
            const stmts = mysqlScript
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('CREATE DATABASE') && !s.startsWith('USE'));

            for (const stmt of stmts) {
                try {
                    await db.execute(stmt);
                } catch (e) {
                    // Ignore DROP warnings
                }
            }
        } else {
            const { initDatabase } = require('../../db');
            initDatabase(true);
        }
        return { success: true, message: `Database reset to initial seed data successfully using ${db.activeEngine()}!` };
    }
};

module.exports = schemaController;

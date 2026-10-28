// ============================================================================
// BACKEND DATABASE INTEGRATION LAYER
// Multi-Engine Relational Database Driver: MySQL 8.0 Primary with SQLite Fallback
// ============================================================================

const path = require('node:path');
const fs = require('node:fs');

// MySQL Configuration
const MYSQL_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'aditya',
    database: process.env.DB_NAME || 'blood_bank_db',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let mysqlPool = null;
let sqliteDb = null;
let activeEngine = 'SQLite 3'; // Initial default until MySQL check
let connectionStatus = 'Connecting...';

// Initialize SQLite fallback
const DB_PATH = path.join(__dirname, '..', '..', 'blood_bank.db');
const SCHEMA_PATH = path.join(__dirname, '..', '..', 'schema.sql');

function initSqlite() {
    if (!sqliteDb) {
        const { DatabaseSync } = require('node:sqlite');
        sqliteDb = new DatabaseSync(DB_PATH);
        sqliteDb.exec('PRAGMA foreign_keys = ON;');
        
        // Seed if needed
        const tables = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='Donors'").all();
        if (tables.length === 0) {
            const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
            sqliteDb.exec(schemaSql);
        }
    }
}

// Connect to MySQL
async function initDatabase() {
    initSqlite();

    try {
        const mysql = require('mysql2/promise');
        const pool = mysql.createPool(MYSQL_CONFIG);
        
        // Test connection
        const [rows] = await pool.query('SELECT 1 as test');
        if (rows && rows.length > 0) {
            mysqlPool = pool;
            activeEngine = 'MySQL 8.0';
            connectionStatus = 'Connected to MySQL 8.0 (blood_bank_db)';
            console.log(`[Database Integration] ✅ Connected to MySQL 8.0 on ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port} (DB: ${MYSQL_CONFIG.database})`);
            return;
        }
    } catch (err) {
        console.warn(`[Database Integration] ⚠️ MySQL connection unavailable (${err.message}). Using native SQLite 3 engine.`);
    }

    activeEngine = 'SQLite 3';
    connectionStatus = 'Connected to SQLite 3 (blood_bank.db)';
    console.log(`[Database Integration] ✅ Active Relational Database: SQLite 3`);
}

// Unified Query Execution
async function query(sql, params = []) {
    if (activeEngine === 'MySQL 8.0' && mysqlPool) {
        try {
            // Adjust any SQLite specific functions to MySQL if needed
            const mySql = sql.replace(/strftime\('%Y-%m',\s*([^)]+)\)/g, "DATE_FORMAT($1, '%Y-%m')");
            const [results] = await mysqlPool.execute(mySql, params);
            return results;
        } catch (mysqlErr) {
            console.error('[MySQL Query Error]:', mysqlErr.message);
            throw mysqlErr;
        }
    } else {
        // Run via SQLite
        const stmt = sqliteDb.prepare(sql);
        if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('PRAGMA')) {
            return stmt.all(...params);
        } else {
            const result = stmt.run(...params);
            return {
                insertId: result.lastInsertRowid,
                affectedRows: result.changes
            };
        }
    }
}

// Unified Single Row Query
async function queryOne(sql, params = []) {
    const rows = await query(sql, params);
    return (rows && rows.length > 0) ? rows[0] : null;
}

// Unified Execute (INSERT / UPDATE / DELETE)
async function execute(sql, params = []) {
    if (activeEngine === 'MySQL 8.0' && mysqlPool) {
        const [result] = await mysqlPool.execute(sql, params);
        return {
            insertId: result.insertId,
            affectedRows: result.affectedRows
        };
    } else {
        const stmt = sqliteDb.prepare(sql);
        const res = stmt.run(...params);
        return {
            insertId: res.lastInsertRowid,
            affectedRows: res.changes
        };
    }
}

// Health & Status Introspection
function getEngineInfo() {
    return {
        activeEngine,
        connectionStatus,
        host: activeEngine === 'MySQL 8.0' ? `${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}` : 'Local File',
        databaseName: activeEngine === 'MySQL 8.0' ? MYSQL_CONFIG.database : 'blood_bank.db',
        driver: activeEngine === 'MySQL 8.0' ? 'mysql2 Connection Pool' : 'node:sqlite DatabaseSync',
        referentialIntegrity: 'Foreign Keys Enforced (ON DELETE CASCADE)',
        normalizationLevel: 'Third Normal Form (3NF)'
    };
}

module.exports = {
    initDatabase,
    query,
    queryOne,
    execute,
    getEngineInfo,
    activeEngine: () => activeEngine
};

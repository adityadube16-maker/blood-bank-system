const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const db = require('./backend/config/database');
const { handleApiRequest } = require('./backend/routes/apiRouter');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static assets
const MIME_TYPES = {
    '.html': 'text/html; charset=UTF-8',
    '.css': 'text/css; charset=UTF-8',
    '.js': 'application/javascript; charset=UTF-8',
    '.json': 'application/json; charset=UTF-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.sql': 'text/plain; charset=UTF-8'
};

// Helper: parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
            if (body.length > 5 * 1024 * 1024) { // 5MB limit
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            try {
                if (body && req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
                    resolve(JSON.parse(body));
                } else {
                    resolve(body ? JSON.parse(body) : {});
                }
            } catch (err) {
                resolve({});
            }
        });
        req.on('error', reject);
    });
}

// Helper: serve static files
function serveStaticFile(res, filePath) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // Return index.html for SPA client-side routing fallback if not an asset
                const indexPath = path.join(PUBLIC_DIR, 'index.html');
                fs.readFile(indexPath, (indexErr, indexContent) => {
                    if (indexErr) {
                        res.writeHead(404, { 'Content-Type': 'text/plain' });
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
                        res.end(indexContent);
                    }
                });
            } else {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end(`Server Error: ${err.code}`);
            }
        } else {
            const ext = path.extname(filePath).toLowerCase();
            const contentType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
}

// Main HTTP Request Handler
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        });
        return res.end();
    }

    const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = reqUrl.pathname;
    const method = req.method.toUpperCase();
    const query = Object.fromEntries(reqUrl.searchParams.entries());

    // 1. Direct download endpoint for schema.sql (SQLite)
    if (pathname === '/api/schema.sql') {
        const schemaPath = path.join(__dirname, 'schema.sql');
        fs.readFile(schemaPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Unable to read SQLite schema file' }));
            }
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=UTF-8',
                'Content-Disposition': 'attachment; filename="blood_bank_schema.sql"'
            });
            res.end(data);
        });
        return;
    }

    // 2. Direct download endpoint for blood_bank_mysql.sql (MySQL)
    if (pathname === '/api/mysql.sql') {
        const mysqlPath = path.join(__dirname, 'blood_bank_mysql.sql');
        fs.readFile(mysqlPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Unable to read MySQL schema file' }));
            }
            res.writeHead(200, {
                'Content-Type': 'text/plain; charset=UTF-8',
                'Content-Disposition': 'attachment; filename="blood_bank_mysql.sql"'
            });
            res.end(data);
        });
        return;
    }

    // Direct download endpoint for full project ZIP
    if (pathname === '/api/download-project' || pathname === '/api/project.zip') {
        const zipPath = path.join(__dirname, '..', 'blood_bank_system.zip');
        fs.readFile(zipPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ success: false, error: 'Unable to read zip file' }));
            }
            res.writeHead(200, {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="blood_bank_system.zip"'
            });
            res.end(data);
        });
        return;
    }

    // 3. Backend REST API Endpoints handled by Modular Router
    if (pathname.startsWith('/api/')) {
        const body = (method === 'POST' || method === 'PUT') ? await parseBody(req) : {};
        return await handleApiRequest(req, res, pathname, method, query, body);
    }

    // 4. Static File Serving for Frontend SPA
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = '/index.html';
    }
    const fullFilePath = path.join(PUBLIC_DIR, safePath);

    if (!fullFilePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        return res.end('Forbidden');
    }

    serveStaticFile(res, fullFilePath);
});

// Initialize database integration and start listening
async function startServer() {
    await db.initDatabase();
    
    server.listen(PORT, () => {
        const engineInfo = db.getEngineInfo();
        console.log(`=======================================================`);
        console.log(` LifeFlow Blood Bank Server is RUNNING!`);
        console.log(` URL: http://localhost:${PORT}`);
        console.log(` Active Database Engine: ${engineInfo.activeEngine}`);
        console.log(` Database Host: ${engineInfo.host} | DB: ${engineInfo.databaseName}`);
        console.log(` Driver: ${engineInfo.driver}`);
        console.log(`=======================================================`);
    });
}

startServer();

module.exports = server;

// ============================================================================
// AUTOMATED VERIFICATION TEST SUITE
// ============================================================================

const http = require('node:http');
const assert = require('node:assert');

const BASE_URL = 'http://localhost:3000';

function makeRequest(path, options = {}) {
    return new Promise((resolve, reject) => {
        const url = `${BASE_URL}${path}`;
        const req = http.request(url, options, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {}
                resolve({ status: res.statusCode, headers: res.headers, data: parsed, raw: data });
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        req.end();
    });
}

async function runTests() {
    console.log('--- Starting Blood Bank System Automated Test Suite ---');
    let passed = 0;
    let failed = 0;

    async function test(name, fn) {
        try {
            await fn();
            console.log(`  [PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`  [FAIL] ${name}:`, err.message);
            failed++;
        }
    }

    // 1. Static Asset Tests
    await test('Static server delivers index.html', async () => {
        const res = await makeRequest('/');
        assert.strictEqual(res.status, 200);
        assert.ok(res.raw.includes('LifeFlow'));
    });

    await test('Static server delivers styles.css', async () => {
        const res = await makeRequest('/css/styles.css');
        assert.strictEqual(res.status, 200);
        assert.ok(res.raw.includes('--primary-red'));
    });

    await test('Offline Chart.js bundle is available', async () => {
        const res = await makeRequest('/js/lib/chart.umd.js');
        assert.strictEqual(res.status, 200);
        assert.ok(res.raw.length > 50000);
    });

    // 2. Authentication API
    await test('Auth API validates credentials successfully', async () => {
        const res = await makeRequest('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { username: 'admin@bloodbank.org', password: 'admin123' }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.user.role, 'Admin');
    });

    await test('Auth API rejects invalid credentials', async () => {
        const res = await makeRequest('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: { username: 'admin', password: 'wrongpassword' }
        });
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
    });

    // 3. Dashboard API
    await test('Dashboard returns summary KPI metrics & activities', async () => {
        const res = await makeRequest('/api/dashboard');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        const { summary, inventory, recentDonations, recentRequests } = res.data.data;
        assert.ok(summary.totalDonors >= 10);
        assert.ok(summary.totalPatients >= 10);
        assert.ok(summary.availableUnits > 0);
        assert.strictEqual(inventory.length, 8);
        assert.ok(recentDonations.length > 0);
        assert.ok(recentRequests.length > 0);
    });

    // 4. Donors CRUD API
    let createdDonorId = null;
    await test('Donors API creates a new donor', async () => {
        const res = await makeRequest('/api/donors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                name: 'Test Donor Automate',
                age: 29,
                gender: 'Female',
                blood_group: 'B+',
                phone: '+1 (555) 777-8899',
                email: 'test.donor.auto@example.com',
                address: '100 University Ave, Seattle, WA',
                last_donation_date: '2026-06-15'
            }
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        createdDonorId = res.data.data.donor_id;
        assert.ok(createdDonorId > 0);
    });

    await test('Donors API updates existing donor', async () => {
        const res = await makeRequest(`/api/donors/${createdDonorId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: {
                name: 'Test Donor Automate Updated',
                age: 30,
                gender: 'Female',
                blood_group: 'B+',
                phone: '+1 (555) 777-8899',
                email: 'test.donor.auto@example.com',
                address: '200 Updated Boulevard, Seattle, WA',
                last_donation_date: '2026-08-01'
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.data.name, 'Test Donor Automate Updated');
    });

    await test('Donors API deletes donor', async () => {
        const res = await makeRequest(`/api/donors/${createdDonorId}`, {
            method: 'DELETE'
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    // 5. Blood Inventory API
    await test('Blood Inventory returns all 8 groups', async () => {
        const res = await makeRequest('/api/inventory');
        assert.strictEqual(res.status, 200);
        const groups = res.data.data.map(i => i.blood_group);
        const expected = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        expected.forEach(g => assert.ok(groups.includes(g)));
    });

    await test('Blood Inventory manual adjustment updates correctly', async () => {
        const res = await makeRequest('/api/inventory/AB-', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: { available_units: 7 }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.data.available_units, 7);
        assert.strictEqual(res.data.data.status, 'Low Stock');
    });

    // 6. Blood Donations & Inventory Synchronization
    await test('Donation automatically increments Blood Inventory', async () => {
        // Read current O+ units
        const invBefore = await makeRequest('/api/inventory');
        const oPlusBefore = invBefore.data.data.find(i => i.blood_group === 'O+').available_units;

        // Add donation of 2 units of O+
        const res = await makeRequest('/api/donations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                donor_id: 1,
                blood_group: 'O+',
                donation_date: '2026-09-27',
                quantity: 2,
                collection_center: 'Automated Test Drive',
                status: 'Completed'
            }
        });
        assert.strictEqual(res.status, 201);

        // Verify inventory increased by 2
        const invAfter = await makeRequest('/api/inventory');
        const oPlusAfter = invAfter.data.data.find(i => i.blood_group === 'O+').available_units;
        assert.strictEqual(oPlusAfter, oPlusBefore + 2);
    });

    // 7. Blood Requests & Fulfill Workflow
    await test('Blood Request fulfillment decrements inventory', async () => {
        // Create a test request for 1 unit of A+
        const reqRes = await makeRequest('/api/requests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: {
                patient_id: 2,
                blood_group: 'A+',
                required_units: 1,
                request_date: '2026-09-27',
                priority: 'Urgent',
                status: 'Approved'
            }
        });
        assert.strictEqual(reqRes.status, 201);
        const testReqId = reqRes.data.data.request_id;

        // Read A+ stock before fulfillment
        const invBefore = await makeRequest('/api/inventory');
        const aPlusBefore = invBefore.data.data.find(i => i.blood_group === 'A+').available_units;

        // Fulfill the request
        const fulfillRes = await makeRequest(`/api/requests/${testReqId}/fulfill`, {
            method: 'PUT'
        });
        assert.strictEqual(fulfillRes.status, 200);
        assert.strictEqual(fulfillRes.data.data.status, 'Fulfilled');

        // Check A+ stock decreased by 1
        const invAfter = await makeRequest('/api/inventory');
        const aPlusAfter = invAfter.data.data.find(i => i.blood_group === 'A+').available_units;
        assert.strictEqual(aPlusAfter, aPlusBefore - 1);
    });

    // 8. Database Schema & Inspection API
    await test('Schema API returns 6 tables with foreign keys and metadata', async () => {
        const res = await makeRequest('/api/database/schema');
        assert.strictEqual(res.status, 200);
        const tables = res.data.data.tables.map(t => t.name);
        assert.strictEqual(tables.length, 6);
        assert.ok(tables.includes('Donors'));
        assert.ok(tables.includes('Blood_Donations'));
        assert.ok(tables.includes('Blood_Requests'));
    });

    await test('Table Inspector returns raw SQLite records', async () => {
        const res = await makeRequest('/api/database/tables/Patients');
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.data.tableName, 'Patients');
        assert.ok(res.data.data.rows.length >= 10);
    });

    await test('Downloadable schema.sql script is accessible', async () => {
        const res = await makeRequest('/api/schema.sql');
        assert.strictEqual(res.status, 200);
        assert.ok(res.raw.includes('CREATE TABLE Donors'));
        assert.ok(res.raw.includes('FOREIGN KEY'));
    });

    console.log(`\n========================================`);
    console.log(` Test Summary: ${passed} Passed, ${failed} Failed`);
    console.log(`========================================\n`);

    if (failed === 0) {
        console.log('ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY! ✨');
        process.exit(0);
    } else {
        process.exit(1);
    }
}

// Give server 500ms to be listening
setTimeout(runTests, 500);

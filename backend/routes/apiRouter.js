// ============================================================================
// BACKEND API ROUTER
// Clean RESTful route dispatching to modular controllers
// ============================================================================

const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const donorController = require('../controllers/donorController');
const inventoryController = require('../controllers/inventoryController');
const donationController = require('../controllers/donationController');
const patientController = require('../controllers/patientController');
const requestController = require('../controllers/requestController');
const reportController = require('../controllers/reportController');
const schemaController = require('../controllers/schemaController');
const db = require('../config/database');

function sendJson(res, statusCode, data) {
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=UTF-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify(data));
}

function sendError(res, statusCode, message) {
    sendJson(res, statusCode, { success: false, error: message });
}

async function handleApiRequest(req, res, pathname, method, query, body) {
    try {
        // 1. Auth API
        if (pathname === '/api/auth/login' && method === 'POST') {
            try {
                const result = await authController.login(body.username, body.password);
                return sendJson(res, 200, { success: true, ...result });
            } catch (authErr) {
                return sendError(res, 401, authErr.message);
            }
        }

        // 2. Dashboard API
        if (pathname === '/api/dashboard' && method === 'GET') {
            const data = await dashboardController.getMetrics();
            return sendJson(res, 200, { success: true, data });
        }

        // 3. Database Info & Health Check
        if (pathname === '/api/database/status' && method === 'GET') {
            return sendJson(res, 200, { success: true, data: db.getEngineInfo() });
        }

        // 4. Donors API
        if (pathname === '/api/donors') {
            if (method === 'GET') {
                const donors = await donorController.getDonors(query.search, query.blood_group);
                return sendJson(res, 200, { success: true, data: donors });
            }
            if (method === 'POST') {
                const newDonor = await donorController.createDonor(body);
                return sendJson(res, 201, { success: true, data: newDonor, message: 'Donor registered successfully' });
            }
        }

        const donorMatch = pathname.match(/^\/api\/donors\/(\d+)$/);
        if (donorMatch) {
            const id = parseInt(donorMatch[1], 10);
            if (method === 'GET') {
                const donor = await donorController.getDonorById(id);
                if (!donor) return sendError(res, 404, 'Donor not found');
                return sendJson(res, 200, { success: true, data: donor });
            }
            if (method === 'PUT') {
                const updated = await donorController.updateDonor(id, body);
                return sendJson(res, 200, { success: true, data: updated, message: 'Donor updated successfully' });
            }
            if (method === 'DELETE') {
                const deleted = await donorController.deleteDonor(id);
                if (!deleted) return sendError(res, 404, 'Donor not found');
                return sendJson(res, 200, { success: true, message: 'Donor removed successfully' });
            }
        }

        // 5. Patients API
        if (pathname === '/api/patients') {
            if (method === 'GET') {
                const patients = await patientController.getPatients(query.search, query.blood_group, query.status);
                return sendJson(res, 200, { success: true, data: patients });
            }
            if (method === 'POST') {
                const newPatient = await patientController.createPatient(body);
                return sendJson(res, 201, { success: true, data: newPatient, message: 'Patient admitted successfully' });
            }
        }

        const patientMatch = pathname.match(/^\/api\/patients\/(\d+)$/);
        if (patientMatch) {
            const id = parseInt(patientMatch[1], 10);
            if (method === 'GET') {
                const patient = await patientController.getPatientById(id);
                if (!patient) return sendError(res, 404, 'Patient not found');
                return sendJson(res, 200, { success: true, data: patient });
            }
            if (method === 'PUT') {
                const updated = await patientController.updatePatient(id, body);
                return sendJson(res, 200, { success: true, data: updated, message: 'Patient updated successfully' });
            }
            if (method === 'DELETE') {
                const deleted = await patientController.deletePatient(id);
                if (!deleted) return sendError(res, 404, 'Patient not found');
                return sendJson(res, 200, { success: true, message: 'Patient removed successfully' });
            }
        }

        // 6. Blood Inventory API
        if (pathname === '/api/inventory' && method === 'GET') {
            const inventory = await inventoryController.getInventory();
            return sendJson(res, 200, { success: true, data: inventory });
        }

        const invMatch = pathname.match(/^\/api\/inventory\/([A-Za-z0-9+-]+)$/);
        if (invMatch && method === 'PUT') {
            const bloodGroup = decodeURIComponent(invMatch[1]);
            const updated = await inventoryController.updateUnits(bloodGroup, body.available_units);
            return sendJson(res, 200, { success: true, data: updated, message: `Stock for ${bloodGroup} updated` });
        }

        // 7. Blood Donations API
        if (pathname === '/api/donations') {
            if (method === 'GET') {
                const donations = await donationController.getDonations(query.search, query.blood_group);
                return sendJson(res, 200, { success: true, data: donations });
            }
            if (method === 'POST') {
                const donation = await donationController.createDonation(body);
                return sendJson(res, 201, { success: true, data: donation, message: 'Donation recorded and inventory synchronized!' });
            }
        }

        const donationMatch = pathname.match(/^\/api\/donations\/(\d+)$/);
        if (donationMatch) {
            const id = parseInt(donationMatch[1], 10);
            if (method === 'PUT') {
                const updated = await donationController.updateDonation(id, body);
                return sendJson(res, 200, { success: true, data: updated, message: 'Donation updated successfully' });
            }
            if (method === 'DELETE') {
                const deleted = await donationController.deleteDonation(id);
                return sendJson(res, 200, { success: true, message: 'Donation record removed' });
            }
        }

        // 8. Blood Requests API
        if (pathname === '/api/requests') {
            if (method === 'GET') {
                const requests = await requestController.getRequests(query.search, query.status, query.priority);
                return sendJson(res, 200, { success: true, data: requests });
            }
            if (method === 'POST') {
                const newRequest = await requestController.createRequest(body);
                return sendJson(res, 201, { success: true, data: newRequest, message: 'Blood request submitted successfully' });
            }
        }

        const reqFulfillMatch = pathname.match(/^\/api\/requests\/(\d+)\/fulfill$/);
        if (reqFulfillMatch && method === 'PUT') {
            const id = parseInt(reqFulfillMatch[1], 10);
            const fulfilled = await requestController.fulfillRequest(id);
            return sendJson(res, 200, {
                success: true,
                data: fulfilled,
                message: `Request #${id} fulfilled! Blood inventory decremented automatically.`
            });
        }

        const reqStatusMatch = pathname.match(/^\/api\/requests\/(\d+)\/status$/);
        if (reqStatusMatch && method === 'PUT') {
            const id = parseInt(reqStatusMatch[1], 10);
            const updated = await requestController.updateStatus(id, body.status);
            return sendJson(res, 200, { success: true, data: updated, message: `Status updated to ${body.status}` });
        }

        const reqMatch = pathname.match(/^\/api\/requests\/(\d+)$/);
        if (reqMatch) {
            const id = parseInt(reqMatch[1], 10);
            if (method === 'PUT') {
                const updated = await requestController.updateRequest(id, body);
                return sendJson(res, 200, { success: true, data: updated, message: 'Request updated successfully' });
            }
            if (method === 'DELETE') {
                const deleted = await requestController.deleteRequest(id);
                return sendJson(res, 200, { success: true, message: 'Blood request removed' });
            }
        }

        // 9. Reports API
        if (pathname === '/api/reports' && method === 'GET') {
            const reports = await reportController.getAnalytics();
            return sendJson(res, 200, { success: true, data: reports });
        }

        // 10. Database Schema & Inspection API
        if (pathname === '/api/database/schema' && method === 'GET') {
            const schema = await schemaController.getSchemaDetails();
            return sendJson(res, 200, { success: true, data: schema });
        }

        const tableRecordsMatch = pathname.match(/^\/api\/database\/tables\/([A-Za-z0-9_]+)$/);
        if (tableRecordsMatch && method === 'GET') {
            const tableName = tableRecordsMatch[1];
            const tableData = await schemaController.getTableRecords(tableName);
            return sendJson(res, 200, { success: true, data: tableData });
        }

        if (pathname === '/api/database/reset' && method === 'POST') {
            const resData = await schemaController.resetSeedData();
            return sendJson(res, 200, resData);
        }

        return sendError(res, 404, `Endpoint not found: ${method} ${pathname}`);
    } catch (err) {
        console.error(`[API Controller Error on ${method} ${pathname}]:`, err.message);
        return sendError(res, 400, err.message);
    }
}

module.exports = { handleApiRequest };

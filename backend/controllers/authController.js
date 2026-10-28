// ============================================================================
// BACKEND CONTROLLER: AUTHENTICATION
// ============================================================================

const db = require('../config/database');

const authController = {
    async login(usernameOrEmail, password) {
        if (!usernameOrEmail || !password) {
            throw new Error('Username/Email and Password are required');
        }

        const user = await db.queryOne(`
            SELECT user_id, username, email, role 
            FROM Users 
            WHERE (username = ? OR email = ?) AND password = ?
        `, [usernameOrEmail, usernameOrEmail, password]);

        if (!user) {
            throw new Error('Invalid credentials');
        }

        const token = 'token_' + Buffer.from(`${user.username}:${Date.now()}`).toString('base64');
        return {
            user: {
                userId: user.user_id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        };
    }
};

module.exports = authController;

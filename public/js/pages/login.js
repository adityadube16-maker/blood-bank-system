// ============================================================================
// PAGE CONTROLLER: LOGIN
// ============================================================================

window.loginPage = {
    render() {
        return `
            <div class="login-view-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-brand-icon">
                            <svg viewBox="0 0 24 24"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
                        </div>
                        <h2>LifeFlow Blood Bank</h2>
                        <p>Hospital & Blood Donation Management System</p>
                    </div>

                    <div class="demo-credentials-banner">
                        <div>
                            <strong>Demo Admin:</strong> <span style="font-family: monospace;">admin@bloodbank.org</span><br>
                            <strong>Password:</strong> <span style="font-family: monospace;">admin123</span>
                        </div>
                        <button type="button" class="btn btn-secondary btn-sm" id="btn-fill-demo">Autofill</button>
                    </div>

                    <form id="form-login">
                        <div class="form-group" style="margin-bottom: 1.2rem;">
                            <label class="form-label" for="login-email">Email or Username</label>
                            <input type="text" id="login-email" class="form-control" placeholder="Enter username or email" required>
                        </div>

                        <div class="form-group" style="margin-bottom: 1.5rem;">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <label class="form-label" for="login-password">Password</label>
                                <span id="toggle-pwd" style="font-size: 0.78rem; color: var(--primary-red); cursor: pointer; font-weight: 600;">Show</span>
                            </div>
                            <input type="password" id="login-password" class="form-control" placeholder="Enter password" required>
                        </div>

                        <button type="submit" class="btn btn-primary" style="width: 100%; padding: 0.75rem; font-size: 0.95rem;">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                            Secure Login
                        </button>
                    </form>

                    <div style="margin-top: 1.8rem; text-align: center; border-top: 1px solid var(--border-color); padding-top: 1rem; font-size: 0.78rem; color: var(--text-light);">
                        Department of Computer Science & Engineering • Academic Project
                    </div>
                </div>
            </div>
        `;
    },

    bindEvents() {
        const fillBtn = document.getElementById('btn-fill-demo');
        if (fillBtn) {
            fillBtn.addEventListener('click', () => {
                document.getElementById('login-email').value = 'admin@bloodbank.org';
                document.getElementById('login-password').value = 'admin123';
                app.showToast('Demo credentials autofilled!', 'info');
            });
        }

        const togglePwd = document.getElementById('toggle-pwd');
        if (togglePwd) {
            togglePwd.addEventListener('click', () => {
                const pwdInput = document.getElementById('login-password');
                if (pwdInput.type === 'password') {
                    pwdInput.type = 'text';
                    togglePwd.textContent = 'Hide';
                } else {
                    pwdInput.type = 'password';
                    togglePwd.textContent = 'Show';
                }
            });
        }

        const form = document.getElementById('form-login');
        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const username = document.getElementById('login-email').value.trim();
                const password = document.getElementById('login-password').value.trim();

                try {
                    const result = await api.login(username, password);
                    if (result.success) {
                        localStorage.setItem('lifeFlow_user', JSON.stringify(result.user));
                        localStorage.setItem('lifeFlow_token', result.token);
                        app.showToast(`Welcome back, ${result.user.username}!`, 'success');
                        app.currentUser = result.user;
                        app.navigateTo('dashboard');
                    }
                } catch (err) {
                    app.showToast(err.message || 'Login failed. Please check credentials.', 'error');
                }
            });
        }
    }
};

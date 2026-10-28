// ============================================================================
// BLOOD BANK MANAGEMENT SYSTEM - MAIN APPLICATION CONTROLLER & ROUTER
// ============================================================================

window.app = {
    currentPage: 'dashboard',
    currentUser: null,

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.startClock();
        this.updateDatabaseStatus();

        // Listen for browser back/forward or hash change
        window.addEventListener('hashchange', () => {
            const route = window.location.hash.replace('#', '') || 'dashboard';
            this.navigateTo(route, false);
        });

        const initialRoute = window.location.hash.replace('#', '') || 'dashboard';
        this.navigateTo(initialRoute, false);
    },

    async updateDatabaseStatus() {
        try {
            const res = await api.request('/database/status');
            const el = document.getElementById('nav-db-text');
            if (el && res.data) {
                el.textContent = `Database: ${res.data.activeEngine}`;
            }
        } catch (e) {
            console.warn('Could not fetch DB status:', e.message);
        }
    },

    checkAuth() {
        const storedUser = localStorage.getItem('lifeFlow_user');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.updateUserCard();
            } catch (e) {
                this.currentUser = null;
            }
        }
    },

    updateUserCard() {
        const avatar = document.getElementById('user-avatar-initials');
        const name = document.getElementById('user-card-name');
        const role = document.getElementById('user-card-role');

        if (this.currentUser) {
            if (avatar) avatar.textContent = this.currentUser.username.substring(0, 2).toUpperCase();
            if (name) name.textContent = this.currentUser.username;
            if (role) role.textContent = this.currentUser.role || 'Admin';
        }
    },

    setupEventListeners() {
        // Mobile Sidebar Toggle
        const btnMobile = document.getElementById('btn-mobile-toggle');
        const sidebar = document.getElementById('app-sidebar');
        if (btnMobile && sidebar) {
            btnMobile.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });

            // Close on nav link click on mobile
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 768) {
                        sidebar.classList.remove('open');
                    }
                });
            });
        }

        // Global Modal Close
        const modalOverlay = document.getElementById('global-modal-overlay');
        const btnCloseModal = document.getElementById('btn-close-modal');
        const btnCancelModal = document.getElementById('btn-modal-cancel');

        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) this.closeModal();
            });
        }
        if (btnCloseModal) btnCloseModal.addEventListener('click', () => this.closeModal());
        if (btnCancelModal) btnCancelModal.addEventListener('click', () => this.closeModal());

        // Logout Button
        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', () => this.logout());
        }
    },

    startClock() {
        const clockEl = document.getElementById('nav-live-clock');
        if (!clockEl) return;
        const update = () => {
            const now = new Date();
            clockEl.textContent = now.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
        };
        update();
        setInterval(update, 30000);
    },

    async navigateTo(pageId, pushState = true) {
        // If not logged in and trying to access app pages, redirect to login
        if (!this.currentUser && pageId !== 'login') {
            pageId = 'login';
        }

        this.currentPage = pageId;
        if (pushState) {
            window.location.hash = pageId;
        }

        const appShell = document.getElementById('app-shell');
        const loginContainer = document.getElementById('login-view-root');
        const pageTitle = document.getElementById('page-title-text');
        const pageSubtitle = document.getElementById('page-subtitle-text');
        const contentContainer = document.getElementById('content-area');

        // Handle Login Page separately (no sidebar shell)
        if (pageId === 'login') {
            if (appShell) appShell.style.display = 'none';
            if (loginContainer) {
                loginContainer.style.display = 'block';
                loginContainer.innerHTML = window.loginPage.render();
                window.loginPage.bindEvents();
            }
            return;
        }

        // Inside Main Application
        if (loginContainer) loginContainer.style.display = 'none';
        if (appShell) appShell.style.display = 'flex';

        // Update active navigation item
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-page') === pageId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Set titles based on route
        const pageMeta = {
            dashboard: { title: 'Operational Dashboard', subtitle: 'Overview of blood reserves, urgent cases & daily donations' },
            donors: { title: 'Donor Directory', subtitle: 'Verified blood donors, donation records & eligibility status' },
            inventory: { title: 'Blood Inventory', subtitle: 'Cold storage unit reserves & threshold alerts' },
            donations: { title: 'Donation Management', subtitle: 'Intake logging, clearance & auto-inventory sync' },
            patients: { title: 'Hospital Patients', subtitle: 'Patient admissions, emergency cases & requisitions' },
            requests: { title: 'Blood Requisitions', subtitle: 'Hospital blood orders, urgency triage & atomic dispatch' },
            reports: { title: 'Reports & Analytics', subtitle: 'Inventory audit, fulfillment ratios & clinical demand' },
            schema: { title: 'Database Design & ERD', subtitle: 'Relational 3NF architecture, foreign keys & live tables' }
        };

        const meta = pageMeta[pageId] || { title: 'Blood Bank System', subtitle: 'Management portal' };
        if (pageTitle) pageTitle.textContent = meta.title;
        if (pageSubtitle) pageSubtitle.textContent = meta.subtitle;

        // Render Page View
        const pageController = window[`${pageId}Page`];
        if (pageController && contentContainer) {
            contentContainer.innerHTML = await pageController.render();
            if (pageController.bindEvents) {
                await pageController.bindEvents();
            }
        }
    },

    // -------------------------------------------------------------
    // MODAL DIALOG CONTROLLER
    // -------------------------------------------------------------
    openModal({ title, body, confirmText = 'Save', showConfirm = true, cancelText = 'Cancel', onConfirm = null }) {
        const overlay = document.getElementById('global-modal-overlay');
        const titleEl = document.getElementById('modal-title-text');
        const bodyEl = document.getElementById('modal-body-container');
        const btnConfirm = document.getElementById('btn-modal-confirm');
        const btnCancel = document.getElementById('btn-modal-cancel');

        if (!overlay) return;

        titleEl.textContent = title;
        bodyEl.innerHTML = body;

        btnConfirm.textContent = confirmText;
        btnConfirm.style.display = showConfirm ? 'inline-flex' : 'none';
        btnCancel.textContent = cancelText;

        // Clear existing click listeners
        const newBtnConfirm = btnConfirm.cloneNode(true);
        btnConfirm.parentNode.replaceChild(newBtnConfirm, btnConfirm);

        if (showConfirm && onConfirm) {
            newBtnConfirm.addEventListener('click', async () => {
                const shouldClose = await onConfirm();
                if (shouldClose !== false) {
                    this.closeModal();
                }
            });
        }

        overlay.classList.add('active');
    },

    closeModal() {
        const overlay = document.getElementById('global-modal-overlay');
        if (overlay) overlay.classList.remove('active');
    },

    // -------------------------------------------------------------
    // CONFIRMATION DIALOG HELPER
    // -------------------------------------------------------------
    confirmDialog({ title = 'Confirm Action', message, confirmText = 'Confirm', onConfirm }) {
        const body = `
            <div style="font-size: 0.95rem; color: var(--text-main); line-height: 1.6;">
                ${message}
            </div>
        `;
        this.openModal({
            title,
            body,
            confirmText,
            showConfirm: true,
            cancelText: 'Cancel',
            onConfirm: async () => {
                await onConfirm();
                return true;
            }
        });
    },

    // -------------------------------------------------------------
    // TOAST NOTIFICATION SYSTEM
    // -------------------------------------------------------------
    showToast(message, type = 'info', title = null) {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const defaultTitles = {
            success: 'Success',
            error: 'Notice / Error',
            info: 'System Update'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div style="flex: 1;">
                <div class="toast-title">${title || defaultTitles[type] || 'LifeFlow'}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto remove after 4.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 4500);
    },

    // -------------------------------------------------------------
    // GLOBAL QUICK ACTION HELPERS
    // -------------------------------------------------------------
    openNewDonationModal() {
        if (window.donationsPage && window.donationsPage.openFormModal) {
            window.donationsPage.openFormModal();
        } else {
            this.navigateTo('donations');
        }
    },

    openNewRequestModal() {
        if (window.requestsPage && window.requestsPage.openFormModal) {
            window.requestsPage.openFormModal();
        } else {
            this.navigateTo('requests');
        }
    },

    // -------------------------------------------------------------
    // AUTH LOGOUT
    // -------------------------------------------------------------
    logout() {
        localStorage.removeItem('lifeFlow_user');
        localStorage.removeItem('lifeFlow_token');
        this.currentUser = null;
        this.showToast('You have been logged out successfully.', 'info');
        this.navigateTo('login');
    }
};

// Initialize App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

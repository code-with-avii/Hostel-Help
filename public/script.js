
// Login-only logic (runs only when login form exists)

// Login logic for pages with inline login form (index.html)
(function setupLoginPageLogic() {
    const loginForm = document.getElementById('login-form');
    const loginPage = document.getElementById('login-page');
    const mainApp = document.getElementById('main-app');
    if (!loginForm) return; // No login form on this page

    const message = document.getElementById('login-message');

    function showMsg(text, ok = false) {
        if (!message) return;
        message.style.color = ok ? 'green' : 'red';
        message.textContent = (ok ? '✅ ' : '❌ ') + text;
    }

    function completeLogin() {
        if (loginPage) loginPage.style.display = 'none';
        if (mainApp) mainApp.style.display = '';
    }

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailEl = document.getElementById('login-email');
        
        const email = (emailEl ? emailEl.value : '').trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        // Admin default credentials
        if (email === 'admin@hostel.com' && password === 'admin@123') {
            try {
                localStorage.setItem('hms_current_user', email);
                localStorage.setItem('hms_user_role', 'admin');
            } catch (_) {}
            showMsg('Admin login successful!', true);
            setTimeout(() => completeLogin(), 300);
            return;
        }

        // Demo user password
        // if (password === 'login-password') {
        //     try {
        //         if (email) localStorage.setItem('hms_current_user', email);
        //         localStorage.setItem('hms_user_role', 'user');
        //     } catch (_) {}
        //     showMsg('Login successful!', true);
        //     setTimeout(() => completeLogin(), 300);
        // } else {
        //     showMsg('Incorrect email or password.', false);
        // }
    });

    // Fallback for inline onclick on the Login button
    window.login = function login() {
        const emailEl = document.getElementById('login-email');
        const email = (emailEl ? emailEl.value : '').trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (email === 'admin@hostel.com' && password === 'admin@123') {
            try {
                localStorage.setItem('hms_current_user', email);
                localStorage.setItem('hms_user_role', 'admin');
            } catch (_) {}
            completeLogin();
            return;
        }

        if (password === 'login-password') {
            try {
                if (email) localStorage.setItem('hms_current_user', email);
                localStorage.setItem('hms_user_role', 'user');
            } catch (_) {}
            completeLogin();
        } else if (message) {
            showMsg('Incorrect email or password.', false);
        }
    };

    // Signup/Login toggles for links
    window.showSignup = function showSignup(event) {
        if (event) event.preventDefault();
        if (loginContainer) loginContainer.style.display = 'none';
        if (signupContainer) signupContainer.style.display = 'flex';
    };

    window.showLogin = function showLogin(event) {
        if (event) event.preventDefault();
        if (signupContainer) signupContainer.style.display = 'none';
        if (loginContainer) loginContainer.style.display = 'flex';
    };
})();
// Hostel Management System JavaScript

class HostelManagementSystem {
    constructor() {
        this.complaints = [];
        this.currentSection = 'dashboard';
        this.displayFirstName = '';
        this.init();
    }

    async init() {
        // Auth guard: redirect to signin if not logged in
        const email = this.getCurrentUserEmail();
        if (!email || email === 'guest@example.com') {
            window.location.href = 'signin.html';
            return;
        }
        this.setupEventListeners();
        await this.loadComplaints();
        this.updateDashboard();
        this.updateComplaintsList();
        this.updateProfileStats();
        this.initProfileForm();
        this.initAdminNav();
        // If admin is logged in, default to Admin view
        if (this.isAdmin()) {
            this.showSection('admin');
        }
        this.updateAuthUI();
    }

    updateAuthUI() {
        // Update current user label and bind logout button
        const email = this.getCurrentUserEmail();
        const role = this.getCurrentUserRole();

        const userLabel = document.getElementById('current-user-label');
        if (userLabel) {
            if (email && email !== 'guest@example.com') {
                const roleDisplay = role === 'admin' ? 'Admin' : 'User';
                userLabel.textContent = `${email} • ${roleDisplay}`;
                userLabel.classList.remove('no-data');
            } else {
                userLabel.textContent = '';
                userLabel.classList.add('no-data');
            }
        }

        // Avatar removed per request

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn && !logoutBtn._hmsBound) {
            logoutBtn._hmsBound = true;
            logoutBtn.addEventListener('click', () => {
                try {
                    localStorage.removeItem('hms_current_user');
                    localStorage.removeItem('hms_user_role');
                    localStorage.removeItem('hms_token');
                } catch (_) {}
                window.location.href = 'signin.html';
            });
        }

        // Optional: toggle unauthenticated banner if present
        const unauth = document.getElementById('unauthenticated');
        const mainApp = document.getElementById('main-app');
        if (unauth && mainApp) {
            const loggedIn = !!email && email !== 'guest@example.com';
            unauth.style.display = loggedIn ? 'none' : '';
            mainApp.style.display = loggedIn ? '' : 'none';
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Complaint form
        const complaintForm = document.getElementById('complaint-form');
        if (complaintForm) {
            complaintForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('[HMS] complaint-form submit event');
                this.submitComplaint();
            });
            console.log('[HMS] Bound submit handler to #complaint-form');
        } else {
            console.warn('[HMS] #complaint-form not found at setupEventListeners');
        }

        // Filters
        document.getElementById('status-filter').addEventListener('change', async () => {
            await this.loadComplaintsWithFilters();
            this.updateComplaintsList();
        });

        document.getElementById('category-filter').addEventListener('change', async () => {
            await this.loadComplaintsWithFilters();
            this.updateComplaintsList();
        });

        const dateFilterEl = document.getElementById('date-filter');
        if (dateFilterEl) {
            dateFilterEl.addEventListener('change', async () => {
                await this.loadComplaintsWithFilters();
                this.updateComplaintsList();
            });
        }

        // Admin filters
        const adminStatus = document.getElementById('admin-status-filter');
        const adminCategory = document.getElementById('admin-category-filter');
        if (adminStatus && adminCategory) {
            adminStatus.addEventListener('change', async () => {
                await this.loadAdminComplaints();
                this.updateAdminTable();
            });
            adminCategory.addEventListener('change', async () => {
                await this.loadAdminComplaints();
                this.updateAdminTable();
            });
        }
    }

    initAdminNav() {
        const isAdminUser = this.isAdmin();
        const navAdmin = document.getElementById('nav-admin');
        if (navAdmin) {
            navAdmin.style.display = isAdminUser ? '' : 'none';
        }
        if (isAdminUser) {
            // Hide all non-admin navigation items
            const hideSelectors = ['dashboard','complaints','resolved','profile'];
            hideSelectors.forEach(sec => {
                const navLink = document.querySelector(`[data-section="${sec}"]`);
                if (navLink) navLink.style.display = 'none';
                const sectionEl = document.getElementById(sec);
                if (sectionEl) sectionEl.style.display = 'none';
            });
        }
        
        // Hide complaint submission for admin users
        const complaintsNav = document.querySelector('[data-section="complaints"]');
        if (complaintsNav && isAdminUser) {
            complaintsNav.style.display = 'none';
        }

        // Additionally, if admin lands on the complaints section directly, disable form and show banner
        if (isAdminUser) {
            const complaintForm = document.getElementById('complaint-form');
            if (complaintForm) {
                const submitBtn = complaintForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.title = 'Admins cannot submit complaints. Use the Admin tab to manage complaints.';
                }
                const container = complaintForm.closest('.complaint-form-container') || complaintForm.parentElement;
                if (container && !container.querySelector('#admin-no-submit-banner')) {
                    const banner = document.createElement('div');
                    banner.id = 'admin-no-submit-banner';
                    banner.className = 'no-data';
                    banner.style.marginBottom = '10px';
                    banner.textContent = 'Admins cannot create complaints. Please use the Admin section to manage complaints.';
                    container.prepend(banner);
                }
            }
        }
    }

    getCurrentUserEmail() {
        try {
            return localStorage.getItem('hms_current_user') || 'guest@example.com';
        } catch (_) {
            return 'guest@example.com';
        }
    }

    getCurrentUserRole() {
        try {
            return localStorage.getItem('hms_user_role') || 'user';
        } catch (_) {
            return 'user';
        }
    }

    isAdmin() {
        // Determine admin role from stored role value
        return (this.getCurrentUserRole() === 'admin');
    }

    getToken() {
        try {
            return localStorage.getItem('hms_token') || '';
        } catch (_) {
            return '';
        }
    }

    getProfileStorageKey() {
        const email = this.getCurrentUserEmail();
        return `hms_profile_${email.toLowerCase()}`;
    }

    loadProfile() {
        try {
            const raw = localStorage.getItem(this.getProfileStorageKey());
            if (!raw) return { year: '', department: '', number: '' };
            const data = JSON.parse(raw);
            return {
                year: data.year || '',
                department: data.department || '',
                number: data.number || ''
            };
        } catch (_) {
            return { year: '', department: '', number: '' };
        }
    }

    saveProfile(profile) {
        try {
            localStorage.setItem(this.getProfileStorageKey(), JSON.stringify(profile));
            return true;
        } catch (_) {
            return false;
        }
    }

    initProfileForm() {
        const form = document.getElementById('profile-form');
        if (!form) return;

        const yearInput = document.getElementById('profile-year');
        const deptInput = document.getElementById('profile-department');
        const numInput = document.getElementById('profile-number');
        const msg = document.getElementById('profile-message');
        const info = document.getElementById('profile-info');
        const quick = document.getElementById('profile-quick-details');
        const editBtn = document.getElementById('edit-profile-btn');
        const formContainer = document.getElementById('profile-form-container');

        this.fetchProfileFromAPI().then((current) => {
            yearInput.value = current.year || '';
            deptInput.value = current.department || '';
            numInput.value = current.number || '';
            this.profileMeta = { memberSinceYear: current.memberSinceYear || '' };
            // Snapshot for cancel
            this._lastLoadedProfile = {
                year: yearInput.value,
                department: deptInput.value,
                number: numInput.value,
            };
            this.updateAuthUI();
            this.updateProfileDisplay(current);
            this.updateQuickDetails(current);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const profile = {
                year: yearInput.value.trim(),
                department: deptInput.value.trim(),
                number: numInput.value.trim()
            };
            this.saveProfileToAPI(profile).then((ok) => {
                if (msg) {
                    msg.textContent = ok ? 'Profile saved.' : 'Failed to save profile.';
                    msg.style.color = ok ? 'green' : 'red';
                }
                this.updateProfileDisplay(profile);
                this.updateQuickDetails(profile);
                if (ok && formContainer) {
                    formContainer.style.display = 'none';
                    // Update snapshot after successful save
                    this._lastLoadedProfile = { ...profile };
                }
            });
        });

        // Cancel button
        const cancelBtn = document.getElementById('cancel-edit-profile-btn');
        if (cancelBtn && !cancelBtn._hmsBound) {
            cancelBtn._hmsBound = true;
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const snap = this._lastLoadedProfile || { year: '', department: '', number: '' };
                yearInput.value = snap.year || '';
                deptInput.value = snap.department || '';
                numInput.value = snap.number || '';
                if (formContainer) formContainer.style.display = 'none';
                if (msg) { msg.textContent = ''; msg.removeAttribute('style'); }
            });
        }

        if (info && quick) {
            info.addEventListener('click', () => {
                const isHidden = quick.style.display === 'none' || quick.style.display === '';
                quick.style.display = isHidden ? 'block' : 'none';
            });
        }

        if (editBtn && formContainer) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const willShow = formContainer.style.display === 'none' || formContainer.style.display === '';
                formContainer.style.display = willShow ? 'block' : 'none';
            });
        }
    }

    updateProfileDisplay(profile) {
        const dYear = document.getElementById('display-year');
        const dDept = document.getElementById('display-department');
        const dNum = document.getElementById('display-number');
        const dSince = document.getElementById('profile-member-since');
        if (dYear) dYear.textContent = profile.year || '-';
        if (dDept) dDept.textContent = profile.department || '-';
        if (dNum) dNum.textContent = profile.number || '-';
        if (dSince) dSince.textContent = (this.profileMeta?.memberSinceYear || '-');
    }

    async fetchProfileFromAPI() {
        const email = this.getCurrentUserEmail();
        try {
            const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
            if (res.ok) return await res.json();
        } catch (_) {}
        return { year: '', department: '', number: '' };
    }

    async saveProfileToAPI(profile) {
        try {
            const email = this.getCurrentUserEmail();
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...profile, email })
            });
            return res.ok;
        } catch (_) {
            return false;
        }
    }
    updateQuickDetails(profile) {
        const qYear = document.getElementById('qd-year');
        const qDept = document.getElementById('qd-department');
        const qNum = document.getElementById('qd-number');
        if (qYear) qYear.textContent = profile.year || '-';
        if (qDept) qDept.textContent = profile.department || '-';
        if (qNum) qNum.textContent = profile.number || '-';
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // Remove active class from all nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        // Show selected section
        document.getElementById(sectionName).classList.add('active');
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;

        // Update content based on section
        if (sectionName === 'dashboard') {
            this.updateDashboard();
        } else if (sectionName === 'resolved') {
            this.loadComplaintsWithFilters();
            this.updateComplaintsList();
        } else if (sectionName === 'profile') {
            this.updateProfileStats();
        } else if (sectionName === 'admin') {
            this.ensureAdminVisibility();
            this.loadAdminComplaints().then(() => this.updateAdminTable());
        }
    }

    async submitComplaint() {
        console.log('[HMS] submitComplaint() invoked');
        // Check if user is admin - admins cannot create complaints
        if (this.isAdmin()) {
            this.showMessage('Admins cannot create complaints. Admins can only manage existing complaints.', 'error');
            return;
        }
        
        const form = document.getElementById('complaint-form');
        const formData = new FormData(form);
        
        // Basic phone validation (10 digits)
        const rawContact = (formData.get('contactNumber') || '').toString().trim();
        const phoneOk = /^[0-9]{10}$/.test(rawContact);
        if (!phoneOk) {
            this.showMessage('Please enter a valid 10-digit contact number.', 'error');
            return;
        }

        // Confirmation before submit
        const confirmed = window.confirm('Submit this complaint?');
        if (!confirmed) return;
        
        const complaintData = {
            studentName: formData.get('studentName'),
            roomNumber: formData.get('roomNumber'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            description: formData.get('description'),
            contactNumber: rawContact,
            status: 'pending'
        };

        try {
            const token = this.getToken();
            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(complaintData)
            });

            if (response.ok) {
                const newComplaint = await response.json();
                this.complaints.push(newComplaint);
                this.showMessage('Complaint submitted successfully!', 'success');
                form.reset();
                
                // Update dashboard and lists
                this.updateDashboard();
                this.updateProfileStats();
                // Navigate to All Issues and reload from server so the new complaint is visible there
                this.showSection('resolved');
                await this.loadComplaintsWithFilters();
                this.updateComplaintsList();
            } else {
                const error = await response.json();
                this.showMessage(`Error: ${error.error}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting complaint:', error);
            this.showMessage('Failed to submit complaint. Please try again.', 'error');
        }
    }

    updateDashboard() {
        const totalComplaints = this.complaints.length;
        const pendingComplaints = this.complaints.filter(c => c.status === 'pending').length;
        const resolvedComplaints = this.complaints.filter(c => c.status === 'resolved').length;
        const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

        // Update stats
        document.getElementById('total-complaints').textContent = totalComplaints;
        document.getElementById('pending-complaints').textContent = pendingComplaints;
        document.getElementById('resolved-complaints').textContent = resolvedComplaints;
        document.getElementById('resolution-rate').textContent = resolutionRate + '%';

        // Update recent complaints
        this.updateRecentComplaints();
    }

    updateRecentComplaints() {
        const recentComplaintsContainer = document.getElementById('recent-complaints-list');
        const recentComplaints = this.complaints
            .sort((a, b) => new Date(a.submittedDate) - new Date(b.submittedDate))
            .slice(0, 5);

        if (recentComplaints.length === 0) {
            recentComplaintsContainer.innerHTML = '<p class="no-data">No complaints submitted yet</p>';
            return;
        }

        recentComplaintsContainer.innerHTML = recentComplaints.map(complaint => `
            <div class="complaint-item">
                <h4>${this.getCategoryDisplayName(complaint.category)}</h4>
                <p><strong>Room:</strong> ${complaint.roomNumber} | <strong>Status:</strong> ${this.getStatusDisplayName(complaint.status)}</p>
                <p><strong>Submitted:</strong> ${this.formatDate(complaint.submittedDate)}</p>
            </div>
        `).join('');
    }

    updateComplaintsList() {
        const complaintsListContainer = document.getElementById('complaints-list');

        if (this.complaints.length === 0) {
            complaintsListContainer.innerHTML = '<p class="no-data">No complaints found matching the selected filters</p>';
            return;
        }

        complaintsListContainer.innerHTML = this.complaints.map(complaint => this.createComplaintCard(complaint)).join('');
    }

    createComplaintCard(complaint) {
        const statusClass = complaint.status.replace(' ', '-');
        const priorityColor = this.getPriorityColor(complaint.priority);
        
        const isAdmin = this.isAdmin();
        return `
            <div class="complaint-card ${statusClass}">
                <div class="complaint-header">
                    <div class="complaint-title">${this.getCategoryDisplayName(complaint.category)}</div>
                    <div class="status-badge ${statusClass}">${this.getStatusDisplayName(complaint.status)}</div>
                </div>
                
                <div class="complaint-details">
                    <div class="detail-item">
                        <div class="detail-label">Student Name</div>
                        <div class="detail-value">${complaint.studentName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Room Number</div>
                        <div class="detail-value">${complaint.roomNumber}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Priority</div>
                        <div class="detail-value" style="color: ${priorityColor}">${complaint.priority.toUpperCase()}</div>
                    </div>
                    ${isAdmin && complaint.contactNumber ? `
                    <div class="detail-item">
                        <div class="detail-label">Contact</div>
                        <div class="detail-value">${complaint.contactNumber}</div>
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <div class="detail-label">Submitted</div>
                        <div class="detail-value">${this.formatDate(complaint.submittedDate)}</div>
                    </div>
                    ${complaint.resolvedDate ? `
                    <div class="detail-item">
                        <div class="detail-label">Resolved</div>
                        <div class="detail-value">${this.formatDate(complaint.resolvedDate)}</div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="complaint-description">
                    <strong>Description:</strong> ${complaint.description}
                </div>
                
                ${complaint.resolution ? `
                <div class="complaint-description">
                    <strong>Resolution:</strong> ${complaint.resolution}
                </div>
                ` : ''}
                
                ${isAdmin ? `
                <div class="complaint-actions">
                    ${complaint.status === 'pending' ? `
                        <button class="btn btn-primary btn-small" onclick="hostelSystem.updateComplaintStatus('${complaint._id}', 'in-progress')">
                            <i class="fas fa-play"></i> Mark In Progress
                        </button>
                        <button class="btn btn-primary btn-small" onclick="hostelSystem.resolveComplaint('${complaint._id}')">
                            <i class="fas fa-check"></i> Resolve
                        </button>
                    ` : complaint.status === 'in-progress' ? `
                        <button class="btn btn-primary btn-small" onclick="hostelSystem.resolveComplaint('${complaint._id}')">
                            <i class="fas fa-check"></i> Resolve
                        </button>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        `;
    }

    async updateComplaintStatus(complaintId, newStatus) {
        try {
            const token = this.getToken();
            const response = await fetch(`/api/admin/complaints/${complaintId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                    'x-user-email': this.getCurrentUserEmail()
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updatedComplaint = await response.json();
                const index = this.complaints.findIndex(c => c._id === complaintId);
                if (index !== -1) {
                    this.complaints[index] = updatedComplaint;
                }
                this.updateComplaintsList();
                this.updateDashboard();
                this.showMessage(`Complaint status updated to ${this.getStatusDisplayName(newStatus)}`, 'success');
            } else {
                let errMsg = 'Request failed';
                try {
                    const error = await response.json();
                    errMsg = error.error || JSON.stringify(error);
                } catch (_) {
                    const text = await response.text();
                    errMsg = text || errMsg;
                }
                this.showMessage(`Error: ${errMsg}`, 'error');
            }
        } catch (error) {
            console.error('Error updating complaint status:', error);
            this.showMessage('Failed to update complaint status. Please try again.', 'error');
        }
    }

    async resolveComplaint(complaintId) {
        const resolution = prompt('Please enter the resolution details:');
        if (resolution && resolution.trim()) {
            try {
                const token = this.getToken();
                const response = await fetch(`/api/admin/complaints/${complaintId}/resolve`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                        'x-user-email': this.getCurrentUserEmail()
                    },
                    body: JSON.stringify({ resolution: resolution.trim() })
                });

                if (response.ok) {
                    const updatedComplaint = await response.json();
                    const index = this.complaints.findIndex(c => c._id === complaintId);
                    if (index !== -1) {
                        this.complaints[index] = updatedComplaint;
                    }
                    this.updateComplaintsList();
                    this.updateDashboard();
                    this.showMessage('Complaint resolved successfully!', 'success');
                } else {
                    let errMsg = 'Request failed';
                    try {
                        const error = await response.json();
                        errMsg = error.error || JSON.stringify(error);
                    } catch (_) {
                        const text = await response.text();
                        errMsg = text || errMsg;
                    }
                    this.showMessage(`Error: ${errMsg}`, 'error');
                }
            } catch (error) {
                console.error('Error resolving complaint:', error);
                this.showMessage('Failed to resolve complaint. Please try again.', 'error');
            }
        }
    }

    async deleteComplaint(complaintId) {
        if (confirm('Are you sure you want to delete this complaint?')) {
            try {
                const token = this.getToken();
                const response = await fetch(`/api/complaints/${complaintId}`, {
                    method: 'DELETE',
                    headers: {
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    }
                });

                if (response.ok) {
                    this.complaints = this.complaints.filter(c => c._id !== complaintId);
                    this.updateComplaintsList();
                    this.updateDashboard();
                    this.updateProfileStats();
                    this.showMessage('Complaint deleted successfully!', 'success');
                } else {
                    const error = await response.json();
                    this.showMessage(`Error: ${error.error}`, 'error');
                }
            } catch (error) {
                console.error('Error deleting complaint:', error);
                this.showMessage('Failed to delete complaint. Please try again.', 'error');
            }
        }
    }

    updateProfileStats() {
        const totalComplaints = this.complaints.length;
        const resolvedComplaints = this.complaints.filter(c => c.status === 'resolved').length;

        document.getElementById('profile-total').textContent = totalComplaints;
        document.getElementById('profile-resolved').textContent = resolvedComplaints;
    }

    // Utility functions
    getStatusDisplayName(status) {
        const map = {
            'pending': 'Pending',
            'in-progress': 'In Progress',
            'resolved': 'Resolved'
        };
        return map[status] || status;
    }
    getCategoryDisplayName(category) {
        const categoryNames = {
            'electrical': 'Electrical Issues',
            'plumbing': 'Plumbing Problems',
            'wifi': 'WiFi/Internet',
            'cleaning': 'Cleaning & Maintenance',
            'security': 'Security Concerns',
            'noise': 'Noise Complaints',
            'furniture': 'Furniture Issues',
            'other': 'Other Issues'
        };
        return categoryNames[category] || category;
    }
    getPriorityColor(priority) {
        const colors = {
            'low': '#27ae60',
            'medium': '#f39c12',
            'high': '#e74c3c',
            'urgent': '#8e44ad'
        };
        return colors[priority] || '#7f8c8d';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    showMessage(message, type = 'success') {
        const messageContainer = document.getElementById('message-container');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;
        
        messageContainer.appendChild(messageElement);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            messageElement.remove();
        }, 3000);
    }

    // API functions
    async loadComplaints() {
        try {
            const response = await fetch('/api/complaints');
            if (response.ok) {
                this.complaints = await response.json();
            } else {
                console.error('Failed to load complaints');
                this.complaints = [];
            }
        } catch (error) {
            console.error('Error loading complaints:', error);
            this.complaints = [];
        }
    }

    // Persist complaints locally (used by import/export helpers)
    saveComplaints() {
        try {
            localStorage.setItem('hms_complaints_cache', JSON.stringify(this.complaints || []));
        } catch (_) {}
    }

    async loadComplaintsWithFilters() {
        try {
            const statusFilter = document.getElementById('status-filter').value;
            const categoryFilter = document.getElementById('category-filter').value;
            const dateFilter = (document.getElementById('date-filter')?.value) || 'all';
            
            let url = '/api/complaints?';
            const params = new URLSearchParams();
            
            if (statusFilter && statusFilter !== 'all') {
                params.append('status', statusFilter);
            }
            
            if (categoryFilter && categoryFilter !== 'all') {
                params.append('category', categoryFilter);
            }
            
            url += params.toString();
            
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                this.complaints = this.filterComplaintsByDate(data, dateFilter);
            } else {
                console.error('Failed to load complaints with filters');
            }
        } catch (error) {
            console.error('Error loading complaints with filters:', error);
        }
    }

    filterComplaintsByDate(list, dateFilter) {
        if (!Array.isArray(list) || dateFilter === 'all') return list || [];
        const now = new Date();
        const msInDay = 24 * 60 * 60 * 1000;
        let thresholdMs = 0;
        if (dateFilter === 'day') thresholdMs = msInDay;
        else if (dateFilter === 'week') thresholdMs = 7 * msInDay;
        else if (dateFilter === 'month') thresholdMs = 30 * msInDay;
        if (!thresholdMs) return list;
        const getDate = (c) => new Date(c?.submittedDate || c?.createdAt || c?.updatedAt || 0).getTime();
        return list.filter(c => {
            const t = getDate(c);
            if (!t) return false;
            return (now.getTime() - t) <= thresholdMs;
        });
    }

    ensureAdminVisibility() {
        const adminSection = document.getElementById('admin');
        if (!adminSection) return;
        const isAdminUser = this.isAdmin();
        adminSection.style.display = isAdminUser ? '' : 'none';
        if (!isAdminUser) {
            this.showMessage('Admin access required.', 'error');
            this.showSection('dashboard'); // Redirect to dashboard if not admin
        }
    }

    async loadAdminComplaints() {
        try {
            const statusFilter = document.getElementById('admin-status-filter')?.value;
            const categoryFilter = document.getElementById('admin-category-filter')?.value;
            let url = '/api/admin/complaints?';
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
            url += params.toString();
            const res = await fetch(url, {
                headers: { 'x-user-email': this.getCurrentUserEmail() }
            });
            if (res.ok) {
                this.adminComplaints = await res.json();
            } else {
                this.adminComplaints = [];
            }
        } catch (_) {
            this.adminComplaints = [];
        }
    }

    updateAdminTable() {
        const container = document.getElementById('admin-complaints-table');
        if (!container) return;
        const data = this.adminComplaints || [];
        if (!data.length) {
            container.innerHTML = '<p class="no-data">No complaints found</p>';
            return;
        }
        container.innerHTML = data.map(c => this.renderAdminRow(c)).join('');
    }

    renderAdminRow(c) {
        const options = ['pending','in-progress','resolved'].map(s => `<option value="${s}" ${c.status===s?'selected':''}>${this.getStatusDisplayName(s)}</option>`).join('');
        return `
            <div class="complaint-card">
                <div class="complaint-header">
                    <div class="complaint-title">${this.getCategoryDisplayName(c.category)} • Room ${c.roomNumber}</div>
                    <div class="status-badge ${c.status.replace(' ','-')}">${this.getStatusDisplayName(c.status)}</div>
                </div>
                <div class="complaint-details">
                    <div class="detail-item"><div class="detail-label">Student</div><div class="detail-value">${c.studentName}</div></div>
                    <div class="detail-item"><div class="detail-label">Contact</div><div class="detail-value">${c.contactNumber}</div></div>
                    <div class="detail-item"><div class="detail-label">Submitted</div><div class="detail-value">${this.formatDate(c.submittedDate)}</div></div>
                </div>
                <div class="complaint-description"><strong>Description:</strong> ${c.description}</div>
                <div class="complaint-actions" style="gap:8px; display:flex; align-items:center; flex-wrap:wrap;">
                    <label for="status-${c._id}">Status:</label>
                    <select id="status-${c._id}" onchange="hostelSystem.adminUpdateStatus('${c._id}', this.value)">${options}</select>
                </div>
            </div>
        `;
    }

    async adminUpdateStatus(id, status) {
        await this.updateComplaintStatus(id, status);
        await this.loadAdminComplaints();
        this.updateAdminTable();
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionName) {
    hostelSystem.showSection(sectionName);
}

// Initialize the system when the page loads
let hostelSystem;
document.addEventListener('DOMContentLoaded', () => {
    hostelSystem = new HostelManagementSystem();
});

// Add some additional utility functions
function exportComplaints() {
    const dataStr = JSON.stringify(hostelSystem.complaints, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hostel-complaints.json';
    link.click();
    URL.revokeObjectURL(url);
}

function importComplaints() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedComplaints = JSON.parse(e.target.result);
                    hostelSystem.complaints = importedComplaints;
                    hostelSystem.saveComplaints();
                    hostelSystem.updateDashboard();
                    hostelSystem.updateComplaintsList();
                    hostelSystem.updateProfileStats();
                    hostelSystem.showMessage('Complaints imported successfully!', 'success');
                } catch (error) {
                    hostelSystem.showMessage('Error importing complaints. Please check the file format.', 'error');
                }
            };
            reader.readAsText(file);
        }
    };
    input.click();
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                showSection('dashboard');
                break;
            case '2':
                e.preventDefault();
                showSection('complaints');
                break;
            case '3':
                e.preventDefault();
                showSection('resolved');
                break;
            case '4':
                e.preventDefault();
                showSection('profile');
                break;
        }
    }
});

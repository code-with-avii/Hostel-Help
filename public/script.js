// Hostel Management System JavaScript

class HostelManagementSystem {
    constructor() {
        this.complaints = [];
        this.adminComplaints = [];
        this.currentSection = 'dashboard';
        this.displayFirstName = '';
        this.init();
    }

    async init() {
        // Auth guard: redirect to signin if not logged in
        const token = this.getToken();
        const email = this.getCurrentUserEmail();
        if (!token || !email || email === 'guest@example.com') {
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

        if (this.isAdmin()) {
            this.showSection('admin');
        }
        this.updateAuthUI();
    }

    getToken() {
        try {
            return localStorage.getItem('hms_token') || '';
        } catch (_) {
            return '';
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
        return this.getCurrentUserRole() === 'admin';
    }

    async apiFetch(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
            ...(options.headers || {})
        };
        const res = await fetch(url, { ...options, headers, credentials: 'include' });
        if (res.status === 401) {
            try {
                localStorage.clear();
            } catch (_) {}
            window.location.href = 'signin.html';
        }
        return res;
    }

    updateAuthUI() {
        const userLabel = document.getElementById('current-user-label');
        if (userLabel) {
            const email = this.getCurrentUserEmail();
            const role = this.getCurrentUserRole();
            userLabel.textContent = email ? `${email} (${role})` : '';
        }
    }

    setupEventListeners() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
            });
        });

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn && !logoutBtn._hmsBound) {
            logoutBtn._hmsBound = true;
            logoutBtn.addEventListener('click', async () => {
                try {
                    await fetch('/api/auth/sign-out', { method: 'POST', credentials: 'include' });
                    localStorage.clear();
                } catch (_) {}
                window.location.href = 'signin.html';
            });
        }

        // Complaint form
        const complaintForm = document.getElementById('complaint-form');
        if (complaintForm) {
            complaintForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitComplaint();
            });
        }

        // User filters
        const statusFilter = document.getElementById('status-filter');
        const categoryFilter = document.getElementById('category-filter');
        const dateFilter = document.getElementById('date-filter');

        if (statusFilter) {
            statusFilter.addEventListener('change', async () => {
                await this.loadComplaintsWithFilters();
                this.updateComplaintsList();
            });
        }
        if (categoryFilter) {
            categoryFilter.addEventListener('change', async () => {
                await this.loadComplaintsWithFilters();
                this.updateComplaintsList();
            });
        }
        if (dateFilter) {
            dateFilter.addEventListener('change', async () => {
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
            ['dashboard', 'complaints', 'resolved', 'profile'].forEach(sec => {
                const navLink = document.querySelector(`[data-section="${sec}"]`);
                if (navLink) navLink.style.display = 'none';
                const sectionEl = document.getElementById(sec);
                if (sectionEl) sectionEl.style.display = 'none';
            });
        }

        if (isAdminUser) {
            const complaintForm = document.getElementById('complaint-form');
            if (complaintForm) {
                const submitBtn = complaintForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.title = 'Admins cannot submit complaints.';
                }
            }
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
            if (yearInput) yearInput.value = current.year || '';
            if (deptInput) deptInput.value = current.department || '';
            if (numInput) numInput.value = current.number || '';
            this.profileMeta = { memberSinceYear: current.memberSinceYear || '' };
            this._lastLoadedProfile = { ...current };
            this.updateProfileDisplay(current);
            this.updateQuickDetails(current);
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const profile = {
                year: (yearInput ? yearInput.value.trim() : ''),
                department: (deptInput ? deptInput.value.trim() : ''),
                number: (numInput ? numInput.value.trim() : '')
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
                    this._lastLoadedProfile = { ...profile };
                }
            });
        });

        const cancelBtn = document.getElementById('cancel-edit-profile-btn');
        if (cancelBtn && !cancelBtn._hmsBound) {
            cancelBtn._hmsBound = true;
            cancelBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const snap = this._lastLoadedProfile || { year: '', department: '', number: '' };
                if (yearInput) yearInput.value = snap.year || '';
                if (deptInput) deptInput.value = snap.department || '';
                if (numInput) numInput.value = snap.number || '';
                if (formContainer) formContainer.style.display = 'none';
                if (msg) msg.textContent = '';
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

    updateQuickDetails(profile) {
        const qYear = document.getElementById('qd-year');
        const qDept = document.getElementById('qd-department');
        const qNum = document.getElementById('qd-number');
        if (qYear) qYear.textContent = profile.year || '-';
        if (qDept) qDept.textContent = profile.department || '-';
        if (qNum) qNum.textContent = profile.number || '-';
    }

    async fetchProfileFromAPI() {
        try {
            const res = await this.apiFetch('/api/profile');
            if (res.ok) return await res.json();
        } catch (_) {}
        return { year: '', department: '', number: '' };
    }

    async saveProfileToAPI(profile) {
        try {
            const res = await this.apiFetch('/api/profile', {
                method: 'POST',
                body: JSON.stringify(profile)
            });
            return res.ok;
        } catch (_) {
            return false;
        }
    }

    showSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const secEl = document.getElementById(sectionName);
        if (secEl) secEl.classList.add('active');

        const navLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (navLink) navLink.classList.add('active');

        this.currentSection = sectionName;

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
        if (this.isAdmin()) {
            this.showMessage('Admins cannot create complaints.', 'error');
            return;
        }

        const form = document.getElementById('complaint-form');
        const formData = new FormData(form);

        const rawContact = (formData.get('contactNumber') || '').toString().trim();
        if (!/^[0-9]{10}$/.test(rawContact)) {
            this.showMessage('Please enter a valid 10-digit contact number.', 'error');
            return;
        }

        if (!window.confirm('Submit this complaint?')) return;

        const complaintData = {
            studentName: formData.get('studentName'),
            roomNumber: formData.get('roomNumber'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            description: formData.get('description'),
            contactNumber: rawContact
        };

        try {
            const response = await this.apiFetch('/api/complaints', {
                method: 'POST',
                body: JSON.stringify(complaintData)
            });

            if (response.ok) {
                const newComplaint = await response.json();
                this.complaints.unshift(newComplaint);
                this.showMessage('Complaint submitted successfully!', 'success');
                form.reset();

                this.updateDashboard();
                this.updateProfileStats();
                this.showSection('resolved');
                await this.loadComplaintsWithFilters();
                this.updateComplaintsList();
            } else {
                const error = await response.json().catch(() => ({ error: 'Submission failed' }));
                this.showMessage(`Error: ${error.error || 'Failed to submit'}`, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to submit complaint. Please try again.', 'error');
        }
    }

    updateDashboard() {
        const totalComplaints = this.complaints.length;
        const pendingComplaints = this.complaints.filter(c => c.status === 'pending').length;
        const resolvedComplaints = this.complaints.filter(c => c.status === 'resolved').length;
        const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;

        const totalEl = document.getElementById('total-complaints');
        const pendingEl = document.getElementById('pending-complaints');
        const resolvedEl = document.getElementById('resolved-complaints');
        const rateEl = document.getElementById('resolution-rate');

        if (totalEl) totalEl.textContent = totalComplaints;
        if (pendingEl) pendingEl.textContent = pendingComplaints;
        if (resolvedEl) resolvedEl.textContent = resolvedComplaints;
        if (rateEl) rateEl.textContent = resolutionRate + '%';

        this.updateRecentComplaints();
    }

    updateRecentComplaints() {
        const container = document.getElementById('recent-complaints-list');
        if (!container) return;

        // Clone array to avoid in-place mutation, sort descending by date
        const recentComplaints = [...this.complaints]
            .sort((a, b) => new Date(b.submittedDate || b.createdAt || 0) - new Date(a.submittedDate || a.createdAt || 0))
            .slice(0, 5);

        if (recentComplaints.length === 0) {
            container.innerHTML = '<p class="no-data">No complaints submitted yet</p>';
            return;
        }

        container.innerHTML = recentComplaints.map(c => `
            <div class="complaint-item">
                <h4>${this.getCategoryDisplayName(c.category)}</h4>
                <p><strong>Room:</strong> ${c.roomNumber} | <strong>Status:</strong> ${this.getStatusDisplayName(c.status)}</p>
                <p><strong>Submitted:</strong> ${this.formatDate(c.submittedDate || c.createdAt)}</p>
            </div>
        `).join('');
    }

    updateComplaintsList() {
        const container = document.getElementById('complaints-list');
        if (!container) return;

        if (this.complaints.length === 0) {
            container.innerHTML = '<p class="no-data">No complaints found matching the selected filters</p>';
            return;
        }

        container.innerHTML = this.complaints.map(c => this.createComplaintCard(c)).join('');
    }

    createComplaintCard(complaint) {
        const statusClass = (complaint.status || 'pending').replace(' ', '-');
        const priorityColor = this.getPriorityColor(complaint.priority);
        const isAdmin = this.isAdmin();
        const currentUser = this.getCurrentUserEmail();
        const canDelete = isAdmin || (complaint.userEmail && complaint.userEmail === currentUser);

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
                        <div class="detail-value" style="color: ${priorityColor}">${(complaint.priority || '').toUpperCase()}</div>
                    </div>
                    ${isAdmin && complaint.contactNumber ? `
                    <div class="detail-item">
                        <div class="detail-label">Contact</div>
                        <div class="detail-value">${complaint.contactNumber}</div>
                    </div>
                    ` : ''}
                    <div class="detail-item">
                        <div class="detail-label">Submitted</div>
                        <div class="detail-value">${this.formatDate(complaint.submittedDate || complaint.createdAt)}</div>
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
                
                <div class="complaint-actions" style="display:flex; gap:8px; margin-top:10px;">
                    ${isAdmin && complaint.status === 'pending' ? `
                        <button class="btn btn-primary btn-small" onclick="hostelSystem.updateComplaintStatus('${complaint._id}', 'in-progress')">
                            <i class="fas fa-play"></i> In Progress
                        </button>
                    ` : ''}
                    ${isAdmin && complaint.status !== 'resolved' ? `
                        <button class="btn btn-primary btn-small" onclick="hostelSystem.resolveComplaint('${complaint._id}')">
                            <i class="fas fa-check"></i> Resolve
                        </button>
                    ` : ''}
                    ${canDelete ? `
                        <button class="btn btn-small" style="border:1px solid #ef4444; color:#ef4444; background:transparent;" onclick="hostelSystem.deleteComplaint('${complaint._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    async updateComplaintStatus(complaintId, newStatus) {
        try {
            const response = await this.apiFetch(`/api/admin/complaints/${complaintId}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                const updated = await response.json();
                const index = this.complaints.findIndex(c => c._id === complaintId);
                if (index !== -1) this.complaints[index] = updated;
                this.updateComplaintsList();
                this.updateDashboard();
                this.showMessage(`Status updated to ${this.getStatusDisplayName(newStatus)}`, 'success');
            } else {
                const err = await response.json().catch(() => ({ error: 'Update failed' }));
                this.showMessage(`Error: ${err.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to update complaint status.', 'error');
        }
    }

    async resolveComplaint(complaintId) {
        const resolution = prompt('Please enter the resolution details:');
        if (!resolution || !resolution.trim()) return;

        try {
            const response = await this.apiFetch(`/api/admin/complaints/${complaintId}/resolve`, {
                method: 'PATCH',
                body: JSON.stringify({ resolution: resolution.trim() })
            });

            if (response.ok) {
                const updated = await response.json();
                const index = this.complaints.findIndex(c => c._id === complaintId);
                if (index !== -1) this.complaints[index] = updated;
                this.updateComplaintsList();
                this.updateDashboard();
                this.showMessage('Complaint resolved successfully!', 'success');
            } else {
                const err = await response.json().catch(() => ({ error: 'Resolution failed' }));
                this.showMessage(`Error: ${err.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to resolve complaint.', 'error');
        }
    }

    async deleteComplaint(complaintId) {
        if (!confirm('Are you sure you want to delete this complaint?')) return;

        try {
            const response = await this.apiFetch(`/api/complaints/${complaintId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.complaints = this.complaints.filter(c => c._id !== complaintId);
                this.updateComplaintsList();
                this.updateDashboard();
                this.updateProfileStats();
                this.showMessage('Complaint deleted successfully!', 'success');
            } else {
                const error = await response.json().catch(() => ({ error: 'Delete failed' }));
                this.showMessage(`Error: ${error.error}`, 'error');
            }
        } catch (error) {
            this.showMessage('Failed to delete complaint.', 'error');
        }
    }

    updateProfileStats() {
        const total = this.complaints.length;
        const resolved = this.complaints.filter(c => c.status === 'resolved').length;
        const totalEl = document.getElementById('profile-total');
        const resolvedEl = document.getElementById('profile-resolved');
        if (totalEl) totalEl.textContent = total;
        if (resolvedEl) resolvedEl.textContent = resolved;
    }

    getStatusDisplayName(status) {
        const map = { 'pending': 'Pending', 'in-progress': 'In Progress', 'resolved': 'Resolved' };
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
        const colors = { 'low': '#27ae60', 'medium': '#f39c12', 'high': '#e74c3c', 'urgent': '#8e44ad' };
        return colors[priority] || '#7f8c8d';
    }

    formatDate(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showMessage(message, type = 'success') {
        const container = document.getElementById('message-container');
        if (!container) return;
        const el = document.createElement('div');
        el.className = `message ${type}`;
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => el.remove(), 3000);
    }

    async loadComplaints() {
        try {
            const response = await this.apiFetch('/api/complaints');
            if (response.ok) {
                this.complaints = await response.json();
            } else {
                this.complaints = [];
            }
        } catch (_) {
            this.complaints = [];
        }
    }

    async loadComplaintsWithFilters() {
        try {
            const statusFilter = document.getElementById('status-filter')?.value;
            const categoryFilter = document.getElementById('category-filter')?.value;
            const dateFilter = document.getElementById('date-filter')?.value || 'all';

            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);

            const response = await this.apiFetch(`/api/complaints?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                this.complaints = this.filterComplaintsByDate(data, dateFilter);
            }
        } catch (_) {}
    }

    filterComplaintsByDate(list, dateFilter) {
        if (!Array.isArray(list) || dateFilter === 'all') return list || [];
        const now = Date.now();
        const msInDay = 24 * 60 * 60 * 1000;
        let thresholdMs = 0;
        if (dateFilter === 'day') thresholdMs = msInDay;
        else if (dateFilter === 'week') thresholdMs = 7 * msInDay;
        else if (dateFilter === 'month') thresholdMs = 30 * msInDay;
        if (!thresholdMs) return list;

        return list.filter(c => {
            const t = new Date(c?.submittedDate || c?.createdAt || 0).getTime();
            return t && (now - t) <= thresholdMs;
        });
    }

    ensureAdminVisibility() {
        const adminSection = document.getElementById('admin');
        if (!adminSection) return;
        const isAdminUser = this.isAdmin();
        adminSection.style.display = isAdminUser ? '' : 'none';
        if (!isAdminUser) {
            this.showMessage('Admin access required.', 'error');
            this.showSection('dashboard');
        }
    }

    async loadAdminComplaints() {
        try {
            const statusFilter = document.getElementById('admin-status-filter')?.value;
            const categoryFilter = document.getElementById('admin-category-filter')?.value;
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);

            const res = await this.apiFetch(`/api/admin/complaints?${params.toString()}`);
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
        const options = ['pending', 'in-progress', 'resolved']
            .map(s => `<option value="${s}" ${c.status === s ? 'selected' : ''}>${this.getStatusDisplayName(s)}</option>`)
            .join('');

        return `
            <div class="complaint-card">
                <div class="complaint-header">
                    <div class="complaint-title">${this.getCategoryDisplayName(c.category)} • Room ${c.roomNumber}</div>
                    <div class="status-badge ${(c.status || '').replace(' ', '-')}">${this.getStatusDisplayName(c.status)}</div>
                </div>
                <div class="complaint-details">
                    <div class="detail-item"><div class="detail-label">Student</div><div class="detail-value">${c.studentName}</div></div>
                    <div class="detail-item"><div class="detail-label">Contact</div><div class="detail-value">${c.contactNumber || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">Submitted</div><div class="detail-value">${this.formatDate(c.submittedDate || c.createdAt)}</div></div>
                </div>
                <div class="complaint-description"><strong>Description:</strong> ${c.description}</div>
                <div class="complaint-actions" style="gap:8px; display:flex; align-items:center; flex-wrap:wrap; margin-top:10px;">
                    <label for="status-${c._id}">Status:</label>
                    <select id="status-${c._id}" onchange="hostelSystem.adminUpdateStatus('${c._id}', this.value)">${options}</select>
                    <button class="btn btn-small" style="border:1px solid #ef4444; color:#ef4444; background:transparent;" onclick="hostelSystem.deleteComplaint('${c._id}').then(() => hostelSystem.loadAdminComplaints().then(() => hostelSystem.updateAdminTable()))">
                        <i class="fas fa-trash"></i> Delete
                    </button>
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
    if (hostelSystem) hostelSystem.showSection(sectionName);
}

// Initialize system when DOM is ready
let hostelSystem;
document.addEventListener('DOMContentLoaded', () => {
    hostelSystem = new HostelManagementSystem();
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        const sections = { '1': 'dashboard', '2': 'complaints', '3': 'resolved', '4': 'profile' };
        if (sections[e.key]) {
            e.preventDefault();
            showSection(sections[e.key]);
        }
    }
});

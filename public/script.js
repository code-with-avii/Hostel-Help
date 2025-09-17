// Hostel Management System JavaScript

class HostelManagementSystem {
    constructor() {
        this.complaints = [];
        this.currentSection = 'dashboard';
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadComplaints();
        this.updateDashboard();
        this.updateComplaintsList();
        this.updateProfileStats();
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
        document.getElementById('complaint-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitComplaint();
        });

        // Filters
        document.getElementById('status-filter').addEventListener('change', async () => {
            await this.loadComplaintsWithFilters();
            this.updateComplaintsList();
        });

        document.getElementById('category-filter').addEventListener('change', async () => {
            await this.loadComplaintsWithFilters();
            this.updateComplaintsList();
        });
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
        }
    }

    async submitComplaint() {
        const form = document.getElementById('complaint-form');
        const formData = new FormData(form);
        
        const complaintData = {
            studentName: formData.get('studentName'),
            roomNumber: formData.get('roomNumber'),
            category: formData.get('category'),
            priority: formData.get('priority'),
            description: formData.get('description'),
            contactNumber: formData.get('contactNumber'),
            status: 'pending'
        };

        try {
            const response = await fetch('/api/complaints', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
                this.updateComplaintsList();
                this.updateProfileStats();
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
            .sort((a, b) => new Date(b.submittedDate) - new Date(a.submittedDate))
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
                    <div class="detail-item">
                        <div class="detail-label">Contact</div>
                        <div class="detail-value">${complaint.contactNumber}</div>
                    </div>
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
                    <button class="btn btn-secondary btn-small" onclick="hostelSystem.deleteComplaint('${complaint._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    async updateComplaintStatus(complaintId, newStatus) {
        try {
            const response = await fetch(`/api/complaints/${complaintId}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
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
                const error = await response.json();
                this.showMessage(`Error: ${error.error}`, 'error');
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
                const response = await fetch(`/api/complaints/${complaintId}/resolve`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
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
                    const error = await response.json();
                    this.showMessage(`Error: ${error.error}`, 'error');
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
                const response = await fetch(`/api/complaints/${complaintId}`, {
                    method: 'DELETE'
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

    getStatusDisplayName(status) {
        const statusNames = {
            'pending': 'Pending',
            'in-progress': 'In Progress',
            'resolved': 'Resolved'
        };
        return statusNames[status] || status;
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

    async loadComplaintsWithFilters() {
        try {
            const statusFilter = document.getElementById('status-filter').value;
            const categoryFilter = document.getElementById('category-filter').value;
            
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
                this.complaints = await response.json();
            } else {
                console.error('Failed to load complaints with filters');
            }
        } catch (error) {
            console.error('Error loading complaints with filters:', error);
        }
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

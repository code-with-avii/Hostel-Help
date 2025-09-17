# Hostel Management System

A comprehensive frontend-only hostel management system that allows students to submit complaints, track their resolution status, and view detailed analytics through an intuitive dashboard. This is a client-side application that runs entirely in the browser.

## Features

### 🏠 Dashboard
- **Real-time Statistics**: View total complaints, pending issues, resolved problems, and resolution rates
- **Recent Complaints**: Quick overview of the latest submitted complaints
- **Quick Actions**: Easy access to submit new complaints or view all issues

### 📝 Complaint Management
- **Multiple Categories**: 
  - Electrical Issues
  - Plumbing Problems
  - WiFi/Internet
  - Cleaning & Maintenance
  - Security Concerns
  - Noise Complaints
  - Furniture Issues
  - Other Issues

- **Priority Levels**: Low, Medium, High, Urgent
- **Detailed Forms**: Comprehensive complaint submission with all necessary details
- **Status Tracking**: Pending → In Progress → Resolved

### ✅ Problem Resolution
- **Status Management**: Update complaint status and add resolution details
- **Filtering Options**: Filter by status and category
- **Resolution Tracking**: View when and how issues were resolved
- **Delete Functionality**: Remove resolved or unnecessary complaints

### 👤 Profile Management
- **Personal Statistics**: View individual complaint history and resolution rates
- **Account Information**: Manage personal details and preferences

## Technical Features

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Beautiful Interface**: Modern gradient design with smooth animations
- **Intuitive Navigation**: Easy-to-use navigation with clear visual feedback
- **Accessibility**: Keyboard shortcuts and screen reader friendly

### 💾 Data Persistence
- **Local Storage**: All data is saved locally in the browser
- **Sample Data**: Pre-loaded with example complaints for demonstration
- **Import/Export**: Ability to backup and restore complaint data

### ⚡ Performance
- **Fast Loading**: Optimized CSS and JavaScript for quick page loads
- **Smooth Animations**: CSS transitions and animations for better user experience
- **Efficient Filtering**: Real-time filtering without page reloads

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server setup required - runs entirely in the browser

### Installation
1. Download or clone the project files
2. Open `index.html` in your web browser
3. Start using the system immediately!

### File Structure
```
hostel-management-system/
├── index.html          # Main HTML file
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # Project documentation
```

### Quick Start
Simply open `index.html` in any modern web browser. No installation or server setup required!

## Usage Guide

### Submitting a Complaint
1. Navigate to "Submit Complaint" section
2. Fill in all required fields:
   - Student Name
   - Room Number
   - Category (select from dropdown)
   - Priority Level
   - Detailed Description
   - Contact Number
3. Click "Submit Complaint"
4. Receive confirmation message

### Tracking Complaints
1. Go to "Resolved Issues" section
2. Use filters to narrow down results:
   - Filter by Status (All, Pending, In Progress, Resolved)
   - Filter by Category
3. View detailed information for each complaint
4. Update status or add resolution details as needed

### Dashboard Overview
1. View key statistics at a glance
2. Check recent complaints
3. Use quick action buttons for common tasks
4. Monitor resolution rates and trends

## Keyboard Shortcuts

- `Ctrl/Cmd + 1`: Go to Dashboard
- `Ctrl/Cmd + 2`: Go to Submit Complaint
- `Ctrl/Cmd + 3`: Go to Resolved Issues
- `Ctrl/Cmd + 4`: Go to Profile

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+

## Features in Detail

### Complaint Categories
Each category is designed to cover common hostel issues:

- **Electrical**: Power outlets, lighting, electrical appliances
- **Plumbing**: Water leaks, drainage, bathroom fixtures
- **WiFi/Internet**: Connectivity issues, slow speeds
- **Cleaning**: Room cleaning, common area maintenance
- **Security**: Safety concerns, access issues
- **Noise**: Disturbance complaints, quiet hours
- **Furniture**: Broken furniture, missing items
- **Other**: Any issues not covered by other categories

### Priority System
- **Low**: Non-urgent issues that can be addressed during regular maintenance
- **Medium**: Issues that should be addressed within a few days
- **High**: Important issues requiring prompt attention
- **Urgent**: Critical issues requiring immediate action

### Status Workflow
1. **Pending**: Newly submitted complaint awaiting review
2. **In Progress**: Complaint is being worked on
3. **Resolved**: Issue has been fixed and resolution documented

## Customization

The system is designed to be easily customizable:

- **Colors**: Modify CSS variables to change the color scheme
- **Categories**: Add or remove complaint categories in the JavaScript
- **Fields**: Extend the complaint form with additional fields
- **Styling**: Customize the appearance by modifying the CSS

## Data Management

### Local Storage
- All data is stored in the browser's local storage
- Data persists between browser sessions
- No external database or server required

### Sample Data
The system comes with sample complaints to demonstrate functionality:
- Resolved electrical issue
- In-progress WiFi problem
- Pending plumbing emergency

### Backup and Restore
- Export complaints to JSON file
- Import complaints from JSON file
- Useful for data migration or backup

## Future Enhancements

Potential features for future versions:
- User authentication and role-based access
- Email notifications for status updates
- Photo upload for complaint documentation
- Admin panel for hostel management
- Mobile app version
- Integration with hostel management software
- Automated status updates
- Reporting and analytics dashboard

## Support

For issues or questions:
1. Check the browser console for any JavaScript errors
2. Ensure you're using a modern browser
3. Clear browser cache if experiencing issues
4. Verify all files are in the same directory

## License

This project is open source and available under the MIT License.

---

**Note**: This is a frontend-only application that runs entirely in the browser. All data is stored locally using browser localStorage and will persist between sessions. No server or database setup is required.

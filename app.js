import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Complaint from "./models/Complaint.js";
import UserProfile from "./models/UserProfile.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import { signToken, verifyToken } from "./utils/jwt.js";
dotenv.config();

const app = express();
const port = process.env.MY_PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
connectDB();

// API Routes

// Helper: extract user from Authorization bearer token, fallback to x-user-email
function getUserFromReq(req) {
    const auth = req.headers['authorization'] || '';
    if (auth.startsWith('Bearer ')) {
        const token = auth.slice(7);
        const decoded = verifyToken(token);
        if (decoded && decoded.email) {
            return { email: (decoded.email || '').toLowerCase(), role: decoded.role || 'user' };
        }
    }
    const emailHeader = (req.headers['x-user-email'] || '').toString().toLowerCase();
    return { email: emailHeader, role: emailHeader ? (emailHeader === (process.env.admin_email || '').toLowerCase() ? 'admin' : 'user') : 'guest' };
}

// Auth: Signup
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        const adminEmail = (process.env.admin_email || '').toLowerCase();
        if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid email' });
        if (password.length < 6) return res.status(400).json({ error: 'password too short (min 6)' });
        const normalized = email.toLowerCase();
        if (normalized === adminEmail) {
            return res.status(400).json({ error: 'Cannot create admin via signup' });
        }
        const existing = await User.findOne({ email: normalized });
        if (existing) return res.status(409).json({ error: 'User already exists' });
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({ email: normalized, passwordHash });
        return res.status(201).json({ email: user.email });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ error: 'Failed to signup' });
    }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) return res.status(400).json({ error: 'invalid email' });
        const normalized = email.toLowerCase();
        const adminEmail = (process.env.admin_email || '').toLowerCase();
        const adminPassword = process.env.admin_password || '';
        if (normalized === adminEmail) {
            if (password === adminPassword) {
                const token = signToken({ email: normalized, role: 'admin' });
                return res.status(200).json({ email: normalized, role: 'admin', token });
            }
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = await User.findOne({ email: normalized });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        const token = signToken({ email: user.email, role: 'user' });
        return res.status(200).json({ email: user.email, role: 'user', token });
    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Failed to login' });
    }
});

// Get all complaints
app.get("/api/complaints", async (req, res) => {
    try {
        const { status, category } = req.query;
        let filter = {};
        
        if (status && status !== 'all') {
            filter.status = status;
        }
        
        if (category && category !== 'all') {
            filter.category = category;
        }
        // Hide contactNumber for non-admin users
        const user = getUserFromReq(req);
        const isAdmin = ((user.email || '') === (process.env.admin_email || '').toLowerCase());
        const projection = isAdmin ? {} : { contactNumber: 0 };

        const complaints = await Complaint.find(filter, projection).sort({ submittedDate: -1 });
        res.json(complaints);
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).json({ error: "Failed to fetch complaints" });
    }
});

// Admin: Get all complaints (admin only)
app.get("/api/admin/complaints", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if ((user.email || '') !== (process.env.admin_email || '').toLowerCase()) {
            return res.status(403).json({ error: 'Admin privileges required' });
        }
        const { status, category } = req.query;
        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (category && category !== 'all') filter.category = category;
        const complaints = await Complaint.find(filter).sort({ submittedDate: -1 });
        res.json(complaints);
    } catch (error) {
        console.error("Error fetching admin complaints:", error);
        res.status(500).json({ error: "Failed to fetch complaints" });
    }
});

// Get complaint by ID
app.get("/api/complaints/:id", async (req, res) => {
    try {
        // Hide contactNumber for non-admin users
        const user = getUserFromReq(req);
        const isAdmin = ((user.email || '') === (process.env.admin_email || '').toLowerCase());
        const projection = isAdmin ? {} : { contactNumber: 0 };

        const complaint = await Complaint.findById(req.params.id).select(projection);
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }
        res.json(complaint);
    } catch (error) {
        console.error("Error fetching complaint:", error);
        res.status(500).json({ error: "Failed to fetch complaint" });
    }
});

// Create new complaint
app.post("/api/complaints", async (req, res) => {
    try {
        // Check if user is admin - admins cannot create complaints
        const user = getUserFromReq(req);
        if ((user.email || '') === (process.env.admin_email || '').toLowerCase()) {
            return res.status(403).json({ error: 'Admins cannot create complaints. Admins can only manage existing complaints.' });
        }
        // Basic payload validation with helpful errors
        const {
            studentName,
            roomNumber,
            category,
            priority,
            description,
            contactNumber
        } = req.body || {};

        const errors = [];
        if (!studentName || typeof studentName !== 'string' || !studentName.trim()) errors.push('studentName is required');
        if (!roomNumber || typeof roomNumber !== 'string' || !roomNumber.trim()) errors.push('roomNumber is required');
        const allowedCategories = ['electrical','plumbing','wifi','cleaning','security','noise','furniture','other'];
        if (!category || !allowedCategories.includes(String(category))) errors.push('category is invalid');
        const allowedPriorities = ['low','medium','high','urgent'];
        if (!priority || !allowedPriorities.includes(String(priority))) errors.push('priority is invalid');
        if (!description || typeof description !== 'string' || !description.trim()) errors.push('description is required');
        if (!contactNumber || typeof contactNumber !== 'string' || !contactNumber.trim()) errors.push('contactNumber is required');

        if (errors.length) {
            return res.status(400).json({ error: errors.join(', ') });
        }

        const complaint = new Complaint({
            studentName: String(studentName).trim(),
            roomNumber: String(roomNumber).trim(),
            category,
            priority,
            description: String(description).trim(),
            contactNumber: String(contactNumber).trim(),
            status: 'pending'
        });
        await complaint.save();
        res.status(201).json(complaint);
    } catch (error) {
        console.error("Error creating complaint:", error);
        if (error && error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(400).json({ error: error?.message || "Failed to create complaint" });
    }
});

// Update complaint status
app.patch("/api/complaints/:id/status", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if ((user.email || '') !== (process.env.admin_email || '').toLowerCase()) {
            return res.status(403).json({ error: 'Admin privileges required' });
        }
        const { status } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }
        
        res.json(complaint);
    } catch (error) {
        console.error("Error updating complaint status:", error);
        res.status(500).json({ error: "Failed to update complaint status" });
    }
});

// Resolve complaint
app.patch("/api/complaints/:id/resolve", async (req, res) => {
    try {
        const user = getUserFromReq(req);
        if ((user.email || '') !== (process.env.admin_email || '').toLowerCase()) {
            return res.status(403).json({ error: 'Admin privileges required' });
        }
        const { resolution } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { 
                status: 'resolved',
                resolvedDate: new Date(),
                resolution 
            },
            { new: true }
        );
        
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }
        
        res.json(complaint);
    } catch (error) {
        console.error("Error resolving complaint:", error);
        res.status(500).json({ error: "Failed to resolve complaint" });
    }
});

// Delete complaint (disabled). Admin can only change status, not delete.
app.delete("/api/complaints/:id", async (req, res) => {
    return res.status(403).json({ error: "Deleting complaints is disabled. Admins can only update status." });
});

// Get dashboard statistics
app.get("/api/dashboard/stats", async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        const pendingComplaints = await Complaint.countDocuments({ status: 'pending' });
        const inProgressComplaints = await Complaint.countDocuments({ status: 'in-progress' });
        const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
        
        const resolutionRate = totalComplaints > 0 ? Math.round((resolvedComplaints / totalComplaints) * 100) : 0;
        
        res.json({
            totalComplaints,
            pendingComplaints,
            inProgressComplaints,
            resolvedComplaints,
            resolutionRate
        });
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
    }
});

// User Profiles
app.get('/api/profile', async (req, res) => {
    try {
        const email = (req.query.email || '').toLowerCase();
        if (!email) return res.status(400).json({ error: 'email query required' });
        const profile = await UserProfile.findOne({ email });
        res.json(profile || { email, year: '', department: '', number: '' });
    } catch (err) {
        console.error('Error fetching profile:', err);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Save/Update User Profile
app.post('/api/profile', async (req, res) => {
    try {
        const { email, year, department, number } = req.body || {};
        if (!email) return res.status(400).json({ error: 'email is required' });
        const saved = await UserProfile.findOneAndUpdate(
            { email: email.toLowerCase() },
            { $set: { year: year || '', department: department || '', number: number || '' } },
            { upsert: true, new: true }
        );
        res.status(200).json(saved);
    } catch (err) {
        console.error('Error saving profile:', err);
        res.status(500).json({ error: 'Failed to save profile' });
    }
});

// Serve sign-in as the start page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signin.html"));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
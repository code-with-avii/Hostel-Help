import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Complaint from "./models/Complaint.js";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
dotenv.config();

const app = express();
const port= 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
connectDB();

// API Routes

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
        
        const complaints = await Complaint.find(filter).sort({ submittedDate: -1 });
        res.json(complaints);
    } catch (error) {
        console.error("Error fetching complaints:", error);
        res.status(500).json({ error: "Failed to fetch complaints" });
    }
});

// Get complaint by ID
app.get("/api/complaints/:id", async (req, res) => {
    try {
        const complaint = await Complaint.findById(req.params.id);
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
        const complaint = new Complaint(req.body);
        await complaint.save();
        res.status(201).json(complaint);
    } catch (error) {
        console.error("Error creating complaint:", error);
        res.status(400).json({ error: "Failed to create complaint" });
    }
});

// Update complaint status
app.patch("/api/complaints/:id/status", async (req, res) => {
    try {
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

// Delete complaint
app.delete("/api/complaints/:id", async (req, res) => {
    try {
        const complaint = await Complaint.findByIdAndDelete(req.params.id);
        if (!complaint) {
            return res.status(404).json({ error: "Complaint not found" });
        }
        res.json({ message: "Complaint deleted successfully" });
    } catch (error) {
        console.error("Error deleting complaint:", error);
        res.status(500).json({ error: "Failed to delete complaint" });
    }
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

// Serve sign-in as the start page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signin.html"));
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import connectDB from "./db/connectDB.js";
import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();
const port = process.env.MY_PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve sign-in as start page
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "signin.html"));
});

// Centralized error handler
app.use((err, req, res, next) => {
    console.error("Error:", err);
    res.status(err.statusCode || 500).json({ error: err.message || "Internal server error" });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";
import { auth, ensureAdminUser } from "./auth.js";
import connectDB from "./db/connectDB.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();
const port = process.env.MY_PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Forward legacy auth routes if called
app.use((req, res, next) => {
    if (req.url === '/api/auth/login') req.url = '/api/auth/sign-in/email';
    else if (req.url === '/api/auth/signup') req.url = '/api/auth/sign-up/email';
    next();
});

// 1. Better Auth request router: MUST be mounted before express.json()
app.all("/api/auth/*", toNodeHandler(auth));

// 2. Body parser & static assets
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB connection & auto-initialize admin
connectDB().then(() => {
    ensureAdminUser();
});

// App Routes
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', auth: 'better-auth', timestamp: new Date().toISOString() });
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

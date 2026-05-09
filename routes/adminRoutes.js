import { Router } from 'express';
import { requireAdmin } from '../middlewares/auth.js';
import { adminListComplaints, updateStatus, resolveComplaint } from '../controllers/complaintController.js';

const router = Router();

// All routes in this router require admin
router.use(requireAdmin);

// Complaints management for admin
router.get('/complaints', adminListComplaints);
router.patch('/complaints/:id/status', updateStatus);
router.patch('/complaints/:id/resolve', resolveComplaint);

export default router;

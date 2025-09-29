import { Router } from 'express';
import { listComplaints, getComplaintById, createComplaint } from '../controllers/complaintController.js';

const router = Router();

// Public/user routes (mounted at /api/complaints)
router.get('/', listComplaints);
router.get('/:id', getComplaintById);
router.post('/', createComplaint);

export default router;

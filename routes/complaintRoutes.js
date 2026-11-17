import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { listComplaints, getComplaintById, createComplaint, deleteComplaint } from '../controllers/complaintController.js';

const router = Router();

router.use(authenticate);

router.get('/', listComplaints);
router.get('/:id', getComplaintById);
router.post('/', createComplaint);
router.delete('/:id', deleteComplaint);

export default router;

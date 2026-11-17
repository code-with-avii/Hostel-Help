import { Router } from 'express';
import { authenticate } from '../middlewares/auth.js';
import { getProfile, saveProfile } from '../controllers/profileController.js';

const router = Router();

router.use(authenticate);

router.get('/', getProfile);
router.post('/', saveProfile);

export default router;

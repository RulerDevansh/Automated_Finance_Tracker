import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', authenticate, userController.me);
router.patch('/me', authenticate, userController.updateMe);

export default router;

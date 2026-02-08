import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authValidators } from '../validation/validators.js';

const router = Router();

router.post('/register', authValidators.register, authController.register);
router.post('/login', authValidators.login, authController.login);
router.post('/google', authController.googleLogin);

export default router;

import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { reportValidators } from '../validation/validators.js';

const router = Router();

router.use(authenticate);
router.get('/dashboard', reportController.dashboard);
router.get('/monthly', reportValidators.monthQuery, reportController.monthlyReport);
router.get('/budget-progress', reportValidators.monthQuery, reportController.budgetProgress);

export default router;

import { Router } from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { budgetValidators } from '../validation/validators.js';

const router = Router();

router.use(authenticate);
router.get('/', budgetController.list);
router.get('/progress', budgetController.progress);
router.post('/', budgetValidators.upsert, budgetController.upsert);
router.delete('/:id', budgetValidators.delete, budgetController.remove);

export default router;

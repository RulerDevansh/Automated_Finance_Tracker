import { Router } from 'express';
import * as transactionController from '../controllers/transactionController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { transactionValidators } from '../validation/validators.js';

const router = Router();

router.use(authenticate);
router.get('/', transactionController.list);
router.post('/', transactionValidators.create, transactionController.create);
router.patch('/:id', transactionValidators.update, transactionController.update);
router.delete('/:id', transactionController.remove);

export default router;

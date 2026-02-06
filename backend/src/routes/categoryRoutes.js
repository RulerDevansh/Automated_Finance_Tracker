import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { categoryValidators } from '../validation/validators.js';

const router = Router();

router.use(authenticate);
router.get('/', categoryController.list);
router.post('/', categoryValidators.create, categoryController.create);
router.patch('/:id', categoryValidators.update, categoryController.update);
router.delete('/:id', categoryController.remove);

export default router;

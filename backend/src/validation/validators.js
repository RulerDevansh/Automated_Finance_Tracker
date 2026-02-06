import { body, param, query, validationResult } from 'express-validator';

export const validate = (rules) => [
  ...rules,
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return next();
  }
];

export const authValidators = {
  register: validate([
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').notEmpty().withMessage('Full name required')
  ]),
  login: validate([
    body('email').isEmail(),
    body('password').notEmpty()
  ])
};

export const categoryValidators = {
  create: validate([
    body('name').notEmpty(),
    body('type').isIn(['income', 'expense'])
  ]),
  update: validate([
    param('id').isUUID(),
    body('name').notEmpty()
  ])
};

export const transactionValidators = {
  create: validate([
    body('type').isIn(['income', 'expense']),
    body('amount').isDecimal({ force_decimal: true }).withMessage('Amount must be decimal'),
    body('occurredOn').isISO8601().toDate(),
    body('description').optional().isString(),
    body('categoryId').optional({ nullable: true }).isUUID()
  ]),
  update: validate([
    param('id').isUUID(),
    body('type').isIn(['income', 'expense']),
    body('amount').isDecimal({ force_decimal: true }),
    body('occurredOn').isISO8601().toDate(),
    body('description').optional().isString(),
    body('categoryId').optional({ nullable: true }).isUUID()
  ])
};

export const budgetValidators = {
  upsert: validate([
    body('categoryId').isUUID(),
    body('amount').isDecimal({ force_decimal: true }),
    body('periodMonth').isInt({ min: 1, max: 12 }),
    body('periodYear').isInt({ min: 2000 })
  ]),
  delete: validate([
    param('id').isUUID()
  ])
};

export const reportValidators = {
  monthQuery: validate([
    query('year').optional().isInt({ min: 2000 }),
    query('month').optional().isInt({ min: 1, max: 12 })
  ])
};

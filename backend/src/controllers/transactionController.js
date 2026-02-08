import * as transactionService from '../services/transactionService.js';

export const list = async (req, res, next) => {
  try {
    const { from, to, type, categoryId, limit, offset } = req.query;
    const transactions = await transactionService.listUserTransactions({
      userId: req.user.id,
      from,
      to,
      type,
      categoryId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined
    });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const { categoryId, type, amount, currency, description, occurredOn } = req.body;
    const tx = await transactionService.addTransaction({
      userId: req.user.id,
      categoryId,
      type,
      amount,
      currency,
      description,
      occurredOn
    });
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const { categoryId, type, amount, currency, description, occurredOn } = req.body;
    const tx = await transactionService.editTransaction({
      id: req.params.id,
      userId: req.user.id,
      categoryId,
      type,
      amount,
      currency,
      description,
      occurredOn
    });
    res.json(tx);
  } catch (err) {
    next(err);
  }
};

export const uploadReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('Receipt file missing');
      err.status = 400;
      throw err;
    }
    const tx = await transactionService.attachReceipt({
      id: req.params.id,
      userId: req.user.id,
      receiptUrl: `/uploads/receipts/${req.file.filename}`
    });
    res.json({ receiptUrl: tx.receipt_url });
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await transactionService.removeTransaction({ id: req.params.id, userId: req.user.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

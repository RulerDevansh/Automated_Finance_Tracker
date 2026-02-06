import * as budgetService from '../services/budgetService.js';

export const upsert = async (req, res, next) => {
  try {
    const { categoryId, amount, periodMonth, periodYear } = req.body;
    const budget = await budgetService.setBudget({ userId: req.user.id, categoryId, amount, periodMonth, periodYear });
    res.status(201).json(budget);
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const { periodMonth, periodYear } = req.query;
    const budgets = await budgetService.getBudgets({
      userId: req.user.id,
      periodMonth: periodMonth ? Number(periodMonth) : undefined,
      periodYear: periodYear ? Number(periodYear) : undefined
    });
    res.json(budgets);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await budgetService.removeBudget({ id: req.params.id, userId: req.user.id });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

export const progress = async (req, res, next) => {
  try {
    const { periodMonth, periodYear } = req.query;
    const data = await budgetService.getBudgetProgress({
      userId: req.user.id,
      periodMonth: Number(periodMonth),
      periodYear: Number(periodYear)
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

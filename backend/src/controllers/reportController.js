import * as transactionService from '../services/transactionService.js';
import * as budgetService from '../services/budgetService.js';

export const dashboard = async (req, res, next) => {
  try {
    const { year } = req.query;
    const data = await transactionService.getDashboardData({ userId: req.user.id, year: year ? Number(year) : new Date().getFullYear() });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const monthlyReport = async (req, res, next) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const data = await transactionService.getMonthlyReport({ userId: req.user.id, year });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const budgetProgress = async (req, res, next) => {
  try {
    const periodYear = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const periodMonth = req.query.month ? Number(req.query.month) : new Date().getMonth() + 1;
    const data = await budgetService.getBudgetProgress({ userId: req.user.id, periodMonth, periodYear });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

import * as transactionService from '../services/transactionService.js';
import * as budgetService from '../services/budgetService.js';
import { findById } from '../models/userModel.js';
import { convert } from '../utils/fx.js';
import { listTransactions } from '../models/transactionModel.js';
import { sendMail } from '../utils/mailer.js';

export const dashboard = async (req, res, next) => {
  try {
    const { year } = req.query;
    const data = await transactionService.getDashboardData({ userId: req.user.id, year: year ? Number(year) : new Date().getFullYear(), baseCurrency: req.query.baseCurrency });
    res.json(data);
  } catch (err) {
    next(err);
  }
};

export const monthlyReport = async (req, res, next) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const data = await transactionService.getMonthlyReport({ userId: req.user.id, year, baseCurrency: req.query.baseCurrency });
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

export const sendSummaryEmail = async (req, res, next) => {
  try {
    const periodYear = req.body.year ? Number(req.body.year) : new Date().getFullYear();
    const fromMonth = req.body.fromMonth ? Number(req.body.fromMonth) : (req.body.month ? Number(req.body.month) : new Date().getMonth() + 1);
    const toMonth = req.body.toMonth ? Number(req.body.toMonth) : fromMonth;
    const baseCurrency = (req.body.baseCurrency || 'INR').toUpperCase();
    const user = await findById(req.user.id);

    if (Number.isNaN(fromMonth) || Number.isNaN(toMonth) || fromMonth < 1 || toMonth > 12 || fromMonth > toMonth) {
      const err = new Error('Invalid month range');
      err.status = 400;
      throw err;
    }

    const fromMonthStr = fromMonth.toString().padStart(2, '0');
    const toMonthStr = toMonth.toString().padStart(2, '0');
    const from = `${periodYear}-${fromMonthStr}-01`;
    const lastDayTo = new Date(periodYear, toMonth, 0).getDate();
    const to = `${periodYear}-${toMonthStr}-${lastDayTo.toString().padStart(2, '0')}`;
    const txs = await listTransactions({ userId: req.user.id, from, to, limit: 10000, offset: 0 });
    let income = 0;
    let expense = 0;
    const monthly = new Map();
    const monthName = (m) => ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m - 1] || `M${m}`;
    for (const tx of txs) {
      const amt = await convert(Number(tx.amount), tx.currency || 'INR', baseCurrency);
      const month = new Date(tx.occurred_on).getMonth() + 1;
      const row = monthly.get(month) || { income: 0, expense: 0 };
      if (tx.type === 'income') {
        row.income += amt;
        income += amt;
      } else {
        row.expense += amt;
        expense += amt;
      }
      monthly.set(month, row);
    }
    const savings = income - expense;
    const monthLines = Array.from(monthly.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([m, row]) => `${monthName(m)}: Income ${baseCurrency} ${row.income.toFixed(2)}, Expense ${baseCurrency} ${row.expense.toFixed(2)}, Savings ${baseCurrency} ${(row.income - row.expense).toFixed(2)}`)
      .join('\n');
    const subject = `Summary for ${fromMonth}-${toMonth}/${periodYear}`;
    const body = `Hi ${user.full_name || 'there'},\n\n` +
      `${monthLines}\n\n` +
      `Total Income: ${baseCurrency} ${income.toFixed(2)}\n` +
      `Total Expenses: ${baseCurrency} ${expense.toFixed(2)}\n` +
      `Total Savings: ${baseCurrency} ${savings.toFixed(2)}\n`;
    await sendMail({ to: user.email, subject, text: body });
    res.json({ sent: true });
  } catch (err) {
    next(err);
  }
};

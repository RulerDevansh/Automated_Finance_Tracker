import { getCategoryById } from '../models/categoryModel.js';
import { deleteBudget, listBudgets, upsertBudget } from '../models/budgetModel.js';
import { listTransactions } from '../models/transactionModel.js';
import { findById } from '../models/userModel.js';
import { convert } from '../utils/fx.js';
import { sendMail } from '../utils/mailer.js';

const formatMonthDay = (month) => month.toString().padStart(2, '0');

const sumSpentForBudget = async ({ userId, categoryId, periodMonth, periodYear, targetCurrency }) => {
  const monthStr = formatMonthDay(periodMonth);
  const lastDay = new Date(periodYear, periodMonth, 0).getDate();
  const toDay = lastDay.toString().padStart(2, '0');
  const from = `${periodYear}-${monthStr}-01`;
  const to = `${periodYear}-${monthStr}-${toDay}`;
  const txs = await listTransactions({ userId, from, to, type: 'expense', categoryId, limit: 10000, offset: 0 });
  let spent = 0;
  for (const tx of txs) {
    spent += await convert(Number(tx.amount), tx.currency || 'INR', targetCurrency);
  }
  return spent;
};

const notifyBudget = async ({ user, categoryName, amount, currency, spent, periodMonth, periodYear }) => {
  if (!user?.email) return;
  const overrun = spent > amount;
  const subject = overrun ? 'Budget alert: over limit' : 'Budget set';
  const body = `Hi ${user.full_name || 'there'},\n\n` +
    `Budget for ${categoryName} (${periodMonth}/${periodYear}) is ${currency} ${amount.toFixed(2)}.\n` +
    `Current spend: ${currency} ${spent.toFixed(2)}.\n` +
    (overrun ? 'You have exceeded your budget.' : 'You are within your budget.');
  await sendMail({ to: user.email, subject, text: body });
};

const checkOverrunForCategoryMonth = async ({ user, category, budget }) => {
  const spent = await sumSpentForBudget({ userId: budget.user_id, categoryId: budget.category_id, periodMonth: budget.period_month, periodYear: budget.period_year, targetCurrency: budget.currency });
  if (spent > Number(budget.amount)) {
    await notifyBudget({
      user,
      categoryName: category.name,
      amount: Number(budget.amount),
      currency: budget.currency,
      spent,
      periodMonth: budget.period_month,
      periodYear: budget.period_year
    });
  }
};

export const setBudget = async ({ userId, categoryId, amount, currency = 'INR', periodMonth, periodYear }) => {
  const category = await getCategoryById({ id: categoryId, userId });
  if (!category) {
    const err = new Error('Category not found');
    err.status = 404;
    throw err;
  }
  if (category.type !== 'expense') {
    const err = new Error('Budgets can only be set for expense categories');
    err.status = 400;
    throw err;
  }
  const normalizedAmount = Number.parseFloat(amount).toFixed(2);
  const budget = await upsertBudget({ userId, categoryId, amount: normalizedAmount, currency: currency.toUpperCase(), periodMonth, periodYear });

  const user = await findById(userId);
  const spent = await sumSpentForBudget({ userId, categoryId, periodMonth, periodYear, targetCurrency: budget.currency });
  await notifyBudget({ user, categoryName: category.name, amount: Number(normalizedAmount), currency: budget.currency, spent, periodMonth, periodYear });
  return budget;
};

export const getBudgets = async ({ userId, periodMonth, periodYear }) => {
  return listBudgets({ userId, periodMonth, periodYear });
};

export const checkBudgetOverrunForExpense = async ({ userId, categoryId, occurredOn }) => {
  if (!categoryId || !occurredOn) return;
  const month = new Date(occurredOn).getMonth() + 1;
  const year = new Date(occurredOn).getFullYear();
  const budgets = await listBudgets({ userId, periodMonth: month, periodYear: year, categoryId });
  if (!budgets.length) return;
  const category = await getCategoryById({ id: categoryId, userId });
  const user = await findById(userId);
  await Promise.all(budgets.map((b) => checkOverrunForCategoryMonth({ user, category, budget: b })));
};

export const removeBudget = async ({ id, userId }) => {
  const ok = await deleteBudget({ id, userId });
  if (!ok) {
    const err = new Error('Budget not found');
    err.status = 404;
    throw err;
  }
  return ok;
};

export const getBudgetProgress = async ({ userId, periodMonth, periodYear }) => {
  const budgets = await listBudgets({ userId, periodMonth, periodYear });
  const results = [];
  for (const b of budgets) {
    const spent = await sumSpentForBudget({ userId, categoryId: b.category_id, periodMonth, periodYear, targetCurrency: b.currency });
    results.push({
      budgetId: b.id,
      categoryId: b.category_id,
      amount: Number(b.amount),
      currency: b.currency,
      spent: Number(spent.toFixed(2)),
      remaining: Number((Number(b.amount) - spent).toFixed(2))
    });
  }
  return results;
};

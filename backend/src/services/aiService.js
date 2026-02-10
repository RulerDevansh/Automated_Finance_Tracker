import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { listCategories, createCategory } from '../models/categoryModel.js';
import { findById } from '../models/userModel.js';
import { listTransactions } from '../models/transactionModel.js';
import { setBudget, getBudgets } from './budgetService.js';
import { addTransaction } from './transactionService.js';

// Model preference order with automatic fallbacks when rate-limited
const modelOrder = ['gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.5-flash-lite'];

const getModel = (model = primaryModel) => {
  if (!env.googleApiKey) {
    throw new Error('GOOGLE_API_KEY not configured');
  }
  const genAI = new GoogleGenerativeAI(env.googleApiKey);
  return genAI.getGenerativeModel({ model });
};

const monthName = (m) => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1] || `M${m}`;

const summarizeRecent = async (userId) => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 10);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
  const txs = await listTransactions({ userId, from, to, limit: 10000, offset: 0 });
  const monthly = new Map();
  for (const tx of txs) {
    const m = new Date(tx.occurred_on).getMonth() + 1;
    const row = monthly.get(m) || { income: 0, expense: 0 };
    row[tx.type] += Number(tx.amount);
    monthly.set(m, row);
  }
  return Array.from(monthly.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([m, row]) => `${monthName(m)} income ${row.income.toFixed(2)}, expense ${row.expense.toFixed(2)}`)
    .join('; ');
};

const currentMonthContext = async (userId) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const monthStr = month.toString().padStart(2, '0');
  const from = `${year}-${monthStr}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${monthStr}-${lastDay.toString().padStart(2, '0')}`;

  const [budgets, txs] = await Promise.all([
    getBudgets({ userId, periodMonth: month, periodYear: year }),
    listTransactions({ userId, from, to, limit: 50, offset: 0 })
  ]);

  return { budgets, txs, month, year };
};

const systemInstructions = ({ baseCurrency, categories, recentSummary, currentDate, currentMonthBudget, currentMonthTx, chatHistory }) => `You are an assistant that helps manage budgets and transactions. Follow these rules strictly:
- Today's date (ISO): ${currentDate}. Use this for any date reasoning.
- Current month (${currentMonthBudget.month}/${currentMonthBudget.year}) budgets: ${currentMonthBudget.summary}.
- Current month transactions (latest up to 10): ${currentMonthTx}.
- Recent chat (oldest first): ${chatHistory || 'none'}.
- Always respond with a single JSON object. No additional text. Schema: {"reply": string, "action"?: "create_budget"|"create_transaction"|"create_category", "confirmNeeded"?: boolean, "data"?: object, "actions"?: [{"action": "create_budget"|"create_transaction"|"create_category", "data": object}]}
- Use the user's base currency ${baseCurrency} if currency is missing; otherwise accept provided currency code.
- Categories available: ${categories.map((c) => `${c.name} (${c.type})`).join(', ') || 'none'}.
- Recent monthly totals: ${recentSummary || 'none'}.
- Budget flow: if user asks to create budget and gives category/amount, set action=create_budget with periodMonth (default current month) and periodYear (current year). If category not found, first map to the closest existing broader category; only suggest creating when the user explicitly wants a new category.
- Transaction flow: infer type (expense/income). Prefer mapping specific categories to existing broader ones (e.g., movies/concert/comedy -> entertainment). If no close match exists, set confirmNeeded=true and suggest a broad category name. Include amount, currency, description, occurredOn, categoryName. If the user says today/now/yesterday, use that date relative to today's date above. If no date is provided, set confirmNeeded=true and ask for a date. Never invent dates.
- Category flow: when asked to create a category, set action=create_category with a broad name, never a one-off event (e.g., prefer "entertainment" over "movies").
- If nothing matches, ask the user to pick an existing broad category from the list or provide a broad label; do not create narrow one-off categories.
- If the command is fully specified, set confirmNeeded=false and include all needed fields.
- If the user requests multiple actions (e.g., create category then record transaction), return them in order inside the actions array; keep reply concise.
- reply should be short, guiding the user or confirming what you did/plan to do.
- Keep amounts numeric (no currency symbols).`;

export const handleChat = async ({ userId, message, history = [] }) => {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Short-circuit if user explicitly asks for today's date
  if (/\b(today'?s date|what is today|today\s*\?|current date)\b/i.test(message || '')) {
    return { reply: `Today's date is ${todayStr}.`, confirmNeeded: false };
  }

  const messageText = String(message || '');

  const [user, categories] = await Promise.all([
    findById(userId),
    listCategories({ userId })
  ]);
  const baseCurrency = user?.base_currency || 'INR';
  const recentSummary = await summarizeRecent(userId);
  const { budgets, txs, month, year } = await currentMonthContext(userId);

  const categoryById = new Map(categories.map((c) => [c.id, c.name]));
  const budgetSummary = budgets
    .map((b) => {
      const name = b.category_name || categoryById.get(b.category_id) || b.category_id;
      return `${b.currency} ${Number(b.amount).toFixed(2)} for ${name}`;
    })
    .join('; ');

  const txSummary = txs
    .slice(0, 10)
    .map((t) => `${t.occurred_on} ${t.type} ${t.currency} ${Number(t.amount).toFixed(2)} ${t.description || ''}`.trim())
    .join('; ');

  const chatHistory = Array.isArray(history)
    ? history
        .filter((h) => h && h.role && h.content)
        .slice(-10)
        .map((h) => `${h.role}: ${h.content}`)
        .join(' | ')
    : '';

  const prompt = `${systemInstructions({
    baseCurrency,
    categories,
    recentSummary,
    currentDate: todayStr,
    currentMonthBudget: { summary: budgetSummary, month, year },
    currentMonthTx: txSummary,
    chatHistory
  })}\nUser: ${messageText}`;
  const generate = async (modelName) => {
    const model = getModel(modelName);
    return model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, responseMimeType: 'application/json' }
    });
  };

  const isRateLimit = (err) => {
    const msg = String(err?.message || '').toLowerCase();
    return err?.status === 429 || msg.includes('rate') || msg.includes('quota') || msg.includes('exceed') || msg.includes('limit');
  };

  let result;
  let lastErr;
  for (const modelName of modelOrder) {
    try {
      result = await generate(modelName);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (!isRateLimit(err)) break;
    }
  }
  if (!result) throw lastErr;

  let data;
  try {
    data = JSON.parse(result.response.text());
  } catch (err) {
    return { reply: 'I could not understand that. Please rephrase.', confirmNeeded: true };
  }

  const reply = data.reply || 'Ok';
  const action = data.action;
  const confirmNeeded = Boolean(data.confirmNeeded);
  const payload = data.data || {};
  const actionsBatch = Array.isArray(data.actions) ? data.actions : null;

  const messageLower = messageText.toLowerCase();
  const containsBudgetWord = /\bbudget\b/.test(messageLower);

  const parseDateFromMessage = () => {
    const isoMatch = messageText.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    if (isoMatch) return isoMatch[1];

    // e.g., 6th feb, 6 feb, 06 february
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec'];
    const md = messageText.toLowerCase().match(/\b(\d{1,2})(st|nd|rd|th)?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)\b/);
    if (md) {
      const day = md[1].padStart(2, '0');
      const monRaw = md[3].slice(0, 3);
      const monIndex = monthNames.indexOf(monRaw);
      if (monIndex >= 0) {
        const year = new Date().getFullYear();
        const monthNum = (monIndex + 1).toString().padStart(2, '0');
        return `${year}-${monthNum}-${day}`;
      }
    }

    return null;
  };

  const normalize = (val) => String(val || '').trim().toLowerCase();

  const resolveCategory = (name) => {
    if (!name) return null;
    const target = normalize(name);
    const exact = categories.find((c) => normalize(c.name) === target);
    if (exact) return exact;
    return categories.find((c) => target.includes(normalize(c.name)) || normalize(c.name).includes(target)) || null;
  };

  const execute = async (act, pl) => {
    try {
      if (act === 'create_category') {
        const name = pl.categoryName || pl.name;
        const type = pl.type || 'expense';

        const mapped = resolveCategory(name);
        if (mapped) {
          return { reply: `Used existing category ${mapped.name}`, actionExecuted: act };
        }

        if (!name) {
          const broadList = categories.map((c) => c.name).join(', ') || 'none yet';
          return { reply: `Provide a category name (existing: ${broadList}).`, confirmNeeded: true, action: 'create_category' };
        }

        try {
          const created = await createCategory({ userId, name, type });
          categories.push(created); // keep in-memory list fresh for later actions
          return { reply: `Created category ${created.name}`, actionExecuted: act, createdCategory: created };
        } catch (err) {
          const fallback = resolveCategory(name);
          if (fallback) {
            return { reply: `Used existing category ${fallback.name}`, actionExecuted: act };
          }
          return { reply: err.message || 'Could not create category', confirmNeeded: true };
        }
      }

      if (act === 'create_budget') {
        const cat = resolveCategory(pl.categoryName || pl.category);
        if (!cat) {
          return { reply: 'No matching category. Should I create it?', confirmNeeded: true, action: 'create_category', data: { name: pl.categoryName, type: 'expense' } };
        }
        const amount = Number(pl.amount);
        if (!Number.isFinite(amount) || amount <= 0) {
          return { reply: 'I need a positive amount for the budget.', confirmNeeded: true };
        }
        const nowLocal = new Date();
        const periodMonth = pl.periodMonth || (nowLocal.getMonth() + 1);
        const periodYear = pl.periodYear || nowLocal.getFullYear();
        const currency = (pl.currency || baseCurrency).toUpperCase();
        await setBudget({ userId, categoryId: cat.id, amount, currency, periodMonth, periodYear });
        return { reply: `Budget set for ${cat.name} at ${currency} ${amount.toFixed(2)}`, actionExecuted: act };
      }

      if (act === 'create_transaction') {
        if (containsBudgetWord) {
          return {
            reply: 'You mentioned a budget. Do you want to set a budget instead? If yes, tell me the category and month; otherwise say "record expense" with date.',
            confirmNeeded: true,
            action: 'create_budget',
            data: { categoryName: pl.categoryName || pl.category, amount: pl.amount }
          };
        }

        const catName = pl.categoryName || pl.category;
        const incomeHint = /\b(salary|paycheck|income|bonus|payout|credit|credited|deposit|deposited|transfer in|transfer-in|received|refund)\b/i.test(messageText);
        const inferredType = incomeHint ? 'income' : (pl.type || 'expense');

        let cat = resolveCategory(catName);
        if (!cat || cat.type !== inferredType) {
          try {
            const created = await createCategory({ userId, name: catName || 'General', type: inferredType });
            categories.push(created);
            cat = { id: created.id, name: created.name };
          } catch (err) {
            // If category already exists (unique constraint), resolve again and continue
            cat = resolveCategory(catName);
            if (!cat) {
              return { reply: err.message || 'Could not create category', confirmNeeded: true };
            }
          }
        }
        const amount = Number(pl.amount);
        if (!Number.isFinite(amount)) {
          return { reply: 'I need a numeric amount for the transaction.', confirmNeeded: true };
        }
        const type = inferredType;
        const currency = (pl.currency || baseCurrency).toUpperCase();
        const description = pl.description || pl.note || 'Added via chat';
        const todayLocal = new Date();
        const todayStrLocal = todayLocal.toISOString().slice(0, 10);
        const yesterdayStr = new Date(todayLocal.getTime() - 86400000).toISOString().slice(0, 10);

        const wantsToday = /\b(today|just now|now)\b/i.test(messageText);
        const wantsYesterday = /\byesterday\b/i.test(messageText);

        const dateInMessage = parseDateFromMessage();

        let occurredOn = pl.occurredOn || dateInMessage;
        if (occurredOn) {
          const parsed = new Date(occurredOn);
          if (!Number.isNaN(parsed.getTime())) {
            occurredOn = parsed.toISOString().slice(0, 10);
          } else {
            occurredOn = null;
          }
        }

        if (!occurredOn) {
          if (wantsToday) occurredOn = todayStrLocal;
          else if (wantsYesterday) occurredOn = yesterdayStr;
        }

        if (!occurredOn) {
          return { reply: 'Please provide a date (today, yesterday, or YYYY-MM-DD) for this transaction.', confirmNeeded: true };
        }

        await addTransaction({ userId, categoryId: cat.id, type, amount, currency, description, occurredOn });
        return { reply: `Transaction added in ${cat.name}`, actionExecuted: act };
      }
    } catch (err) {
      return { reply: err.message || 'Could not complete the action', confirmNeeded: true };
    }

    return { reply };
  };

  // Batch actions support; if confirmation is requested, do not execute
  if (actionsBatch && actionsBatch.length) {
    if (confirmNeeded) {
      return { reply, confirmNeeded: true, action: action || 'batch', pendingActions: actionsBatch };
    }

    const replies = [];
    for (const item of actionsBatch) {
      const actResult = await execute(item.action, item.data || {});
      replies.push(actResult.reply);
      if (actResult.confirmNeeded) {
        return { ...actResult, reply: `${reply}. ${replies.join(' ')}` };
      }
    }
    return { reply: `${reply}. ${replies.join(' ')}`, actionExecuted: 'batch' };
  }

  // Single action
  if (!action || confirmNeeded) {
    return { reply, confirmNeeded, action: action || null };
  }

  return execute(action, payload);
};

import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { useForm } from '../hooks/useForm.js';

export const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [progress, setProgress] = useState([]);
  const { values, onChange, reset } = useForm({
    categoryId: '',
    amount: '',
    periodMonth: new Date().getMonth() + 1,
    periodYear: new Date().getFullYear()
  });

  const load = async () => {
    const [catRes, budgetRes, progRes] = await Promise.all([
      api.get('/categories?type=expense'),
      api.get('/budgets'),
      api.get('/reports/budget-progress', {
        params: { month: values.periodMonth, year: values.periodYear }
      })
    ]);
    setCategories(catRes.data);
    setBudgets(budgetRes.data);
    setProgress(progRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await api.post('/budgets', { ...values, amount: Number(values.amount) });
    reset();
    load();
  };

  const handleDelete = async (id) => {
    await api.delete(`/budgets/${id}`);
    load();
  };

  const progressMap = progress.reduce((acc, p) => {
    acc[p.categoryId] = p;
    return acc;
  }, {});

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title="Set budget">
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          <select name="categoryId" value={values.categoryId} onChange={onChange} className="border rounded px-2 py-2 w-full">
            <option value="">Select expense category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              name="amount"
              value={values.amount}
              onChange={onChange}
              type="number"
              step="0.01"
              placeholder="Amount"
              className="border rounded w-full px-2 py-2"
            />
            <input
              name="periodMonth"
              value={values.periodMonth}
              onChange={onChange}
              type="number"
              min="1"
              max="12"
              className="border rounded w-full px-2 py-2"
            />
            <input
              name="periodYear"
              value={values.periodYear}
              onChange={onChange}
              type="number"
              min="2000"
              className="border rounded w-full px-2 py-2"
            />
          </div>
          <button type="submit" className="bg-ink text-white px-3 py-2 rounded">Save budget</button>
        </form>
      </Card>

      <Card title="Budgets" action={<span className="text-xs text-slate-500">{budgets.length} items</span>}>
        <div className="space-y-3 text-sm">
          {budgets.map((b) => {
            const prog = progressMap[b.category_id] || {};
            const remaining = prog.remaining ?? Number(b.amount);
            const spent = prog.spent ?? 0;
            const pct = Math.min(100, Math.max(0, (spent / Number(b.amount)) * 100));
            const label = categories.find((c) => c.id === b.category_id)?.name || b.category_id;
            return (
              <div key={b.id} className="border-b pb-2">
                <div className="flex justify-between">
                  <div className="font-medium">{label}</div>
                  <button className="text-red-600 text-xs" onClick={() => handleDelete(b.id)}>
                    Delete
                  </button>
                </div>
                <div className="text-xs text-slate-500 mb-1">
                  ${Number(b.amount).toFixed(2)} for {b.period_month}/{b.period_year}
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-2 bg-mint" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Spent ${spent.toFixed(2)} • Remaining ${remaining.toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

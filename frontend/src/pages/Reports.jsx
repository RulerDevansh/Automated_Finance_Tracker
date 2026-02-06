import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export const Reports = () => {
  const [report, setReport] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const load = async () => {
      const res = await api.get('/reports/monthly', { params: { year } });
      setReport(res.data);
    };
    load();
  }, [year]);

  const totalIncome = report.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = report.reduce((sum, m) => sum + m.expense, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-3 py-2 w-28"
        />
      </div>

      <Card title="Monthly income vs expenses">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={report} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="expense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#income)" name="Income" />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#expense)" name="Expense" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Totals">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white border rounded p-3 text-sm">
            <div className="text-slate-500">Income</div>
            <div className="text-green-600 text-xl font-semibold">${totalIncome.toFixed(2)}</div>
          </div>
          <div className="bg-white border rounded p-3 text-sm">
            <div className="text-slate-500">Expenses</div>
            <div className="text-red-600 text-xl font-semibold">${totalExpense.toFixed(2)}</div>
          </div>
          <div className="bg-white border rounded p-3 text-sm">
            <div className="text-slate-500">Savings</div>
            <div className="text-ink text-xl font-semibold">${(totalIncome - totalExpense).toFixed(2)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

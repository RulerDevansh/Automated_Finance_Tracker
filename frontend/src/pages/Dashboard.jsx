import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { Stat } from '../components/Stat.jsx';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const { baseCurrency, updateBaseCurrency } = useAuth();
  const currencies = ['INR', 'USD', 'EUR'];

  useEffect(() => {
    const load = async () => {
      const [reportRes, catRes] = await Promise.all([
        api.get('/reports/dashboard', { params: { baseCurrency } }),
        api.get('/categories')
      ]);
      setData(reportRes.data);
      setCategories(catRes.data);
    };
    load();
  }, [baseCurrency]);

  if (!data) return <div className="p-6">Loading...</div>;

  const symbol = (code) => ({ INR: '₹', USD: '$', EUR: '€' }[code] || `${code} `);
  const currencyTick = (v) => `${symbol(baseCurrency)}${Number(v).toLocaleString('en-IN')}`;
  const tooltipFormatter = (value, name) => [currencyTick(value), name];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Base currency</label>
        <select
          value={baseCurrency}
          onChange={(e) => updateBaseCurrency(e.target.value)}
          className="border rounded px-3 py-2 w-32 text-sm"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Income" value={`${symbol(baseCurrency)}${Number(data.totals.income).toFixed(2)}`} accent="text-green-600" />
        <Stat label="Expenses" value={`${symbol(baseCurrency)}${Number(data.totals.expense).toFixed(2)}`} accent="text-red-600" />
        <Stat label="Savings" value={`${symbol(baseCurrency)}${Number(data.totals.savings).toFixed(2)}`} accent="text-ink" />
      </div>

      <Card title="Monthly breakdown">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly} barCategoryGap={48} barSize={34} margin={{ top: 32, right: 20, left: 0, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tickMargin={8} />
              <YAxis tickFormatter={currencyTick} width={80} />
              <Tooltip formatter={tooltipFormatter} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend verticalAlign="bottom" height={32} />
              <Bar
                dataKey="income"
                fill="#10b981"
                name="Income"
                label={{ position: 'top', formatter: currencyTick, fill: '#0f172a', fontSize: 12 }}
              />
              <Bar
                dataKey="expense"
                fill="#ef4444"
                name="Expense"
                label={{ position: 'top', formatter: currencyTick, fill: '#0f172a', fontSize: 12 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="By category">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-red-600 mb-2">Expenses</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory.filter((c) => c.type === 'expense')}
                    dataKey="total"
                    nameKey="categoryId"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {data.byCategory
                      .filter((c) => c.type === 'expense')
                      .map((entry, idx) => (
                        <Cell key={entry.categoryId} fill={idx % 2 === 0 ? '#ef4444' : '#f97316'} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm mt-3">
              {data.byCategory
                .filter((c) => c.type === 'expense')
                .map((c) => {
                  const cat = categories.find((x) => x.id === c.categoryId);
                  const label = cat ? cat.name : c.categoryId;
                  return (
                    <div key={c.categoryId} className="flex items-center justify-between border-b pb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="text-red-600">{symbol(baseCurrency)}{c.total.toFixed(2)}</span>
                    </div>
                  );
                })}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-green-600 mb-2">Income</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byCategory.filter((c) => c.type === 'income')}
                    dataKey="total"
                    nameKey="categoryId"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {data.byCategory
                      .filter((c) => c.type === 'income')
                      .map((entry, idx) => (
                        <Cell key={entry.categoryId} fill={idx % 2 === 0 ? '#10b981' : '#22c55e'} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-sm mt-3">
              {data.byCategory
                .filter((c) => c.type === 'income')
                .map((c) => {
                  const cat = categories.find((x) => x.id === c.categoryId);
                  const label = cat ? cat.name : c.categoryId;
                  return (
                    <div key={c.categoryId} className="flex items-center justify-between border-b pb-1">
                      <span className="text-slate-600">{label}</span>
                      <span className="text-green-600">{symbol(baseCurrency)}{c.total.toFixed(2)}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

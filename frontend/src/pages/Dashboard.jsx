import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { Stat } from '../components/Stat.jsx';
import { Bar, BarChart, CartesianGrid, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const load = async () => {
      const [reportRes, catRes] = await Promise.all([
        api.get('/reports/dashboard'),
        api.get('/categories')
      ]);
      setData(reportRes.data);
      setCategories(catRes.data);
    };
    load();
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Income" value={`$${Number(data.totals.income).toFixed(2)}`} accent="text-green-600" />
        <Stat label="Expenses" value={`$${Number(data.totals.expense).toFixed(2)}`} accent="text-red-600" />
        <Stat label="Savings" value={`$${Number(data.totals.savings).toFixed(2)}`} accent="text-ink" />
      </div>

      <Card title="Monthly breakdown">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="income" stackId="a" fill="#10b981" name="Income" />
              <Bar dataKey="expense" stackId="a" fill="#ef4444" name="Expense" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="By category">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="space-y-2 text-sm">
            {data.byCategory.map((c) => {
              const cat = categories.find((x) => x.id === c.categoryId);
              const label = cat ? cat.name : c.categoryId;
              return (
                <div key={c.categoryId} className="flex items-center justify-between border-b pb-1">
                  <span className="text-slate-600">{label}</span>
                  <span className={c.type === 'income' ? 'text-green-600' : 'text-red-600'}>${c.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
};

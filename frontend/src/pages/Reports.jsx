import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';

export const Reports = () => {
  const [report, setReport] = useState([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [fromMonth, setFromMonth] = useState(1);
  const [toMonth, setToMonth] = useState(new Date().getMonth() + 1);
  const [sending, setSending] = useState(false);
  const [summaryMessage, setSummaryMessage] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const { baseCurrency, updateBaseCurrency } = useAuth();
  const currencies = ['INR', 'USD', 'EUR'];
  const symbol = (code) => ({ INR: '₹', USD: '$', EUR: '€' }[code] || `${code} `);

  useEffect(() => {
    const load = async () => {
      const res = await api.get('/reports/monthly', { params: { year, baseCurrency } });
      setReport(res.data);
    };
    load();
  }, [year, baseCurrency]);

  const totalIncome = report.reduce((sum, m) => sum + m.income, 0);
  const totalExpense = report.reduce((sum, m) => sum + m.expense, 0);

  const sendSummary = async () => {
    setSending(true);
    setSummaryMessage('');
    setSummaryError('');
    try {
      if (fromMonth < 1 || toMonth > 12 || fromMonth > toMonth) {
        setSummaryError('Enter a valid month range');
        setSending(false);
        return;
      }
      await api.post('/reports/summary-email', { year, fromMonth, toMonth, baseCurrency });
      setSummaryMessage('Summary email sent');
    } catch (err) {
      setSummaryError(err.response?.data?.message || 'Could not send summary email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">Year</label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="border rounded px-3 py-2 w-28"
        />
        <label className="text-sm text-slate-600 ml-4">Base currency</label>
        <select
          value={baseCurrency}
          onChange={(e) => updateBaseCurrency(e.target.value)}
          className="border rounded px-3 py-2 w-32 text-sm"
        >
          {currencies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex items-center gap-2 ml-4">
          <label className="text-sm text-slate-600">Summary months</label>
          <input
            type="number"
            min="1"
            max="12"
            value={fromMonth}
            onChange={(e) => setFromMonth(Number(e.target.value))}
            className="border rounded px-2 py-2 w-20"
          />
          <span className="text-slate-500">to</span>
          <input
            type="number"
            min="1"
            max="12"
            value={toMonth}
            onChange={(e) => setToMonth(Number(e.target.value))}
            className="border rounded px-2 py-2 w-20"
          />
          <button
            onClick={sendSummary}
            disabled={sending}
            className="bg-ink text-white px-3 py-2 rounded text-sm"
          >
            {sending ? 'Sending…' : 'Email summary'}
          </button>
          {summaryMessage && <span className="text-xs text-green-700">{summaryMessage}</span>}
          {summaryError && <span className="text-xs text-red-600">{summaryError}</span>}
        </div>
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
            <div className="text-green-600 text-xl font-semibold">{symbol(baseCurrency)}{totalIncome.toFixed(2)}</div>
          </div>
          <div className="bg-white border rounded p-3 text-sm">
            <div className="text-slate-500">Expenses</div>
            <div className="text-red-600 text-xl font-semibold">{symbol(baseCurrency)}{totalExpense.toFixed(2)}</div>
          </div>
          <div className="bg-white border rounded p-3 text-sm">
            <div className="text-slate-500">Savings</div>
            <div className="text-ink text-xl font-semibold">{symbol(baseCurrency)}{(totalIncome - totalExpense).toFixed(2)}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

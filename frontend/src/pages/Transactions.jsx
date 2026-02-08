import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { useForm } from '../hooks/useForm.js';

export const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [receiptFile, setReceiptFile] = useState(null);
  const [message, setMessage] = useState('');
  const currencies = ['INR', 'USD', 'EUR'];
  const formatDate = (value) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const symbol = (code) => {
    const map = { INR: '₹', USD: '$', EUR: '€' };
    return map[(code || 'INR').toUpperCase()] || `${code} `;
  };
  const { values, onChange, reset, setValues } = useForm({
    id: null,
    categoryId: '',
    type: 'expense',
    amount: '',
    currency: 'INR',
    description: '',
    occurredOn: new Date().toISOString().slice(0, 10)
  });

  const load = async () => {
    const [txRes, catRes] = await Promise.all([
      api.get('/transactions'),
      api.get('/categories')
    ]);
    setTransactions(txRes.data);
    setCategories(catRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const payload = { ...values, amount: Number(values.amount) };
    let txId = values.id;
    if (values.id) {
      await api.patch(`/transactions/${values.id}`, payload);
      setMessage('Transaction updated');
    } else {
      const res = await api.post('/transactions', payload);
      txId = res.data.id;
      setMessage('Transaction added');
    }
    if (receiptFile && txId) {
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      await api.post(`/transactions/${txId}/receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReceiptFile(null);
    }
    reset();
    setValues((prev) => ({ ...prev, occurredOn: new Date().toISOString().slice(0, 10), type: 'expense', currency: values.currency }));
    load();
  };

  const handleEdit = (tx) => {
    setValues({
      id: tx.id,
      categoryId: tx.category_id || '',
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency || 'INR',
      description: tx.description || '',
      occurredOn: tx.occurred_on
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/transactions/${id}`);
    setMessage('Transaction deleted');
    load();
  };

  const expenseTx = transactions.filter((tx) => tx.type === 'expense');
  const incomeTx = transactions.filter((tx) => tx.type === 'income');

  return (
    <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card title={values.id ? 'Edit transaction' : 'Add transaction'} className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          {message && <div className="text-green-700 text-xs">{message}</div>}
          <div className="grid grid-cols-2 gap-3">
            <select name="type" value={values.type} onChange={onChange} className="border rounded px-2 py-2">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select name="categoryId" value={values.categoryId} onChange={onChange} className="border rounded px-2 py-2">
              <option value="">No category</option>
              {categories
                .filter((c) => c.type === values.type)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <select name="currency" value={values.currency} onChange={onChange} className="border rounded px-2 py-2 w-full">
            {currencies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
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
            name="description"
            value={values.description}
            onChange={onChange}
            placeholder="Description"
            className="border rounded w-full px-2 py-2"
          />
          <input
            name="occurredOn"
            value={values.occurredOn}
            onChange={onChange}
            type="date"
            className="border rounded w-full px-2 py-2"
          />
          <div>
            <label className="text-xs text-slate-600">Receipt (PDF, optional)</label>
            <input type="file" accept="application/pdf" onChange={(e) => setReceiptFile(e.target.files?.[0] || null)} className="w-full text-sm" />
          </div>
          <div className="flex gap-2">
            <button className="bg-ink text-white px-3 py-2 rounded" type="submit">
              {values.id ? 'Update' : 'Add'}
            </button>
            {values.id && (
              <button type="button" className="border px-3 py-2 rounded" onClick={() => reset()}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      <Card
        title="Transactions"
        action={<span className="text-xs text-slate-500">{transactions.length} items</span>}
        className="lg:col-span-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Expenses</h4>
            <div className="space-y-3">
              {expenseTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b pb-2">
                  <div className="min-w-0">
                    <div className="font-medium break-words">{tx.description || 'No description'}</div>
                    <div className="text-xs text-slate-500 flex gap-2 items-center flex-wrap">
                      <span>{formatDate(tx.occurred_on)}</span>
                      {tx.category_id && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                          {categories.find((c) => c.id === tx.category_id)?.name || tx.category_id}
                        </span>
                      )}
                      {tx.receipt_url && (
                        <a className="text-ink underline" href={tx.receipt_url} target="_blank" rel="noreferrer">Receipt</a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-red-600">-{symbol(tx.currency)}{Number(tx.amount).toFixed(2)}</div>
                    <div className="text-xs text-slate-500 flex gap-2 justify-end">
                      <button onClick={() => handleEdit(tx)} className="text-ink">Edit</button>
                      <button onClick={() => handleDelete(tx.id)} className="text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {expenseTx.length === 0 && <div className="text-xs text-slate-400">No expense transactions</div>}
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Income</h4>
            <div className="space-y-3">
              {incomeTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between border-b pb-2">
                  <div className="min-w-0">
                    <div className="font-medium break-words">{tx.description || 'No description'}</div>
                    <div className="text-xs text-slate-500 flex gap-2 items-center flex-wrap">
                      <span>{formatDate(tx.occurred_on)}</span>
                      {tx.category_id && (
                        <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                          {categories.find((c) => c.id === tx.category_id)?.name || tx.category_id}
                        </span>
                      )}
                      {tx.receipt_url && (
                        <a className="text-ink underline" href={tx.receipt_url} target="_blank" rel="noreferrer">Receipt</a>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-green-600">+{symbol(tx.currency)}{Number(tx.amount).toFixed(2)}</div>
                    <div className="text-xs text-slate-500 flex gap-2 justify-end">
                      <button onClick={() => handleEdit(tx)} className="text-ink">Edit</button>
                      <button onClick={() => handleDelete(tx.id)} className="text-red-600">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              {incomeTx.length === 0 && <div className="text-xs text-slate-400">No income transactions</div>}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

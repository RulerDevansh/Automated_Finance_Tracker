import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { useForm } from '../hooks/useForm.js';

export const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const { values, onChange, reset, setValues } = useForm({
    id: null,
    categoryId: '',
    type: 'expense',
    amount: '',
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
    const payload = { ...values, amount: Number(values.amount) };
    if (values.id) {
      await api.patch(`/transactions/${values.id}`, payload);
    } else {
      await api.post('/transactions', payload);
    }
    reset();
    setValues((prev) => ({ ...prev, occurredOn: new Date().toISOString().slice(0, 10), type: 'expense' }));
    load();
  };

  const handleEdit = (tx) => {
    setValues({
      id: tx.id,
      categoryId: tx.category_id || '',
      type: tx.type,
      amount: tx.amount,
      description: tx.description || '',
      occurredOn: tx.occurred_on
    });
  };

  const handleDelete = async (id) => {
    await api.delete(`/transactions/${id}`);
    load();
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title={values.id ? 'Edit transaction' : 'Add transaction'}>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
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

      <Card title="Transactions" action={<span className="text-xs text-slate-500">{transactions.length} items</span>}>
        <div className="space-y-2 max-h-[500px] overflow-auto text-sm">
          {transactions.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium">{tx.description || 'No description'}</div>
                <div className="text-xs text-slate-500 flex gap-2 items-center">
                  <span>{tx.occurred_on}</span>
                  {tx.category_id && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-full">
                      {categories.find((c) => c.id === tx.category_id)?.name || tx.category_id}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                  {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 flex gap-2 justify-end">
                  <button onClick={() => handleEdit(tx)} className="text-ink">Edit</button>
                  <button onClick={() => handleDelete(tx.id)} className="text-red-600">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

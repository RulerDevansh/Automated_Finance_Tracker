import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { useForm } from '../hooks/useForm.js';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const { values, onChange, reset, setValues } = useForm({ id: null, name: '', type: 'expense' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const res = await api.get('/categories');
    setCategories(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (values.id) {
        await api.patch(`/categories/${values.id}`, { name: values.name });
        setMessage('Category updated');
      } else {
        await api.post('/categories', { name: values.name, type: values.type });
        setMessage('Category added');
      }
      reset();
      setValues({ id: null, name: '', type: 'expense' });
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    }
  };

  const startEdit = (cat) => {
    setValues({ id: cat.id, name: cat.name, type: cat.type });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      setMessage('Category deleted');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-6">
      <Card title={values.id ? 'Edit category' : 'Add category'} className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          {error && <div className="text-red-600 text-xs">{error}</div>}
          {message && !error && <div className="text-green-700 text-xs">{message}</div>}
          <input
            name="name"
            value={values.name}
            onChange={onChange}
            placeholder="Category name"
            className="border rounded w-full px-2 py-2"
          />
          {!values.id && (
            <select name="type" value={values.type} onChange={onChange} className="border rounded w-full px-2 py-2">
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          )}
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
        title="Your categories"
        action={<span className="text-xs text-slate-500">{categories.length} items</span>}
        className="lg:col-span-3"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Expenses</h4>
            <div className="space-y-4">
              {categories.filter((c) => c.type === 'expense').map((cat) => (
                <div key={cat.id} className="flex items-center pb-3 border-b border-slate-100">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium leading-tight break-words">{cat.name}</div>
                    <div className="text-xs text-slate-500">expense</div>
                  </div>
                  <div className="flex gap-4 text-xs text-right">
                    <button onClick={() => startEdit(cat)} className="text-ink">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-600">Delete</button>
                  </div>
                </div>
              ))}
              {categories.filter((c) => c.type === 'expense').length === 0 && (
                <div className="text-xs text-slate-400">No expense categories</div>
              )}
            </div>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-wide text-slate-500 mb-3">Income</h4>
            <div className="space-y-4">
              {categories.filter((c) => c.type === 'income').map((cat) => (
                <div key={cat.id} className="flex items-center pb-3 border-b border-slate-100">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium leading-tight break-words">{cat.name}</div>
                    <div className="text-xs text-slate-500">income</div>
                  </div>
                  <div className="flex gap-4 text-xs text-right">
                    <button onClick={() => startEdit(cat)} className="text-ink">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-600">Delete</button>
                  </div>
                </div>
              ))}
              {categories.filter((c) => c.type === 'income').length === 0 && (
                <div className="text-xs text-slate-400">No income categories</div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

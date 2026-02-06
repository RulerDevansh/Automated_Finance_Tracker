import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';
import { useForm } from '../hooks/useForm.js';

export const Categories = () => {
  const [categories, setCategories] = useState([]);
  const { values, onChange, reset, setValues } = useForm({ id: null, name: '', type: 'expense' });
  const [error, setError] = useState('');

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
    try {
      if (values.id) {
        await api.patch(`/categories/${values.id}`, { name: values.name });
      } else {
        await api.post('/categories', { name: values.name, type: values.type });
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
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card title={values.id ? 'Edit category' : 'Add category'}>
        <form onSubmit={handleSubmit} className="space-y-3 text-sm">
          {error && <div className="text-red-600 text-xs">{error}</div>}
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

      <Card title="Your categories" action={<span className="text-xs text-slate-500">{categories.length} items</span>}>
        <div className="space-y-2 text-sm">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium">{cat.name}</div>
                <div className="text-xs text-slate-500">{cat.type}</div>
              </div>
              <div className="flex gap-2 text-xs">
                <button onClick={() => startEdit(cat)} className="text-ink">Edit</button>
                <button onClick={() => handleDelete(cat.id)} className="text-red-600">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

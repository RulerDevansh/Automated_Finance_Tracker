import React, { useEffect, useState } from 'react';
import { api } from '../utils/api.js';
import { Card } from '../components/Card.jsx';

export const Profile = () => {
  const [profile, setProfile] = useState({ full_name: '', email: '' });
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const res = await api.get('/users/me');
      setProfile(res.data);
      setFullName(res.data.full_name || res.data.fullName || '');
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    await api.patch('/users/me', { fullName, newPassword: newPassword || undefined });
    setMessage('Profile updated');
    setNewPassword('');
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Card title="Profile">
        <form onSubmit={handleSave} className="space-y-3 text-sm">
          {message && <div className="text-green-700 text-xs">{message}</div>}
          <div>
            <label className="text-xs text-slate-600">Email</label>
            <input value={profile.email} disabled className="w-full border rounded px-3 py-2 bg-slate-50" />
          </div>
          <div>
            <label className="text-xs text-slate-600">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button type="submit" className="bg-ink text-white px-4 py-2 rounded">Save changes</button>
        </form>
      </Card>
    </div>
  );
};

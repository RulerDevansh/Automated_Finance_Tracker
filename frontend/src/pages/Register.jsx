import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const Register = () => {
  const { register, googleLogin, loading, baseCurrency } = useAuth();
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.google) {
      setGoogleReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => setGoogleReady(true);
    script.onerror = () => setGoogleReady(false);
    document.body.appendChild(script);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md shadow-lg rounded-xl p-8 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Create account</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Full name"
          name="fullName"
          value={form.fullName}
          onChange={handleChange}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-mint text-ink py-2 rounded hover:bg-mint/90"
        >
          {loading ? 'Creating...' : 'Register'}
        </button>
        <p className="text-sm text-center text-slate-600">
          Already have an account? <Link to="/login" className="text-ink font-semibold">Sign in</Link>
        </p>
        <div className="text-center text-xs text-slate-500">or</div>
        <button
          type="button"
          onClick={() => {
            setError('');
            if (!googleReady || !window.google || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
              setError('Google Sign-In not available');
              return;
            }
            window.google.accounts.id.initialize({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              ux_mode: 'popup',
              auto_select: false,
              callback: async (response) => {
                try {
                  await googleLogin({ idToken: response.credential, baseCurrency });
                  navigate('/dashboard');
                } catch (err) {
                  setError(err.response?.data?.message || 'Google login failed');
                }
              }
            });
            window.google.accounts.id.prompt((notification) => {
              if (notification.isNotDisplayed()) {
                setError(`Google prompt blocked: ${notification.getNotDisplayedReason()}`);
              }
              if (notification.isSkippedMoment()) {
                setError(`Google prompt skipped: ${notification.getSkippedReason()}`);
              }
            });
          }}
          className="w-full border text-slate-700 py-2 rounded hover:bg-slate-50"
          disabled={!googleReady}
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
};

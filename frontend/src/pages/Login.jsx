import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export const Login = () => {
  const { login, googleLogin, loading, baseCurrency } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleGoogle = () => {
    setError('');
    if (!googleReady || !window.google || !import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      setError('Google Sign-In not available');
      return;
    }
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      use_fedcm_for_prompt: true,
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
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <div className="text-xs tracking-wide text-slate-500 text-center">
        <a href="https://github.com/RulerDevansh">Made By Devansh Srivastava (@RulerDevansh</a>)
      </div>
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-md shadow-lg rounded-xl p-8 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-center">Welcome back</h1>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border rounded px-3 py-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-white py-2 rounded hover:bg-ink/90"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
        <p className="text-sm text-center text-slate-600">
          New here? <Link to="/register" className="text-mint font-semibold">Create an account</Link>
        </p>
        <div className="text-center text-xs text-slate-500">or</div>
        <button
          type="button"
          onClick={handleGoogle}
          className="w-full border text-slate-700 py-2 rounded hover:bg-slate-50"
          disabled={!googleReady}
        >
          Continue with Google
        </button>
      </form>
    </div>
  );
};

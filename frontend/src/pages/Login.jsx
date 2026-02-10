import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleLoginButton from '../components/GoogleLoginButton.jsx';

export const Login = () => {
  const { login, googleLogin, loading, baseCurrency } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [googleReady, setGoogleReady] = useState(true);

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

  const handleCredential = useCallback(async (credential) => {
    setError('');
    try {
      await googleLogin({ idToken: credential, baseCurrency });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Google login failed');
    }
  }, [googleLogin, baseCurrency, navigate]);

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
        <GoogleLoginButton onCredential={handleCredential} disabled={!googleReady} />
      </form>
    </div>
  );
};

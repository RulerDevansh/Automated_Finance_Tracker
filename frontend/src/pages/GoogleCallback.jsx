import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const parseHashParams = () => {
  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
  return new URLSearchParams(hash);
};

export const GoogleCallback = () => {
  const { googleLogin, baseCurrency } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const params = parseHashParams();
    const idToken = params.get('id_token');
    const receivedState = params.get('state');
    const storedNonce = sessionStorage.getItem('google_nonce');
    const nonce = params.get('nonce');

    if (!idToken) {
      setError('Missing Google token');
      return;
    }
    if (storedNonce && nonce && storedNonce !== nonce) {
      setError('Nonce mismatch');
      return;
    }

    const finish = async () => {
      try {
        console.log('GoogleCallback idToken:', idToken, 'nonce:', nonce);
        if (!idToken) {
          setError('Missing Google token');
          return;
        }
        await googleLogin({ idToken, baseCurrency });
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Google login failed');
      }
    };
    finish();
  }, [googleLogin, navigate, baseCurrency]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {error ? <div className="text-red-600 text-sm">{error}</div> : <div className="text-sm text-slate-700">Signing you in with Google…</div>}
    </div>
  );
};

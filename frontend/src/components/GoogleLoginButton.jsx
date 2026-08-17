import { useEffect, useRef } from 'react';
import { useState } from 'react';

let googleScriptPromise = null;
let googleInitializedClientId = null;

const loadGoogleScript = () => {
  if (window.google?.accounts) return Promise.resolve();

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');

      if (existingScript) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Google GSI script failed to load')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Google GSI script failed to load'));
      document.body.appendChild(script);
    });
  }

  return googleScriptPromise;
};

const GoogleLoginButton = ({ onCredential, disabled }) => {
  const buttonRef = useRef(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const [showRedirect, setShowRedirect] = useState(false);

  useEffect(() => {
    if (!clientId || !buttonRef.current || disabled) return;

    const initialize = async () => {
      try {
        await loadGoogleScript();

        if (!window.google?.accounts) return;

        if (googleInitializedClientId !== clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: ({ credential }) => credential && onCredential(credential),
            auto_select: false,
          });
          googleInitializedClientId = clientId;
        }

        const buttonContainer = buttonRef.current;
        buttonContainer.innerHTML = '';
        window.google.accounts.id.renderButton(buttonContainer, {
          theme: 'filled',
          shape: 'pill',
          width: 260,
          size: 'large',
        });
      } catch (error) {
        console.error('Google Sign-In initialization failed:', error);
        setShowRedirect(true);
      }
    };

    initialize();

    return () => {
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.cancel();
        } catch (error) {
          console.warn('Google Sign-In cancel failed:', error);
        }
      }
    };
  }, [clientId, onCredential, disabled]);

  if (!clientId) {
    return <p className="text-center text-sm text-red-600">Google Sign-In is not configured.</p>;
  }

  const redirectToGoogle = () => {
    const nonce = Math.random().toString(36).slice(2);
    sessionStorage.setItem('google_nonce', nonce);
    const redirectUri = `${window.location.origin}/google-callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'id_token',
      scope: 'openid email profile',
      redirect_uri: redirectUri,
      nonce,
      prompt: 'consent'
    });
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={buttonRef} className="flex justify-center" />
      {showRedirect && (
        <button type="button" onClick={redirectToGoogle} className="text-sm text-blue-600 underline">
          Sign in with Google (redirect)
        </button>
      )}
    </div>
  );
};

export default GoogleLoginButton;

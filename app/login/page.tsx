'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserAuth } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';
import { useI18n } from '@/components/I18nProvider';

export default function LoginPage() {
  const { t } = useI18n();
  const supabase = getSupabaseBrowserAuth();

  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSignIn() {
    setError(null);
    setMessage(null);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setError(error.message);
  }

  async function handleSignUp() {
    setError(null);
    setMessage(null);
    setBusy(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message);
    } else {
      setMessage(t('login.created'));
    }
  }

  async function handleSignOut() {
    setBusy(true);
    await supabase.auth.signOut();
    setBusy(false);
  }

  if (checking) {
    return (
      <div className="card">
        <p className="sub">{t('common.loading')}</p>
      </div>
    );
  }

  if (user) {
    return (
      <div>
        <div className="card">
          <h1 className="page-title">{t('login.account')}</h1>
          <p className="sub">{t('dash.signedInAs', { email: user.email ?? '' })}</p>
          <button className="btn danger" onClick={handleSignOut} disabled={busy}>
            {busy ? t('login.signingOut') : t('login.signOut')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h1 className="page-title">{mode === 'signin' ? t('login.titleIn') : t('login.titleUp')}</h1>
        <p className="sub">{t('login.sub')}</p>

        <div className="tabs">
          <button
            className={`tabbtn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => setMode('signin')}
          >
            {t('login.tabIn')}
          </button>
          <button
            className={`tabbtn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            {t('login.tabUp')}
          </button>
        </div>

        <label>{t('login.email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label>{t('login.password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('login.passwordHint')}
        />

        <button
          className="btn primary"
          onClick={mode === 'signin' ? handleSignIn : handleSignUp}
          disabled={busy || !email || !password}
        >
          {busy ? t('login.wait') : mode === 'signin' ? t('login.titleIn') : t('login.create')}
        </button>

        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}
      </div>
    </div>
  );
}
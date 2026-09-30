'use client';

import { useEffect, useState } from 'react';
import { getSupabaseBrowserAuth } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

export default function LoginPage() {
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
      setMessage('Account created. Check your email to confirm, then sign in.');
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
        <p className="sub">Loading…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div>
        <div className="card">
          <h1 className="page-title">Account</h1>
          <p className="sub">Signed in as {user.email}</p>
          <button className="btn danger" onClick={handleSignOut} disabled={busy}>
            {busy ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h1 className="page-title">{mode === 'signin' ? 'Log in' : 'Create an account'}</h1>
        <p className="sub">
          Signing in lets you track the QR codes and files you&rsquo;ve shared. Guest
          use never requires this.
        </p>

        <div className="tabs">
          <button
            className={`tabbtn ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Log in
          </button>
          <button
            className={`tabbtn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Sign up
          </button>
        </div>

        <label>Email</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />

        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />

        <button
          className="btn primary"
          onClick={mode === 'signin' ? handleSignIn : handleSignUp}
          disabled={busy || !email || !password}
        >
          {busy ? 'Please wait…' : mode === 'signin' ? 'Log in' : 'Create account'}
        </button>

        {error && <p className="error-text">{error}</p>}
        {message && <p className="sub" style={{ color: 'var(--good)' }}>{message}</p>}
      </div>
    </div>
  );
}
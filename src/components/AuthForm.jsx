'use client';

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function AuthForm() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError('');
    setLoading(true);

    try {
      if (tab === 'login') {
        await signIn.email({ email, password });
      } else {
        await signUp.email({ name, email, password });
      }
      router.push('/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    await signIn.social({ provider: 'google' });
  }

  return (
    <div style={styles.card}>
      <div style={styles.formHeader}>
        <h2 style={styles.h2}>
          {tab === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p style={styles.subtitle}>
          {tab === 'login'
            ? 'Sign in to access your flashcard sets'
            : 'Free forever. No credit card needed.'}
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabRow}>
        {['login', 'register'].map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            style={{
              ...styles.tab,
              ...(tab === t ? styles.tabActive : {}),
            }}
          >
            {t === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      {/* Fields */}
      {tab === 'register' && (
        <div style={styles.field}>
          <label style={styles.label}>Full name</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Alex Johnson"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      <div style={styles.field}>
        <label style={styles.label}>Email address</label>
        <input
          style={styles.input}
          type="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Password</label>
        <input
          style={styles.input}
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <button
        style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Please wait...' : tab === 'login' ? 'Sign in' : 'Create account'}
      </button>

      <div style={styles.divider}>
        <div style={styles.dividerLine} />
        <span style={styles.dividerText}>or</span>
        <div style={styles.dividerLine} />
      </div>

      <button style={styles.btnGoogle} onClick={handleGoogle}>
        <span>Continue with Google</span>
      </button>
    </div>
  );
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px 36px',
    width: '100%',
    maxWidth: 420,
  },
  formHeader: { marginBottom: 24 },
  h2: { fontSize: 22, fontWeight: 500, margin: '0 0 6px' },
  subtitle: { fontSize: 13, color: '#666', margin: 0 },
  tabRow: {
    display: 'flex',
    borderBottom: '1.5px solid #e5e7eb',
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    padding: '8px 0 10px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: 14,
    color: '#888',
    cursor: 'pointer',
    marginBottom: -1.5,
  },
  tabActive: {
    color: '#185FA5',
    borderBottom: '2px solid #185FA5',
    fontWeight: 500,
  },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 12, color: '#555', marginBottom: 5 },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    border: '1px solid #d1d5db',
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: { fontSize: 12, color: '#dc2626', marginBottom: 12 },
  btnPrimary: {
    width: '100%',
    padding: '10px',
    background: '#185FA5',
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    marginTop: 4,
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '18px 0',
  },
  dividerLine: { flex: 1, height: 1, background: '#e5e7eb' },
  dividerText: { fontSize: 12, color: '#aaa' },
  btnGoogle: {
    width: '100%',
    padding: '9px',
    background: '#fff',
    border: '1px solid #d1d5db',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
};

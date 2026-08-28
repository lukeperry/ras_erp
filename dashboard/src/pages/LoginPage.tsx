import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { login, error } = useAuth();
  const [usr, setUsr] = useState('');
  const [pwd, setPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(usr, pwd);
    } catch {
      // error is surfaced via auth context state
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>RAS Sales Desk</h1>
        <p className="subtitle">Sign in with your ERPNext account</p>

        <label htmlFor="usr">Username or email</label>
        <input
          id="usr"
          value={usr}
          onChange={(e) => setUsr(e.target.value)}
          autoComplete="username"
          required
        />

        <label htmlFor="pwd">Password</label>
        <input
          id="pwd"
          type="password"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { signIn, signUp } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { login } = useAuthContext();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (m: 'login' | 'signup') => {
    setMode(m);
    setError('');
    setUsername('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await signIn(username.trim(), password);
        if (res.success && res.user) { login(res.user); }
        else { setError(res.error || 'Login failed.'); }
      } else {
        const res = await signUp(username.trim(), password);
        if (res.success && res.user) { login(res.user); }
        else { setError(res.error || 'Sign up failed.'); }
      }
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 1rem 0.85rem 2.8rem',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--board-border)',
    background: 'var(--cell-bg)',
    color: 'var(--text-color)',
    fontSize: '1rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  const iconWrap: React.CSSProperties = {
    position: 'absolute',
    left: '0.9rem',
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--primary-color)',
    display: 'flex',
    alignItems: 'center',
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'var(--bg-color)',
    }}>
      {/* Logo / Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', marginBottom: '2rem' }}
      >
        <div style={{
          fontSize: '3rem',
          fontWeight: 900,
          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px',
          lineHeight: 1,
        }}>
          Tic Tac Toe
        </div>
        <div style={{ color: 'var(--text-color)', opacity: 0.6, fontSize: '0.95rem', marginTop: '0.4rem' }}>
          Online Multiplayer
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '2rem',
          borderRadius: 'var(--radius)',
        }}
      >
        {/* Tab Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--cell-bg)',
          borderRadius: 'var(--radius)',
          padding: '4px',
          marginBottom: '1.75rem',
          position: 'relative',
        }}>
          {(['login', 'signup'] as const).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '0.6rem',
                border: 'none',
                borderRadius: 'calc(var(--radius) - 2px)',
                background: mode === m ? 'var(--primary-color)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-color)',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '0.95rem',
                transition: 'all 0.25s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              {m === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />}
              {m === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Username */}
          <div style={{ position: 'relative' }}>
            <span style={iconWrap}><User size={16} /></span>
            <input
              id="auth-username"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoComplete="username"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ position: 'relative' }}>
            <span style={iconWrap}><Lock size={16} /></span>
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              style={{ ...inputStyle, paddingRight: '2.8rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', opacity: 0.6, display: 'flex', padding: 0 }}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Confirm Password (signup only) */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <span style={iconWrap}><Lock size={16} /></span>
                <input
                  id="auth-confirm-password"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required={mode === 'signup'}
                  autoComplete="new-password"
                  style={{ ...inputStyle, paddingRight: '2.8rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  style={{ position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-color)', opacity: 0.6, display: 'flex', padding: 0 }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#f87171',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius)',
                  fontSize: '0.875rem',
                  textAlign: 'center',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{
              padding: '0.9rem',
              borderRadius: 'var(--radius)',
              background: 'var(--primary-color)',
              color: '#fff',
              fontSize: '1rem',
              fontWeight: 'bold',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              letterSpacing: '0.5px',
              marginTop: '0.25rem',
            }}
          >
            {loading ? '⏳ Please wait...' : mode === 'login' ? 'Login' : 'Create Account'}
          </motion.button>
        </form>

        {/* Hint */}
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-color)', opacity: 0.5 }}>
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '0.85rem' }}
          >
            {mode === 'login' ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

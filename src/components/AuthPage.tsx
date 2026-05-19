import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, LogIn, UserPlus, Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import { signIn, signUp, requestPasswordReset, verifyResetCode, resetPasswordWithCode } from '../hooks/useAuth';
import { useAuthContext } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const { login } = useAuthContext();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot' | 'custom-reset'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [subscribed, setSubscribed] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Custom password reset states
  const [oobCode, setOobCode] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Check URL query parameters for custom reset password links on load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const actionMode = urlParams.get('mode');
    const code = urlParams.get('oobCode');

    if (actionMode === 'resetPassword' && code) {
      setMode('custom-reset');
      setOobCode(code);
      setLoading(true);
      setError('');

      verifyResetCode(code).then((res) => {
        setLoading(false);
        if (res.success && res.email) {
          setResetEmail(res.email);
        } else {
          setError(res.error || 'Invalid or expired password reset link. Please request a new one.');
        }
      });
    }
  }, []);

  const switchMode = (m: 'login' | 'signup' | 'forgot' | 'custom-reset') => {
    setMode(m);
    setError('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setResetSent(false);
    setResetSuccess(false);
    setResetEmail('');
    setOobCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address.');
        return;
      }
    }

    if (mode === 'custom-reset') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const res = await signIn(username.trim(), password);
        if (res.success && res.user) {
          login(res.user);
        } else {
          setError(res.error || 'Login failed.');
        }
      } else if (mode === 'signup') {
        const res = await signUp(username.trim(), email.trim(), password, subscribed);
        if (res.success && res.user) {
          login(res.user);
        } else {
          setError(res.error || 'Sign up failed.');
        }
      } else if (mode === 'forgot') {
        const res = await requestPasswordReset(username.trim());
        if (res.success) {
          setResetSent(true);
        } else {
          setError(res.error || 'Failed to send password reset email.');
        }
      } else if (mode === 'custom-reset') {
        const res = await resetPasswordWithCode(oobCode, password);
        if (res.success) {
          setResetSuccess(true);
          // Purge action params from browser URL bar for security
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setError(res.error || 'Failed to update password.');
        }
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
        {resetSuccess ? (
          /* Custom Password Reset Success Card */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}
          >
            <CheckCircle2 size={56} style={{ color: '#10b981' }} />
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Password Updated!</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.5 }}>
                Your password has been changed successfully. You can now use your new password to log in.
              </p>
            </div>
            <button
              onClick={() => switchMode('login')}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 'var(--radius)',
                background: 'var(--primary-color)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              Proceed to Login
            </button>
          </motion.div>
        ) : resetSent ? (
          /* Password Reset Requested Confirmation Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.25rem' }}
          >
            <CheckCircle2 size={56} style={{ color: '#10b981' }} />
            <div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Reset Link Sent!</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.5 }}>
                We've sent a secure password reset link to your registered email address. 
                Please click the link in your email to choose a new password, then return here to log in.
              </p>
            </div>
            <button
              onClick={() => switchMode('login')}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: 'var(--radius)',
                background: 'var(--primary-color)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                marginTop: '0.5rem'
              }}
            >
              Back to Login
            </button>
          </motion.div>
        ) : (
          /* Normal Authentication & Custom Reset forms */
          <>
            {mode === 'custom-reset' ? (
              /* Custom Reset Header */
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Choose New Password</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.4 }}>
                  {loading ? 'Verifying reset code...' : resetEmail ? `Account Reset: ${resetEmail}` : 'Setting up password credentials...'}
                </p>
              </div>
            ) : mode !== 'forgot' ? (
              /* Normal Tab Toggles */
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
            ) : (
              /* Forgot Password Header */
              <div style={{ marginBottom: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => switchMode('login')} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem', 
                    background: 'none', 
                    border: 'none', 
                    color: 'var(--primary-color)', 
                    cursor: 'pointer', 
                    fontSize: '0.9rem', 
                    fontWeight: 'bold',
                    padding: 0,
                    marginBottom: '0.75rem'
                  }}
                >
                  <ArrowLeft size={16} /> Back to Login
                </button>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem' }}>Forgot Password?</h3>
                <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7, lineHeight: 1.4 }}>
                  Enter your username or email address below, and we will send a secure password reset link to your email.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Form Input Columns depending on view states */}
              {mode === 'custom-reset' ? (
                /* CUSTOM RESET PASSWORD INPUTS */
                !resetEmail && error ? (
                  /* Invalid Token View */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                    <button
                      type="button"
                      onClick={() => switchMode('login')}
                      style={{
                        width: '100%',
                        padding: '0.85rem',
                        borderRadius: 'var(--radius)',
                        background: 'var(--primary-color)',
                        color: '#fff',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Return to Login
                    </button>
                  </div>
                ) : (
                  /* Form fields */
                  <>
                    {/* New Password field */}
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}><Lock size={16} /></span>
                      <input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        autoComplete="new-password"
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

                    {/* Confirm New Password field */}
                    <div style={{ position: 'relative' }}>
                      <span style={iconWrap}><Lock size={16} /></span>
                      <input
                        id="reset-confirm-password"
                        type={showConfirm ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
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
                    </div>
                  </>
                )
              ) : (
                /* REGULAR LOGIN / SIGNUP / FORGOT INPUTS */
                <>
                  {/* Username / Identifier Field */}
                  <div style={{ position: 'relative' }}>
                    <span style={iconWrap}><User size={16} /></span>
                    <input
                      id="auth-username"
                      type="text"
                      placeholder={mode === 'signup' ? 'Username' : 'Username or Email'}
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      autoComplete="username"
                      style={inputStyle}
                    />
                  </div>

                  {/* Email Field (Signup only) */}
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ position: 'relative', overflow: 'hidden' }}
                      >
                        <span style={iconWrap}><Mail size={16} /></span>
                        <input
                          id="auth-email"
                          type="email"
                          placeholder="Email Address"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          required={mode === 'signup'}
                          autoComplete="email"
                          style={inputStyle}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Password Field (Login / Signup) */}
                  {mode !== 'forgot' && (
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
                  )}

                  {/* Confirm Password Field (Signup only) */}
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

                  {/* Newsletter Opt-in (Signup only) */}
                  {mode === 'signup' && (
                    <div 
                      onClick={() => setSubscribed(prev => !prev)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.65rem', 
                        padding: '0.25rem 0.5rem', 
                        background: 'var(--cell-bg)', 
                        borderRadius: 'var(--radius)',
                        border: '1px solid var(--board-border)',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={subscribed}
                        onChange={() => {}} // managed by parent div onClick
                        style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color)', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-color)', opacity: 0.9 }}>
                        Subscribe to game updates & newsletters
                      </span>
                    </div>
                  )}

                  {/* Forgot Password Link (Login only) */}
                  {mode === 'login' && (
                    <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
                      <button
                        type="button"
                        onClick={() => switchMode('forgot')}
                        style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', padding: 0 }}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Error Alert */}
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

              {/* Submit Button */}
              {!(mode === 'custom-reset' && error && !resetEmail) && (
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
                  {loading ? '⏳ Please wait...' : mode === 'login' ? 'Login' : mode === 'signup' ? 'Create Account' : mode === 'custom-reset' ? 'Update Password' : 'Send Reset Link'}
                </motion.button>
              )}
            </form>

            {/* Bottom Switch Mode Text */}
            {mode !== 'forgot' && mode !== 'custom-reset' && (
              <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-color)', opacity: 0.5 }}>
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                  style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 'bold', padding: 0, fontSize: '0.85rem' }}
                >
                  {mode === 'login' ? 'Sign Up' : 'Login'}
                </button>
              </p>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

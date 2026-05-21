import { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/cn';
import type { AuthResult } from '../hooks/useAuth';

interface Props {
  onSignIn: (email: string, password: string) => Promise<AuthResult>;
  onSignUp: (email: string, password: string) => Promise<AuthResult>;
}

type Mode = 'signin' | 'signup';

const SignIn = ({ onSignIn, onSignUp }: Props) => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [signedUp, setSignedUp] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (mode === 'signup' && password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    const { error } =
      mode === 'signin' ? await onSignIn(email, password) : await onSignUp(email, password);
    setSubmitting(false);
    if (error) {
      setErrorMsg(error);
      return;
    }
    if (mode === 'signup') {
      // If email confirmations are disabled in Supabase, the user is signed in immediately
      // (and this component will unmount). If confirmations are on, show a confirmation hint.
      setSignedUp(true);
    }
  };

  const toggleMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
    setErrorMsg(null);
    setSignedUp(false);
  };

  if (signedUp) {
    return (
      <div className="w-full max-w-md mx-auto rounded-2xl bg-white border border-zinc-200 p-8 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white mb-5 shadow-sm shadow-brand-900/20">
          <CheckCircle2 size={20} />
        </div>
        <h2 className="font-display text-3xl tracking-wide text-brand-900">Account created</h2>
        <p className="text-zinc-600 text-sm mt-3">
          If email confirmation is on for this project, check{' '}
          <span className="font-medium text-zinc-900">{email}</span> and click the link to verify.
          Otherwise you should already be signed in.
        </p>
        <button
          type="button"
          onClick={() => {
            setSignedUp(false);
            setMode('signin');
          }}
          className="mt-5 text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-white border border-zinc-200 p-8 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white mb-5 shadow-sm shadow-brand-900/20">
        {mode === 'signin' ? <Lock size={20} /> : <Mail size={20} />}
      </div>
      <h2 className="font-display text-3xl tracking-wide text-brand-900">
        {mode === 'signin' ? 'Welcome back' : 'Create an account'}
      </h2>
      <p className="text-zinc-500 text-sm mt-1.5 mb-6 leading-relaxed">
        {mode === 'signin'
          ? 'Sign in with your email and password to manage your bookings.'
          : 'Make an account to start booking. You can come back any time.'}
      </p>

      <form onSubmit={submit} className="space-y-3">
        <label className="block">
          <span className="text-zinc-700 text-xs font-medium uppercase tracking-wider block mb-1.5">
            Email
          </span>
          <input
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            disabled={submitting}
          />
        </label>

        <label className="block">
          <span className="text-zinc-700 text-xs font-medium uppercase tracking-wider block mb-1.5">
            Password
          </span>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              className={cn(inputClass, 'pr-10')}
              disabled={submitting}
              minLength={mode === 'signup' ? 6 : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-zinc-700 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </label>

        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting || !email.trim() || !password}
          className={cn(
            'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-brand-900/20',
            submitting || !email.trim() || !password
              ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
              : 'bg-gradient-to-br from-brand-600 to-brand-900 text-white hover:from-brand-500 hover:to-brand-800',
          )}
        >
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Please wait…
            </>
          ) : mode === 'signin' ? (
            'Sign in'
          ) : (
            'Create account'
          )}
        </button>
      </form>

      <p className="text-zinc-500 text-sm text-center mt-6">
        {mode === 'signin' ? "Don't have an account?" : 'Already have one?'}{' '}
        <button
          type="button"
          onClick={toggleMode}
          className="text-brand-700 font-medium hover:text-brand-900"
        >
          {mode === 'signin' ? 'Create one' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};

const inputClass =
  'w-full rounded-lg bg-white border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-700 outline-none transition-colors disabled:bg-zinc-50';

export default SignIn;

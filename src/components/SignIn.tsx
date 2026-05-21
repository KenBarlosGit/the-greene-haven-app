import { useState } from 'react';
import { Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/cn';

interface Props {
  onSignIn: (email: string) => Promise<{ error: string | null }>;
}

const SignIn = ({ onSignIn }: Props) => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus('sending');
    setErrorMsg(null);
    const { error } = await onSignIn(email);
    if (error) {
      setStatus('error');
      setErrorMsg(error);
    } else {
      setStatus('sent');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-2xl bg-white border border-zinc-200 p-8 shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white mb-5 shadow-sm shadow-brand-900/20">
        <Mail size={20} />
      </div>
      <h2 className="font-display text-3xl tracking-wide text-brand-900">Sign in to book</h2>
      <p className="text-zinc-500 text-sm mt-1.5 mb-6 leading-relaxed">
        Enter your email and we’ll send you a magic link. No password needed.
      </p>

      {status === 'sent' ? (
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <CheckCircle2 className="text-brand-700 mt-0.5 shrink-0" size={18} />
          <div>
            <p className="text-sm font-medium text-brand-900">Check your inbox</p>
            <p className="text-sm text-zinc-600 mt-0.5">
              We sent a sign-in link to <span className="font-medium text-zinc-900">{email}</span>.
              Click the link to come back here signed in.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-zinc-700 text-xs font-medium uppercase tracking-wider block mb-1.5">
              Email
            </span>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg bg-white border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-700 outline-none transition-colors"
              disabled={status === 'sending'}
            />
          </label>
          {errorMsg && (
            <p className="text-sm text-red-600">{errorMsg}</p>
          )}
          <button
            type="submit"
            disabled={status === 'sending' || !email.trim()}
            className={cn(
              'w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm shadow-brand-900/20',
              status === 'sending' || !email.trim()
                ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-br from-brand-600 to-brand-900 text-white hover:from-brand-500 hover:to-brand-800',
            )}
          >
            {status === 'sending' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Sending…
              </>
            ) : (
              'Send magic link'
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default SignIn;

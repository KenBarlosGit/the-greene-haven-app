import { useState } from 'react';
import { LogOut, Loader2, ShieldCheck, X } from 'lucide-react';
import BookingApp from './components/BookingApp';
import AdminPanel from './components/AdminPanel';
import SignIn from './components/SignIn';
import { useAuth } from './hooks/useAuth';
import { isSupabaseEnabled } from './lib/supabase';

const logoUrl = `${import.meta.env.BASE_URL}logo.png`;

const ADMIN_EMAILS = ['kmcjkbarlos@gmail.com', 'gmfernandez11@gmail.com', 'thegreenehaven@gmail.com'];

const App = () => {
  const { user, loading, signInWithPassword, signUp, signOut } = useAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);

  const isAdmin = user !== null && ADMIN_EMAILS.includes(user.email?.toLowerCase() ?? '');

  return (
    <div className="min-h-screen flex text-zinc-900">
      {/* ── Left branding panel ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[400px] xl:w-[460px] flex-shrink-0 flex-col items-center justify-center bg-brand-900 relative overflow-hidden p-10 xl:p-14">
        {/* Decorative circles */}
        <div className="absolute -bottom-40 -left-40 w-[420px] h-[420px] rounded-full bg-brand-800/50 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-800/30 pointer-events-none" />

        {/* Logo + tagline */}
        <div className="relative z-10 flex flex-col items-center gap-8">
          <img
            src={logoUrl}
            alt="The Greene Haven"
            className="w-64 xl:w-72 rounded-full shadow-2xl shadow-black/40"
          />
          <div className="text-center space-y-2">
            <p className="text-brand-200/70 text-xs font-medium tracking-[0.25em] uppercase">
              A Place to Gather, Unwind &amp; Stay
            </p>
            <p className="text-brand-300/50 text-sm leading-relaxed max-w-xs">
              Reserve your private retreat — check availability and book your dates below.
            </p>
          </div>
        </div>
      </aside>

      {/* ── Right content panel ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex-shrink-0 flex items-center justify-between gap-4 px-5 sm:px-8 py-4 border-b border-zinc-100 bg-white">
          {/* Mobile brand mark (hidden on desktop where left panel shows) */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-brand-600 to-brand-900 flex items-center justify-center text-white font-semibold text-sm shadow-sm shadow-brand-900/20">
              G
            </div>
            <span className="font-display text-xl tracking-wide text-brand-900">
              The Greene Haven
            </span>
          </div>

          {/* Desktop: page title */}
          <div className="hidden lg:block">
            <h1 className="font-display text-2xl tracking-wide text-brand-900">
              {isAdmin ? 'Admin' : 'Booking'}
            </h1>
            <p className="text-zinc-400 text-xs mt-0.5">
              {isAdmin ? 'Manage all bookings for The Greene Haven' : 'Reserve your stay at The Greene Haven'}
            </p>
          </div>

          {/* Admin controls */}
          <div className="flex items-center gap-2">
            {isSupabaseEnabled && (
              isAdmin ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 text-brand-800 text-xs font-medium">
                    <ShieldCheck size={13} /> Admin
                  </span>
                  <span className="hidden md:inline text-sm text-zinc-500 truncate max-w-[160px]">
                    {user!.email}
                  </span>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-zinc-500 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                    aria-label="Sign out"
                  >
                    <LogOut size={15} />
                    <span className="hidden sm:inline">Sign out</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowAdminModal(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm text-zinc-400 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                >
                  <ShieldCheck size={15} />
                  <span className="hidden sm:inline text-xs">Admin</span>
                </button>
              )
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 xl:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-zinc-400">
              <Loader2 className="animate-spin" size={18} /> Loading…
            </div>
          ) : isAdmin ? (
            <AdminPanel />
          ) : (
            <BookingApp isAdmin={isAdmin} />
          )}
        </main>
      </div>

      {/* ── Admin sign-in modal ──────────────────────────────────────────── */}
      {showAdminModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAdminModal(false); }}
        >
          <div className="relative w-full max-w-md">
            <button
              type="button"
              onClick={() => setShowAdminModal(false)}
              className="absolute -top-3 -right-3 z-10 w-7 h-7 rounded-full bg-white border border-zinc-200 shadow flex items-center justify-center text-zinc-500 hover:text-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X size={14} />
            </button>
            <SignIn
              onSignIn={async (email, password) => {
                if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
                  return { error: 'Access denied. This account is not authorised as admin.' };
                }
                const result = await signInWithPassword(email, password);
                if (!result.error) setShowAdminModal(false);
                return result;
              }}
              onSignUp={async (email, password) => {
                if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
                  return { error: 'Access denied. This account is not authorised as admin.' };
                }
                return signUp(email, password);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

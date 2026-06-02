import { useMemo, useState } from 'react';
import { Download, Plus, Pencil, Trash2, Loader2, Search, X } from 'lucide-react';
import BookingFormModal from './BookingFormModal';
import Toast from './Toast';
import { useBookings } from '../hooks/useBookings';
import { useToast } from '../hooks/useToast';
import type { Booking, BookingDraft, DateRange, FormStep } from '../types/booking';
import { fromISODateOnly, nightsBetween, formatRange, toISODateOnly } from '../lib/date';
import { calculateTotal, formatCurrency } from '../lib/pricing';

type Status = 'upcoming' | 'today' | 'past';

function getStatus(b: Booking, todayISO: string): Status {
  if (b.endDateISO < todayISO) return 'past';
  if (b.startDateISO <= todayISO) return 'today';
  return 'upcoming';
}

const STATUS: Record<Status, { label: string; cls: string }> = {
  upcoming: { label: 'Upcoming', cls: 'bg-brand-50 text-brand-700 ring-1 ring-brand-200' },
  today:    { label: 'Today',    cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200' },
  past:     { label: 'Past',     cls: 'bg-zinc-100 text-zinc-500' },
};

const AdminPanel = () => {
  const today = useMemo(() => new Date(), []);
  const todayISO = useMemo(() => toISODateOnly(today), [today]);

  const { bookings, loading, error, addBooking, updateBooking, deleteBooking, checkConflict } =
    useBookings();
  const { toast, showToast, dismiss } = useToast();

  const [search, setSearch]       = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo]   = useState('');

  const [editing, setEditing]     = useState<Booking | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [, setModalStep]          = useState<FormStep>(1);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const upcoming = bookings.filter((b) => b.endDateISO >= todayISO).length;
    const monthPrefix = todayISO.slice(0, 7);
    let monthRevenue = 0;
    let totalRevenue = 0;
    for (const b of bookings) {
      const n = nightsBetween(fromISODateOnly(b.startDateISO), fromISODateOnly(b.endDateISO));
      const t = calculateTotal(n);
      totalRevenue += t;
      if (b.startDateISO.startsWith(monthPrefix)) monthRevenue += t;
    }
    return { upcoming, monthRevenue, totalRevenue };
  }, [bookings, todayISO]);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (q && !b.guestName.toLowerCase().includes(q) && !b.guestEmail.toLowerCase().includes(q))
        return false;
      if (filterFrom && b.endDateISO < filterFrom) return false;
      if (filterTo && b.startDateISO > filterTo) return false;
      return true;
    });
  }, [bookings, search, filterFrom, filterTo]);

  const hasFilters = !!(search || filterFrom || filterTo);

  // ── CSV export ───────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = [
      'Guest Name', 'Email', 'Check-in', 'Check-out', 'Time',
      'Nights', 'Party Size', 'Notes', 'Total (PHP)', 'Status',
    ];
    const rows = bookings.map((b) => {
      const n = nightsBetween(fromISODateOnly(b.startDateISO), fromISODateOnly(b.endDateISO));
      return [
        b.guestName, b.guestEmail, b.startDateISO, b.endDateISO, b.time,
        n, b.partySize, b.notes ?? '', calculateTotal(n), getStatus(b, todayISO),
      ];
    });
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' })),
      download: `tgh-bookings-${todayISO}.csv`,
    });
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const openEdit = (b: Booking) => { setEditing(b); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleDelete = async (b: Booking) => {
    if (!window.confirm(`Delete booking for ${b.guestName}? This cannot be undone.`)) return;
    try {
      await deleteBooking(b.id);
      showToast('Booking deleted.', 'success');
    } catch (err) {
      showToast(`Could not delete: ${(err as Error).message}`, 'warning');
    }
  };

  const handleSubmit = async (draft: BookingDraft, editingId?: string) => {
    try {
      if (editingId) await updateBooking(editingId, draft);
      else await addBooking(draft);
      closeModal();
      showToast(editingId ? 'Booking updated.' : 'Booking added.', 'success');
    } catch (err) {
      showToast(`Could not save: ${(err as Error).message}`, 'warning');
      throw err;
    }
  };

  const initialRange = useMemo<DateRange | null>(
    () =>
      editing
        ? { start: fromISODateOnly(editing.startDateISO), end: fromISODateOnly(editing.endDateISO) }
        : null,
    [editing],
  );

  return (
    <div className="w-full space-y-5">
      <Toast toast={toast} onDismiss={dismiss} />

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Total bookings"      value={String(bookings.length)} />
        <StatCard label="Upcoming"            value={String(stats.upcoming)} accent />
        <StatCard label="Revenue this month"  value={formatCurrency(stats.monthRevenue)} />
        <StatCard label="All-time revenue"    value={formatCurrency(stats.totalRevenue)} />
      </div>

      {/* ── Toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by guest name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white focus:ring-2 focus:ring-brand-600/20 focus:border-brand-700 outline-none"
          />
        </div>

        <div className="flex gap-2">
          <input
            type="date"
            value={filterFrom}
            onChange={(e) => setFilterFrom(e.target.value)}
            title="From date"
            className="px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white text-zinc-600 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-700 outline-none"
          />
          <input
            type="date"
            value={filterTo}
            onChange={(e) => setFilterTo(e.target.value)}
            title="To date"
            className="px-3 py-2 text-sm rounded-lg border border-zinc-200 bg-white text-zinc-600 focus:ring-2 focus:ring-brand-600/20 focus:border-brand-700 outline-none"
          />
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); setFilterFrom(''); setFilterTo(''); }}
              title="Clear filters"
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportCSV}
            disabled={bookings.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={14} /> Export CSV
          </button>
          <button
            type="button"
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 text-white text-sm font-semibold hover:from-brand-500 hover:to-brand-800 transition-colors shadow-sm shadow-brand-900/20"
          >
            <Plus size={14} /> New booking
          </button>
        </div>
      </div>

      {hasFilters && !loading && (
        <p className="text-xs text-zinc-400">
          Showing {filtered.length} of {bookings.length} bookings
        </p>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
          Couldn't load bookings: {error}
        </div>
      )}

      {/* ── Bookings table ────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-zinc-400 text-sm">
          <Loader2 size={16} className="animate-spin" /> Loading bookings…
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-zinc-200 text-center">
          <p className="text-zinc-500 text-sm font-medium">
            {hasFilters ? 'No bookings match your filters.' : 'No bookings yet.'}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => { setSearch(''); setFilterFrom(''); setFilterTo(''); }}
              className="mt-2 text-xs text-brand-700 hover:text-brand-900"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-200 overflow-hidden">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[110px_1fr_1fr_70px_64px_90px_64px] gap-3 px-4 py-2.5 bg-zinc-50 border-b border-zinc-200 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Status</span>
            <span>Dates</span>
            <span>Guest</span>
            <span>Party</span>
            <span>Nights</span>
            <span>Total</span>
            <span />
          </div>

          <ul className="divide-y divide-zinc-100">
            {filtered.map((b) => {
              const start  = fromISODateOnly(b.startDateISO);
              const end    = fromISODateOnly(b.endDateISO);
              const nights = nightsBetween(start, end);
              const status = getStatus(b, todayISO);
              const sc     = STATUS[status];

              return (
                <li
                  key={b.id}
                  className="grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr_70px_64px_90px_64px] gap-3 px-4 py-3.5 items-center hover:bg-zinc-50/70 transition-colors"
                >
                  <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${sc.cls}`}>
                    {sc.label}
                  </span>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-zinc-900 truncate">{formatRange(start, end)}</p>
                    <p className="text-xs text-zinc-400 mt-0.5">{b.time}</p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-900 truncate">{b.guestName}</p>
                    <p className="text-xs text-zinc-400 truncate">{b.guestEmail}</p>
                    {b.notes && (
                      <p className="text-xs text-zinc-400 italic truncate mt-0.5">{b.notes}</p>
                    )}
                  </div>

                  <span className="text-sm text-zinc-600 tabular-nums">
                    {b.partySize} {b.partySize === 1 ? 'guest' : 'guests'}
                  </span>

                  <span className="text-sm text-zinc-600 tabular-nums">
                    {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>

                  <span className="text-sm font-bold text-brand-800 tabular-nums">
                    {formatCurrency(calculateTotal(nights))}
                  </span>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-brand-700 hover:bg-brand-50 transition-colors"
                      aria-label={`Edit booking for ${b.guestName}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      className="p-1.5 rounded-md text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label={`Delete booking for ${b.guestName}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <BookingFormModal
        open={modalOpen}
        today={today}
        initialRange={initialRange}
        editing={editing}
        onClose={closeModal}
        onSubmit={handleSubmit}
        onStepChange={setModalStep}
        checkConflict={checkConflict}
        bookings={bookings}
        showToast={showToast}
      />
    </div>
  );
};

const StatCard = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) => (
  <div
    className={`rounded-xl border p-4 ${
      accent ? 'border-brand-200 bg-brand-50' : 'border-zinc-200 bg-white'
    }`}
  >
    <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
    <p
      className={`text-2xl font-bold mt-1.5 tabular-nums ${
        accent ? 'text-brand-800' : 'text-zinc-900'
      }`}
    >
      {value}
    </p>
  </div>
);

export default AdminPanel;

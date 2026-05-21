import { useMemo, useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import StepIndicator from './StepIndicator';
import CalendarView from './CalendarView';
import BookingsList from './BookingsList';
import BookingFormModal from './BookingFormModal';
import Toast from './Toast';
import { useBookings } from '../hooks/useBookings';
import { useCalendar } from '../hooks/useCalendar';
import { useToast } from '../hooks/useToast';
import type { Booking, BookingDraft, DateRange, FormStep } from '../types/booking';
import { expandRangeISO, isPastDay } from '../lib/date';

interface Props {
  currentUserId: string | null;
}

const BookingApp = ({ currentUserId }: Props) => {
  const today = useMemo(() => new Date(), []);
  const calendar = useCalendar(today);
  const {
    bookings,
    loading,
    error,
    addBooking,
    updateBooking,
    deleteBooking,
    checkConflict,
  } = useBookings(currentUserId);
  const { toast, showToast, dismiss } = useToast();

  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [modalStep, setModalStep] = useState<FormStep>(1);

  const selectedRange: DateRange | null =
    rangeStart && rangeEnd ? { start: rangeStart, end: rangeEnd } : null;

  const indicatorStep: FormStep = modalOpen
    ? modalStep
    : rangeStart && rangeEnd
      ? 2
      : 1;

  const inlineBookedDates = useMemo(() => {
    const s = new Set<string>();
    for (const b of bookings) {
      for (const iso of expandRangeISO(b.startDateISO, b.endDateISO)) s.add(iso);
    }
    return s;
  }, [bookings]);

  const canEdit = (b: Booking): boolean =>
    currentUserId === null || b.userId === null || b.userId === currentUserId;

  const openForNewBooking = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openForEdit = (booking: Booking) => {
    if (!canEdit(booking)) {
      showToast('You can only edit bookings you created.', 'warning');
      return;
    }
    setEditing(booking);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
  };

  const handlePickDateInline = (date: Date) => {
    if (isPastDay(date, today)) return;
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(date);
      setRangeEnd(null);
      return;
    }
    if (date < rangeStart) {
      setRangeEnd(rangeStart);
      setRangeStart(date);
      return;
    }
    setRangeEnd(date);
  };

  const handleBookedAttemptInline = () => {
    showToast(
      'That date is already booked. Use the Edit button on your own booking to change it.',
      'warning',
    );
  };

  const handleDelete = async (b: Booking) => {
    if (!canEdit(b)) {
      showToast('You can only delete bookings you created.', 'warning');
      return;
    }
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
      setRangeStart(null);
      setRangeEnd(null);
      showToast(editingId ? 'Booking updated.' : 'Booking confirmed.', 'success');
    } catch (err) {
      showToast(`Could not save: ${(err as Error).message}`, 'warning');
      throw err;
    }
  };

  const initialRange = useMemo<DateRange | null>(
    () => (rangeStart ? { start: rangeStart, end: rangeEnd ?? rangeStart } : null),
    [rangeStart, rangeEnd],
  );

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-5">
      <Toast toast={toast} onDismiss={dismiss} />

      <StepIndicator currentStep={indicatorStep} selectedRange={selectedRange} />

      <section className="flex-1 min-w-0 rounded-2xl bg-white border border-zinc-200 p-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h3 className="text-brand-900 font-semibold text-lg">Select your dates</h3>
            <p className="text-zinc-500 text-sm mt-0.5">
              Click a check-in day, then a check-out day. Booked dates show in green.
            </p>
          </div>
          <button
            type="button"
            onClick={openForNewBooking}
            disabled={!rangeStart}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-gradient-to-br from-brand-600 to-brand-900 text-white text-sm font-semibold hover:from-brand-500 hover:to-brand-800 transition-colors shadow-sm shadow-brand-900/20 disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <Plus size={16} /> Add booking
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
            Couldn’t load bookings: {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6">
          <CalendarView
            calendar={calendar}
            today={today}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            hoveredDate={hoveredDate}
            bookedDates={inlineBookedDates}
            onSelectDate={handlePickDateInline}
            onHoverDate={setHoveredDate}
            onBookedAttempt={handleBookedAttemptInline}
          />

          <div className="flex-1 min-w-0 border-t sm:border-t-0 sm:border-l border-zinc-200 pt-5 sm:pt-0 sm:pl-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-brand-900 font-semibold text-sm">Upcoming bookings</h4>
              <span className="text-zinc-500 text-xs tabular-nums">
                {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
              </span>
            </div>
            {loading ? (
              <div className="flex items-center gap-2 py-10 justify-center text-zinc-500 text-sm">
                <Loader2 size={16} className="animate-spin" /> Loading bookings…
              </div>
            ) : (
              <BookingsList
                bookings={bookings}
                canEdit={canEdit}
                onEdit={openForEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </section>

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

export default BookingApp;

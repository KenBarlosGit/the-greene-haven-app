import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, MapPin, Images, X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
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

const BASE = import.meta.env.BASE_URL;
const PHOTOS = [
  '58b5b858-e9f3-46a0-9e9b-7f922c7d0b88', // cover
  '1cbf8942-4475-4549-b66f-46aa0138bbfe',
  '6c20fc8d-5b0a-4d8f-bb28-9e3b109338fb',
  '8ac72938-830d-4d75-9fd7-35609dd94be5',
  '76ffd43e-61a7-4dc5-a384-10a744669f61',
  '81e64152-d2e5-4616-ad0a-4d7fe1805406',
  '872c6380-dc1b-4f9d-82ad-e0a7da06e03d',
  'b80aae8a-7a5a-4b00-93ac-d89a85da8251',
  'c629a8c1-61b3-48ac-9701-6b1eee1eb7c2',
].map((id) => `${BASE}tgh-images/${id}.jpeg`);

interface Props {
  isAdmin: boolean;
}

const BookingApp = ({ isAdmin }: Props) => {
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
  } = useBookings();
  const { toast, showToast, dismiss } = useToast();

  const [rangeStart, setRangeStart] = useState<Date | null>(null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Booking | null>(null);
  const [modalStep, setModalStep] = useState<FormStep>(1);

  const [showMapModal, setShowMapModal] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Keyboard nav for lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i === null ? 0 : (i + 1) % PHOTOS.length));
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i === null ? 0 : (i - 1 + PHOTOS.length) % PHOTOS.length));
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [lightboxIdx]);

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

  const canEdit = (_b: Booking): boolean => isAdmin;

  const openForNewBooking = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openForEdit = (booking: Booking) => {
    if (!canEdit(booking)) {
      showToast('Sign in as admin to edit bookings.', 'warning');
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
      showToast('Sign in as admin to delete bookings.', 'warning');
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
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5">
      <Toast toast={toast} onDismiss={dismiss} />

      {/* ── Booking row ─────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-5">
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
              Couldn't load bookings: {error}
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
                  <Loader2 size={16} className="animate-spin" /> Loading bookings...
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
      </div>

      {/* ── Info cards row ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Map card */}
        <button
          type="button"
          onClick={() => setShowMapModal(true)}
          className="group relative rounded-2xl overflow-hidden border border-zinc-200 bg-white hover:border-brand-300 hover:shadow-md transition-all text-left"
          style={{ height: '360px' }}
        >
          <iframe
            title="Location preview"
            src="https://maps.google.com/maps?q=14.5895981,121.1006403&z=17&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block', pointerEvents: 'none' }}
            tabIndex={-1}
          />
          <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/10 transition-colors" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-brand-900/80 to-transparent px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <MapPin size={15} />
              <span className="text-sm font-semibold">Location</span>
              <span className="text-xs text-white/70">Urban Deca Homes Ortigas</span>
            </div>
            <ExternalLink size={13} className="text-white/60" />
          </div>
        </button>

        {/* Photos card */}
        <button
          type="button"
          onClick={() => setShowPhotosModal(true)}
          className="group relative rounded-2xl overflow-hidden border border-zinc-200 hover:border-brand-300 hover:shadow-md transition-all"
          style={{ height: '360px' }}
        >
          {/* Cover photo full-bleed */}
          <img
            src={PHOTOS[0]}
            alt="Venue cover"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-brand-900/10 group-hover:bg-brand-900/20 transition-colors" />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-brand-900/80 to-transparent px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Images size={15} />
              <span className="text-sm font-semibold">Photos</span>
              <span className="text-xs text-white/70">{PHOTOS.length} photos</span>
            </div>
            <ExternalLink size={13} className="text-white/60" />
          </div>
        </button>
      </div>

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

      {/* ── Map modal ────────────────────────────────────────────────────── */}
      {showMapModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowMapModal(false); }}
        >
          <div className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100">
              <div className="flex items-center gap-2 text-brand-900">
                <MapPin size={16} className="text-brand-600" />
                <span className="font-semibold text-sm">Urban Deca Homes Ortigas</span>
                <span className="text-zinc-400 text-xs">· Pasig City, Metro Manila</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://www.google.com/maps/place/Urban+Deca+Homes+Ortigas+-+Information+Center/@14.5895981,121.0980654,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  <ExternalLink size={13} /> Open in Maps
                </a>
                <button
                  type="button"
                  onClick={() => setShowMapModal(false)}
                  className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ height: '480px' }}>
              <iframe
                title="The Greene Haven location"
                src="https://maps.google.com/maps?q=14.5895981,121.1006403&z=17&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Photos modal ─────────────────────────────────────────────────── */}
      {showPhotosModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPhotosModal(false); }}
        >
          <div className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-100 flex-shrink-0">
              <div className="flex items-center gap-2 text-brand-900">
                <Images size={16} className="text-brand-600" />
                <span className="font-semibold text-sm">The Greene Haven</span>
                <span className="text-zinc-400 text-xs">· {PHOTOS.length} photos</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhotosModal(false)}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {/* Grid */}
            <div className="overflow-y-auto p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {PHOTOS.map((src, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightboxIdx(i)}
                    className="group relative rounded-xl overflow-hidden bg-zinc-100 hover:ring-2 hover:ring-brand-600 hover:ring-offset-1 transition-all"
                    style={{ aspectRatio: '4/3' }}
                  >
                    <img
                      src={src}
                      alt={`Venue photo ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 bg-brand-900/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                        Cover
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Lightbox ─────────────────────────────────────────────────────── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close */}
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X size={18} />
          </button>

          {/* Counter */}
          <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/60 text-sm tabular-nums">
            {lightboxIdx + 1} / {PHOTOS.length}
          </span>

          {/* Prev */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => ((i ?? 0) - 1 + PHOTOS.length) % PHOTOS.length); }}
            className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronLeft size={22} />
          </button>

          {/* Image */}
          <img
            src={PHOTOS[lightboxIdx]}
            alt={`Venue photo ${lightboxIdx + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-xl shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => ((i ?? 0) + 1) % PHOTOS.length); }}
            className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingApp;

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, MapPin, Images, X, ExternalLink, ChevronLeft, ChevronRight, CalendarDays, Users } from 'lucide-react';
import StepIndicator from './StepIndicator';
import CalendarView from './CalendarView';
import BookingsList from './BookingsList';
import BookingFormModal from './BookingFormModal';
import Toast from './Toast';
import { useBookings } from '../hooks/useBookings';
import { useCalendar } from '../hooks/useCalendar';
import { useToast } from '../hooks/useToast';
import type { Booking, BookingDraft, DateRange, FormStep } from '../types/booking';
import { expandRangeISO, isPastDay, nightsBetween } from '../lib/date';
import { formatRate, formatCurrency, calculateTotal, RATE_PER_NIGHT } from '../lib/pricing';
import { cn } from '../lib/cn';

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
  const [heroPhotoIdx, setHeroPhotoIdx] = useState(0);
  const heroPrev = () => setHeroPhotoIdx((i) => (i - 1 + PHOTOS.length) % PHOTOS.length);
  const heroNext = () => setHeroPhotoIdx((i) => (i + 1) % PHOTOS.length);

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

  const mobileNights = rangeStart && rangeEnd ? nightsBetween(rangeStart, rangeEnd) : 0;

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5">
      <Toast toast={toast} onDismiss={dismiss} />

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE LAYOUT  (hidden on sm+)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="sm:hidden -mx-4 -mt-4">

        {/* Hero photo carousel */}
        <div className="relative h-72 bg-zinc-900 overflow-hidden">
          {PHOTOS.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={`Venue photo ${i + 1}`}
              className={cn(
                'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
                i === heroPhotoIdx ? 'opacity-100' : 'opacity-0 pointer-events-none',
              )}
            />
          ))}
          <button
            type="button"
            onClick={heroPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
            aria-label="Previous photo"
          >
            <ChevronLeft size={16} className="text-zinc-700" />
          </button>
          <button
            type="button"
            onClick={heroNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow"
            aria-label="Next photo"
          >
            <ChevronRight size={16} className="text-zinc-700" />
          </button>
          <button
            type="button"
            onClick={() => setShowPhotosModal(true)}
            className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full tabular-nums backdrop-blur-sm"
          >
            {heroPhotoIdx + 1} / {PHOTOS.length}
          </button>
        </div>

        {/* Content card — slides over the photo */}
        <div className="bg-white rounded-t-3xl -mt-6 relative z-10 pb-32">
          {/* Drag pill */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-zinc-200" />
          </div>

          <div className="px-5 pt-4 space-y-5">

            {/* Venue name & details */}
            <div>
              <h2 className="font-display text-3xl text-brand-900 leading-tight tracking-wide">
                The Greene Haven
              </h2>
              <p className="text-zinc-500 text-sm mt-1">Private retreat · Urban Deca Homes Ortigas, Pasig City</p>
              <div className="flex items-center gap-3 mt-2 text-zinc-600 text-sm">
                <span className="flex items-center gap-1"><Users size={13} /> Up to 6 guests</span>
                <span className="text-zinc-300">·</span>
                <span className="flex items-center gap-1"><CalendarDays size={13} /> 22-hr stay</span>
              </div>
            </div>

            {/* Highlights */}
            <div className="flex items-center gap-0 divide-x divide-zinc-100 rounded-2xl border border-zinc-100 overflow-hidden">
              {[
                { emoji: '🌿', label: 'Peaceful' },
                { emoji: '🏠', label: 'Private' },
                { emoji: '🛁', label: 'En-suite' },
              ].map(({ emoji, label }) => (
                <div key={label} className="flex-1 flex flex-col items-center py-3 gap-1">
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs text-zinc-600 font-medium">{label}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-zinc-100" />

            {/* Calendar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-base text-zinc-900">Select your dates</h3>
                {rangeStart && (
                  <button
                    type="button"
                    onClick={openForNewBooking}
                    className="text-xs font-semibold text-brand-700 hover:text-brand-900 transition-colors"
                  >
                    + Add booking
                  </button>
                )}
              </div>
              <p className="text-zinc-400 text-xs mb-4">
                Tap check-in, then check-out. Booked dates show in green.
              </p>
              {error && (
                <div className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                  Couldn't load bookings: {error}
                </div>
              )}
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
            </div>

            {/* Upcoming bookings */}
            <div className="border-t border-zinc-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-base text-zinc-900">Upcoming bookings</h3>
                <span className="text-xs text-zinc-500 tabular-nums">
                  {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
                </span>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 py-6 justify-center text-zinc-400 text-sm">
                  <Loader2 size={15} className="animate-spin" /> Loading…
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

            {/* Map preview */}
            <div className="border-t border-zinc-100 pt-5">
              <h3 className="font-semibold text-base text-zinc-900 mb-3">Location</h3>
              <button
                type="button"
                onClick={() => setShowMapModal(true)}
                className="w-full rounded-2xl overflow-hidden border border-zinc-200 hover:border-brand-300 transition-colors block"
                style={{ height: '180px' }}
              >
                <iframe
                  title="Location preview (mobile)"
                  src="https://maps.google.com/maps?q=14.5895981,121.1006403(The+Greene+Haven)&z=17&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block', pointerEvents: 'none' }}
                  tabIndex={-1}
                />
              </button>
              <p className="text-xs text-zinc-400 mt-2 text-center">Urban Deca Homes Ortigas · Pasig City</p>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky mobile bottom bar */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-sm border-t border-zinc-100 px-5 py-3 flex items-center justify-between gap-4 shadow-lg">
        <div className="min-w-0">
          {rangeStart && rangeEnd ? (
            <>
              <p className="font-bold text-brand-900 text-base leading-tight">
                {formatCurrency(calculateTotal(mobileNights, 1))}
              </p>
              <p className="text-xs text-zinc-500">{mobileNights} night{mobileNights !== 1 ? 's' : ''}</p>
            </>
          ) : (
            <>
              <p className="font-bold text-brand-900 text-sm leading-tight">₱{RATE_PER_NIGHT.toLocaleString()} / night</p>
              <p className="text-xs text-zinc-400">Select dates to book</p>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={openForNewBooking}
          disabled={!rangeStart}
          className="flex-shrink-0 px-6 py-3 rounded-full bg-gradient-to-br from-brand-600 to-brand-900 text-white text-sm font-semibold shadow-md shadow-brand-900/20 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {rangeStart ? 'Book now' : 'Select dates'}
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          DESKTOP LAYOUT  (hidden on mobile)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="hidden sm:contents">

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
              className="inline-flex items-center justify-center gap-1.5 p-2.5 sm:px-3.5 sm:py-2 rounded-md bg-gradient-to-br from-brand-600 to-brand-900 text-white text-sm font-semibold hover:from-brand-500 hover:to-brand-800 transition-colors shadow-sm shadow-brand-900/20 disabled:bg-none disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Add booking</span>
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
            src="https://maps.google.com/maps?q=14.5895981,121.1006403(The+Greene+Haven)&z=17&output=embed"
            width="100%"
            height="100%"
            style={{ border: 0, display: 'block', pointerEvents: 'none' }}
            tabIndex={-1}
          />
          {/* Pin label overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="-translate-y-10 flex flex-col items-center">
              <div className="bg-white rounded-full shadow-lg px-3 py-1.5 text-xs font-semibold text-brand-900 border border-zinc-100 flex items-center gap-1.5 whitespace-nowrap">
                <div className="w-2 h-2 rounded-full bg-brand-700 flex-shrink-0" />
                The Greene Haven
              </div>
              <div className="w-2.5 h-2.5 bg-white border-b border-r border-zinc-100 rotate-45 -mt-1.5" />
            </div>
          </div>
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
      </div>{/* end hidden sm:contents desktop wrapper */}

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
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 border-b border-zinc-100 gap-3">
              <div className="flex items-center gap-2 text-brand-900 min-w-0">
                <MapPin size={16} className="text-brand-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">The Greene Haven</p>
                  <p className="text-zinc-400 text-xs truncate">Urban Deca Homes Ortigas · Pasig City</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <a
                  href="https://www.google.com/maps/place/Urban+Deca+Homes+Ortigas+-+Information+Center/@14.5895981,121.0980654,17z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-brand-700 hover:bg-brand-50 transition-colors"
                >
                  <ExternalLink size={13} />
                  <span className="hidden sm:inline">Open in Maps</span>
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
            <div className="h-64 sm:h-[480px]">
              <iframe
                title="The Greene Haven location"
                src="https://maps.google.com/maps?q=14.5895981,121.1006403(The+Greene+Haven)&z=17&output=embed"
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

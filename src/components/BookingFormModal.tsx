import { useEffect, useMemo, useState } from 'react';
import { X, ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react';
import type { Booking, BookingDraft, DateRange, FormStep } from '../types/booking';
import { useCalendar } from '../hooks/useCalendar';
import type { ToastVariant } from '../hooks/useToast';
import { expandRangeISO, toISODateOnly, fromISODateOnly, pad2 } from '../lib/date';
import DateStep from './modal/DateStep';
import DetailsStep, { type DetailsErrors, type DetailsForm } from './modal/DetailsStep';
import ConfirmStep from './modal/ConfirmStep';
import { cn } from '../lib/cn';

interface Props {
  open: boolean;
  today: Date;
  initialRange: DateRange | null;
  editing: Booking | null;
  onClose: () => void;
  onSubmit: (draft: BookingDraft, editingId?: string) => Promise<void>;
  onStepChange: (step: FormStep) => void;
  checkConflict: (candidate: {
    startDateISO: string;
    endDateISO: string;
    excludeId?: string;
  }) => Booking | null;
  bookings: Booking[];
  showToast: (message: string, variant?: ToastVariant) => void;
}

const emptyForm: DetailsForm = {
  hours: '15',
  minutes: '00',
  guestName: '',
  guestEmail: '',
  partySize: 2,
  notes: '',
};

function formFromBooking(b: Booking): DetailsForm {
  const [h, m] = b.time.split(':');
  return {
    hours: h ?? '15',
    minutes: m ?? '00',
    guestName: b.guestName,
    guestEmail: b.guestEmail,
    partySize: b.partySize,
    notes: b.notes,
  };
}

const BookingFormModal = ({
  open,
  today,
  initialRange,
  editing,
  onClose,
  onSubmit,
  onStepChange,
  checkConflict,
  bookings,
  showToast,
}: Props) => {
  const [step, setStep] = useState<FormStep>(1);
  const [rangeStart, setRangeStart] = useState<Date | null>(initialRange?.start ?? null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialRange?.end ?? null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [form, setForm] = useState<DetailsForm>(emptyForm);
  const [errors, setErrors] = useState<DetailsErrors>({});
  const [ackConflict, setAckConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const calendar = useCalendar(initialRange?.start ?? today);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      const start = fromISODateOnly(editing.startDateISO);
      const end = fromISODateOnly(editing.endDateISO);
      setRangeStart(start);
      setRangeEnd(end);
      setForm(formFromBooking(editing));
      setStep(2);
      calendar.setView(start);
    } else {
      const start = initialRange?.start ?? null;
      const end = initialRange?.end ?? null;
      setRangeStart(start);
      setRangeEnd(end);
      setForm(emptyForm);
      setStep(start && end ? 2 : 1);
      calendar.setView(start ?? today);
    }
    setHoveredDate(null);
    setErrors({});
    setAckConflict(false);
    setSubmitting(false);
    // calendar.setView is stable (useCallback); intentionally omit other deps so this
    // only runs on transitions of open/editing/initialRange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing, initialRange]);

  useEffect(() => {
    if (open) onStepChange(step);
  }, [step, open, onStepChange]);

  const time = `${pad2(form.hours)}:${pad2(form.minutes)}`;

  const conflict = useMemo(() => {
    if (!rangeStart) return null;
    const end = rangeEnd ?? rangeStart;
    return checkConflict({
      startDateISO: toISODateOnly(rangeStart),
      endDateISO: toISODateOnly(end),
      excludeId: editing?.id,
    });
  }, [rangeStart, rangeEnd, editing, checkConflict]);

  const conflictMessage = conflict
    ? `Heads up — ${conflict.guestName}’s booking (${conflict.startDateISO} to ${conflict.endDateISO}) overlaps these dates.`
    : null;

  const modalBookedDates = useMemo(() => {
    const s = new Set<string>();
    for (const b of bookings) {
      if (editing && b.id === editing.id) continue;
      for (const iso of expandRangeISO(b.startDateISO, b.endDateISO)) s.add(iso);
    }
    return s;
  }, [bookings, editing]);

  const handleBookedAttempt = () => {
    showToast('That date is already booked. Pick different dates.', 'warning');
  };

  if (!open) return null;

  const handlePickDate = (date: Date) => {
    setAckConflict(false);
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

  const handlePatch = (patch: Partial<DetailsForm>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setAckConflict(false);
  };

  const validateDetails = (): boolean => {
    const next: DetailsErrors = {};
    const h = Number(form.hours);
    const m = Number(form.minutes);
    if (Number.isNaN(h) || h < 0 || h > 23 || Number.isNaN(m) || m < 0 || m > 59) {
      next.time = 'Enter a valid 24-hour time';
    }
    if (!form.guestName.trim()) next.guestName = 'Please enter a name';
    if (!/^\S+@\S+\.\S+$/.test(form.guestEmail.trim())) {
      next.guestEmail = 'Please enter a valid email';
    }
    if (!Number.isInteger(form.partySize) || form.partySize < 1 || form.partySize > 12) {
      next.partySize = 'Party size must be between 1 and 12';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 1) {
      if (!rangeStart) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateDetails()) return;
      setStep(3);
    }
  };

  const goBack = () => {
    if (step === 2) setStep(1);
    if (step === 3) setStep(2);
  };

  const submit = async () => {
    if (!rangeStart || submitting) return;
    const effectiveEnd = rangeEnd ?? rangeStart;
    if (conflict && !ackConflict) {
      setAckConflict(true);
      return;
    }
    const draft: BookingDraft = {
      startDateISO: toISODateOnly(rangeStart),
      endDateISO: toISODateOnly(effectiveEnd),
      time: `${pad2(form.hours)}:${pad2(form.minutes)}`,
      guestName: form.guestName.trim(),
      guestEmail: form.guestEmail.trim(),
      partySize: form.partySize,
      notes: form.notes.trim(),
    };
    setSubmitting(true);
    try {
      await onSubmit(draft, editing?.id);
    } catch {
      // parent surfaces the error via toast; leave the modal open
    } finally {
      setSubmitting(false);
    }
  };

  const primaryLabel =
    step === 3
      ? editing
        ? conflict && !ackConflict
          ? 'Confirm anyway'
          : 'Update booking'
        : conflict && !ackConflict
          ? 'Confirm anyway'
          : 'Confirm booking'
      : 'Continue';

  const canGoNext = (step === 1 ? rangeStart !== null : true) && !submitting;

  const confirmStart = rangeStart;
  const confirmEnd = rangeEnd ?? rangeStart;

  return (
    <>
      <div
        className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="fixed inset-4 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full z-50 flex flex-col rounded-2xl bg-white border border-zinc-200 shadow-xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-zinc-500">
              Step {step} of 3
            </p>
            <h3 id="booking-modal-title" className="text-brand-900 font-semibold text-lg">
              {editing ? 'Edit booking' : 'New booking'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          {step === 1 && (
            <DateStep
              calendar={calendar}
              today={today}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              hoveredDate={hoveredDate}
              bookedDates={modalBookedDates}
              onSelectDate={handlePickDate}
              onHoverDate={setHoveredDate}
              onBookedAttempt={handleBookedAttempt}
            />
          )}
          {step === 2 && (
            <DetailsStep
              form={form}
              errors={errors}
              conflictMessage={conflictMessage}
              onChange={handlePatch}
            />
          )}
          {step === 3 && confirmStart && confirmEnd && (
            <ConfirmStep
              start={confirmStart}
              end={confirmEnd}
              time={time}
              guestName={form.guestName}
              guestEmail={form.guestEmail}
              partySize={form.partySize}
              notes={form.notes}
              conflictMessage={conflictMessage}
            />
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-zinc-100 bg-brand-50/40">
          <button
            type="button"
            onClick={step === 1 ? onClose : goBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft size={16} />
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            onClick={step === 3 ? submit : goNext}
            disabled={!canGoNext}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-sm shadow-brand-900/20',
              canGoNext
                ? 'bg-gradient-to-br from-brand-600 to-brand-900 text-white hover:from-brand-500 hover:to-brand-800'
                : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none',
            )}
          >
            {submitting ? 'Saving…' : primaryLabel}
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : step === 3 ? (
              <Check size={16} />
            ) : (
              <ArrowRight size={16} />
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default BookingFormModal;

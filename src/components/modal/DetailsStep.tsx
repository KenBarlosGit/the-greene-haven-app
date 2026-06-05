import { useEffect, useState } from 'react';
import { Minus, Plus, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface DetailsForm {
  hours: string;
  minutes: string;
  guestName: string;
  guestEmail: string;
  partySize: number;
  notes: string;
}

export interface DetailsErrors {
  guestName?: string;
  guestEmail?: string;
  partySize?: string;
  time?: string;
}

interface Props {
  form: DetailsForm;
  errors: DetailsErrors;
  conflictMessage: string | null;
  onChange: (patch: Partial<DetailsForm>) => void;
}

const MAX_PARTY = 6;

const DetailsStep = ({ form, errors, conflictMessage, onChange }: Props) => {
  const timeValue = `${form.hours.padStart(2, '0')}:${form.minutes.padStart(2, '0')}`;

  const [partySizeStr, setPartySizeStr] = useState(String(form.partySize));
  useEffect(() => { setPartySizeStr(String(form.partySize)); }, [form.partySize]);

  const handleTimeChange = (val: string) => {
    const [h = '14', m = '00'] = val.split(':');
    onChange({ hours: h, minutes: m });
  };

  return (
    <div>
      <h4 className="text-brand-900 text-base font-semibold mb-0.5">Your details</h4>
      <p className="text-zinc-500 text-sm mb-4">
        Tell us a little about your booking so we can prepare.
      </p>

      <div className="space-y-3">
        {/* Row 1: name + email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full name" error={errors.guestName}>
            <input
              type="text"
              value={form.guestName}
              onChange={(e) => onChange({ guestName: e.target.value })}
              placeholder="e.g. Maria Santos"
              className={inputClass(!!errors.guestName)}
            />
          </Field>

          <Field label="Email" error={errors.guestEmail}>
            <input
              type="email"
              value={form.guestEmail}
              onChange={(e) => onChange({ guestEmail: e.target.value })}
              placeholder="maria@example.com"
              className={inputClass(!!errors.guestEmail)}
            />
          </Field>
        </div>

        {/* Row 2: check-in time + party size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Check-in time" error={errors.time}>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => handleTimeChange(e.target.value)}
              className={inputClass(!!errors.time)}
            />
          </Field>

          <Field label={`Party size (max ${MAX_PARTY})`} error={errors.partySize}>
            <div className={cn(
              'flex items-stretch rounded-lg border bg-white',
              errors.partySize ? 'border-red-400' : 'border-zinc-200',
            )}>
              <button
                type="button"
                onClick={() => onChange({ partySize: Math.max(1, form.partySize - 1) })}
                disabled={form.partySize <= 1}
                className="px-4 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-l-lg"
                aria-label="Decrease party size"
              >
                <Minus size={14} />
              </button>
              <div className="flex flex-1 items-center justify-center border-x border-zinc-200 py-2.5 gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={MAX_PARTY}
                  value={partySizeStr}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setPartySizeStr(raw);
                    const val = parseInt(raw, 10);
                    if (!isNaN(val) && val >= 1 && val <= MAX_PARTY) {
                      onChange({ partySize: val });
                    }
                  }}
                  onBlur={() => {
                    const val = parseInt(partySizeStr, 10);
                    const clamped = isNaN(val) ? 1 : Math.min(MAX_PARTY, Math.max(1, val));
                    onChange({ partySize: clamped });
                    setPartySizeStr(String(clamped));
                  }}
                  className="w-6 text-center text-sm font-semibold text-zinc-900 bg-transparent border-0 outline-none tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  aria-label="Party size"
                />
                <span className="text-xs text-zinc-400">
                  {form.partySize === 1 ? 'guest' : 'guests'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange({ partySize: Math.min(MAX_PARTY, form.partySize + 1) })}
                disabled={form.partySize >= MAX_PARTY}
                className="px-4 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-r-lg"
                aria-label="Increase party size"
              >
                <Plus size={14} />
              </button>
            </div>
            {form.partySize > 4 && (
              <p className="text-[11px] text-brand-700 mt-1">
                +₱{(form.partySize - 4) * 200} extra ({form.partySize - 4} additional {form.partySize - 4 === 1 ? 'guest' : 'guests'} beyond 4)
              </p>
            )}
          </Field>
        </div>

        {/* Row 3: notes */}
        <Field label="Notes (optional)">
          <textarea
            value={form.notes}
            onChange={(e) => {
              if (e.target.value.length <= 140) onChange({ notes: e.target.value });
            }}
            rows={2}
            placeholder="Any special requests?"
            className={cn(inputClass(false), 'resize-none')}
          />
          <p className="text-[11px] text-zinc-400 mt-1 text-right">{form.notes.length}/140</p>
        </Field>

        {conflictMessage && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p className="text-sm">{conflictMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};

const inputClass = (hasError: boolean) =>
  cn(
    'w-full rounded-lg bg-white border px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400',
    'focus:ring-2 focus:ring-brand-600/20 focus:border-brand-700 outline-none transition-colors',
    hasError ? 'border-red-400' : 'border-zinc-200',
  );

interface FieldProps {
  label: string;
  error?: string;
  children: React.ReactNode;
}

const Field = ({ label, error, children }: FieldProps) => (
  <div>
    <span className="text-zinc-700 text-xs font-medium uppercase tracking-wider block mb-1.5">
      {label}
    </span>
    {children}
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </div>
);

export default DetailsStep;

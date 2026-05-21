import { AlertTriangle } from 'lucide-react';
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

const DetailsStep = ({ form, errors, conflictMessage, onChange }: Props) => {
  return (
    <div>
      <h4 className="text-brand-900 text-base font-semibold mb-1">Your details</h4>
      <p className="text-zinc-500 text-sm mb-5">
        Tell us a little about your booking so we can prepare.
      </p>

      <div className="space-y-4">
        <Field label="Check-in time" error={errors.time}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={23}
              value={form.hours}
              onChange={(e) => onChange({ hours: e.target.value })}
              className={inputClass(!!errors.time)}
              aria-label="Hours"
            />
            <span className="text-zinc-400 font-medium">:</span>
            <input
              type="number"
              min={0}
              max={59}
              value={form.minutes}
              onChange={(e) => onChange({ minutes: e.target.value })}
              className={inputClass(!!errors.time)}
              aria-label="Minutes"
            />
          </div>
        </Field>

        <Field label="Full name" error={errors.guestName}>
          <input
            type="text"
            value={form.guestName}
            onChange={(e) => onChange({ guestName: e.target.value })}
            placeholder="e.g. Avery Chen"
            className={inputClass(!!errors.guestName)}
          />
        </Field>

        <Field label="Email" error={errors.guestEmail}>
          <input
            type="email"
            value={form.guestEmail}
            onChange={(e) => onChange({ guestEmail: e.target.value })}
            placeholder="avery@example.com"
            className={inputClass(!!errors.guestEmail)}
          />
        </Field>

        <Field label="Party size" error={errors.partySize}>
          <input
            type="number"
            min={1}
            max={12}
            value={form.partySize}
            onChange={(e) => onChange({ partySize: Number(e.target.value) || 1 })}
            className={inputClass(!!errors.partySize)}
          />
        </Field>

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
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
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
  <label className="block">
    <span className="text-zinc-700 text-xs font-medium uppercase tracking-wider block mb-1.5">
      {label}
    </span>
    {children}
    {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
  </label>
);

export default DetailsStep;

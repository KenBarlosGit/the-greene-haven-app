import { AlertTriangle, Calendar, Clock, Mail, Users, MessageSquare, Moon } from 'lucide-react';
import { formatRange, nightsBetween } from '../../lib/date';

interface Props {
  start: Date;
  end: Date;
  time: string;
  guestName: string;
  guestEmail: string;
  partySize: number;
  notes: string;
  conflictMessage: string | null;
}

const ConfirmStep = ({
  start,
  end,
  time,
  guestName,
  guestEmail,
  partySize,
  notes,
  conflictMessage,
}: Props) => {
  const nights = nightsBetween(start, end);

  return (
    <div>
      <h4 className="text-brand-900 text-base font-semibold mb-1">Review your booking</h4>
      <p className="text-zinc-500 text-sm mb-5">
        Double-check everything looks right before confirming.
      </p>

      <dl className="rounded-xl border border-brand-100 divide-y divide-brand-100 bg-brand-50/40">
        <Row icon={<Calendar size={14} />} label="Dates" value={formatRange(start, end)} />
        <Row
          icon={<Moon size={14} />}
          label="Length"
          value={nights === 0 ? 'Single day' : `${nights} ${nights === 1 ? 'night' : 'nights'}`}
        />
        <Row icon={<Clock size={14} />} label="Check-in time" value={time} />
        <Row
          icon={<Users size={14} />}
          label="Guest"
          value={`${guestName} · ${partySize} ${partySize === 1 ? 'guest' : 'guests'}`}
        />
        <Row icon={<Mail size={14} />} label="Email" value={guestEmail} />
        {notes && <Row icon={<MessageSquare size={14} />} label="Notes" value={notes} />}
      </dl>

      {conflictMessage && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-900">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <p className="text-sm">{conflictMessage}</p>
        </div>
      )}
    </div>
  );
};

interface RowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

const Row = ({ icon, label, value }: RowProps) => (
  <div className="flex items-start gap-3 px-4 py-3">
    <span className="text-zinc-400 mt-0.5">{icon}</span>
    <div className="flex-1 min-w-0">
      <dt className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{label}</dt>
      <dd className="text-zinc-900 text-sm font-medium break-words">{value}</dd>
    </div>
  </div>
);

export default ConfirmStep;

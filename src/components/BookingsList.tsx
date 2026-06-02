import { CalendarPlus, Pencil, Trash2, Users, Moon } from 'lucide-react';
import type { Booking } from '../types/booking';
import { formatRange, fromISODateOnly, nightsBetween } from '../lib/date';
import { calculateTotal, formatCurrency } from '../lib/pricing';

interface Props {
  bookings: Booking[];
  canEdit: (booking: Booking) => boolean;
  onEdit: (booking: Booking) => void;
  onDelete: (booking: Booking) => void;
}

const BookingsList = ({ bookings, canEdit, onEdit, onDelete }: Props) => {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 px-6 rounded-xl border border-dashed border-brand-200 bg-brand-50/60">
        <CalendarPlus className="text-brand-600 mb-2" size={28} />
        <p className="text-brand-900 text-sm font-medium">No bookings yet</p>
        <p className="text-zinc-500 text-xs mt-1 text-center">
          Select dates on the calendar to add your first booking.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2.5">
      {bookings.map((booking) => {
        const start = fromISODateOnly(booking.startDateISO);
        const end = fromISODateOnly(booking.endDateISO);
        const nights = nightsBetween(start, end);
        const editable = canEdit(booking);
        return (
          <li
            key={booking.id}
            className="rounded-xl bg-white border border-zinc-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-brand-300 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="text-brand-900 text-sm font-semibold">
                {formatRange(start, end)}
              </div>
              <div className="text-zinc-500 text-xs mt-0.5 flex items-center flex-wrap gap-x-2 gap-y-0.5">
                <span className="tabular-nums">{booking.time}</span>
                {nights > 0 && (
                  <span className="inline-flex items-center gap-1 text-brand-700">
                    <Moon size={11} /> {nights} {nights === 1 ? 'night' : 'nights'}
                  </span>
                )}
                <span className="text-brand-800 font-semibold tabular-nums">
                  {formatCurrency(calculateTotal(nights))}
                </span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-900 text-sm font-medium truncate">{booking.guestName}</p>
              <p className="text-zinc-500 text-xs flex items-center gap-1.5 mt-0.5">
                <Users size={12} /> {booking.partySize}{' '}
                {booking.partySize === 1 ? 'guest' : 'guests'}
                {booking.notes && <span className="text-zinc-400">· {booking.notes}</span>}
              </p>
            </div>
            {editable && (
              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => onEdit(booking)}
                  className="p-2 rounded-md text-zinc-500 hover:text-brand-800 hover:bg-brand-50 transition-colors"
                  aria-label={`Edit booking for ${booking.guestName}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(booking)}
                  className="p-2 rounded-md text-zinc-500 hover:text-red-600 hover:bg-zinc-100 transition-colors"
                  aria-label={`Delete booking for ${booking.guestName}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default BookingsList;

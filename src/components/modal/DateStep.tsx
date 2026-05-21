import CalendarView from '../CalendarView';
import type { CalendarState } from '../../hooks/useCalendar';
import { formatLongDate, formatRange, nightsBetween } from '../../lib/date';

interface Props {
  calendar: CalendarState;
  today: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoveredDate: Date | null;
  bookedDates: Set<string>;
  onSelectDate: (date: Date) => void;
  onHoverDate: (date: Date | null) => void;
  onBookedAttempt: (date: Date) => void;
}

const DateStep = ({
  calendar,
  today,
  rangeStart,
  rangeEnd,
  hoveredDate,
  bookedDates,
  onSelectDate,
  onHoverDate,
  onBookedAttempt,
}: Props) => {
  const summary = (() => {
    if (!rangeStart) return 'Tap a day to set your check-in.';
    if (!rangeEnd)
      return `Tap another day to set your check-out — or tap ${formatLongDate(rangeStart)} again for a single-day stay.`;
    const nights = nightsBetween(rangeStart, rangeEnd);
    return nights === 0
      ? `${formatLongDate(rangeStart)} · single day`
      : `${formatRange(rangeStart, rangeEnd)} · ${nights} ${nights === 1 ? 'night' : 'nights'}`;
  })();

  return (
    <div>
      <h4 className="text-brand-900 text-base font-semibold mb-1">Pick your dates</h4>
      <p className="text-zinc-500 text-sm mb-5">
        Green-tinted dates are already booked. Past dates are disabled.
      </p>
      <CalendarView
        calendar={calendar}
        today={today}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        hoveredDate={hoveredDate}
        bookedDates={bookedDates}
        onSelectDate={onSelectDate}
        onHoverDate={onHoverDate}
        onBookedAttempt={onBookedAttempt}
      />
      <p className="text-zinc-700 text-sm mt-5">{summary}</p>
    </div>
  );
};

export default DateStep;

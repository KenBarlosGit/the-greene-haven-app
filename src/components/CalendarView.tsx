import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarState } from '../hooks/useCalendar';
import {
  DAYS_OF_WEEK,
  MONTHS_OF_YEAR,
  isSameDay,
  isPastDay,
  isDateInRange,
  toISODateOnly,
} from '../lib/date';
import { cn } from '../lib/cn';

interface Props {
  calendar: CalendarState;
  today: Date;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  hoveredDate: Date | null;
  bookedDates: Set<string>;
  onSelectDate: (date: Date) => void;
  onHoverDate?: (date: Date | null) => void;
  onBookedAttempt?: (date: Date) => void;
}

const CalendarView = ({
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
  const { month, year, daysInMonth, firstDayOfMonth, goToPrevMonth, goToNextMonth } = calendar;

  const previewEnd =
    rangeStart && !rangeEnd && hoveredDate && hoveredDate >= rangeStart ? hoveredDate : rangeEnd;

  return (
    <div className="flex-shrink-0 w-full sm:max-w-[340px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-brand-900 text-base">
          {MONTHS_OF_YEAR[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goToPrevMonth}
            className="w-9 h-9 rounded-full text-zinc-500 hover:bg-brand-50 hover:text-brand-800 transition-colors flex items-center justify-center"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={goToNextMonth}
            className="w-9 h-9 rounded-full text-zinc-500 hover:bg-brand-50 hover:text-brand-800 transition-colors flex items-center justify-center"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {DAYS_OF_WEEK.map((day) => (
          <span
            key={day}
            className="text-center text-zinc-400 text-[11px] uppercase tracking-wider py-1.5"
          >
            {day}
          </span>
        ))}
      </div>

      <div
        className="grid grid-cols-7 gap-x-0 gap-y-1"
        onMouseLeave={() => onHoverDate?.(null)}
      >
        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <span key={`empty-${i}`} aria-hidden />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const date = new Date(year, month, day);
          const iso = toISODateOnly(date);
          const isToday = isSameDay(date, today);
          const disabled = isPastDay(date, today);
          const isBooked = bookedDates.has(iso);

          const isStart = rangeStart ? isSameDay(date, rangeStart) : false;
          const isEnd = previewEnd ? isSameDay(date, previewEnd) : false;
          const inRange = isDateInRange(date, rangeStart, previewEnd);
          const isMiddle = inRange && !isStart && !isEnd;
          const isEndpoint = (isStart || isEnd) && !disabled;

          let cellClass: string;
          if (disabled) {
            cellClass = 'text-zinc-300 cursor-not-allowed rounded-md';
          } else if (isEndpoint) {
            cellClass =
              'bg-gradient-to-br from-brand-600 to-brand-900 text-white rounded-md relative z-10 shadow-sm shadow-brand-900/30';
          } else if (isMiddle) {
            cellClass = 'bg-brand-50 text-brand-900';
          } else if (isBooked) {
            cellClass =
              'bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-200 rounded-md hover:bg-brand-200/70 cursor-pointer';
          } else if (isToday) {
            cellClass = 'text-brand-800 ring-1 ring-brand-700 rounded-md';
          } else {
            cellClass = 'text-zinc-700 hover:bg-brand-50 rounded-md';
          }

          const ariaLabel = isBooked
            ? `${MONTHS_OF_YEAR[month]} ${day}, ${year} — already booked`
            : `${MONTHS_OF_YEAR[month]} ${day}, ${year}`;

          return (
            <button
              type="button"
              key={day}
              onClick={() => {
                if (disabled) return;
                if (isBooked) onBookedAttempt?.(date);
                else onSelectDate(date);
              }}
              onMouseEnter={() => onHoverDate?.(date)}
              onFocus={() => onHoverDate?.(date)}
              disabled={disabled}
              className={cn(
                'h-10 min-w-0 flex items-center justify-center text-sm font-medium transition-colors',
                cellClass,
              )}
              aria-pressed={isStart || isEnd}
              aria-label={ariaLabel}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;

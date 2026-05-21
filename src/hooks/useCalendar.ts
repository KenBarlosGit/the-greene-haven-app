import { useCallback, useMemo, useState } from 'react';

export interface CalendarState {
  month: number;
  year: number;
  daysInMonth: number;
  firstDayOfMonth: number;
  goToPrevMonth: () => void;
  goToNextMonth: () => void;
  setView: (date: Date) => void;
}

export function useCalendar(initial: Date = new Date()): CalendarState {
  const [month, setMonth] = useState(initial.getMonth());
  const [year, setYear] = useState(initial.getFullYear());

  const goToPrevMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setMonth((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const setView = useCallback((date: Date) => {
    setMonth(date.getMonth());
    setYear(date.getFullYear());
  }, []);

  const { daysInMonth, firstDayOfMonth } = useMemo(
    () => ({
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      firstDayOfMonth: new Date(year, month, 1).getDay(),
    }),
    [month, year],
  );

  return {
    month,
    year,
    daysInMonth,
    firstDayOfMonth,
    goToPrevMonth,
    goToNextMonth,
    setView,
  };
}

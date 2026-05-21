import { useCallback, useEffect, useState } from 'react';
import type { Booking, BookingDraft } from '../types/booking';
import { findConflict } from '../lib/conflicts';

const STORAGE_KEY = 'tgh.bookings.v2';

function load(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (b): b is Booking =>
        typeof b === 'object' &&
        b !== null &&
        typeof (b as Booking).id === 'string' &&
        typeof (b as Booking).startDateISO === 'string' &&
        typeof (b as Booking).endDateISO === 'string' &&
        typeof (b as Booking).time === 'string',
    );
  } catch {
    return [];
  }
}

function sortBookings(list: Booking[]): Booking[] {
  return [...list].sort((a, b) => {
    if (a.startDateISO !== b.startDateISO) return a.startDateISO < b.startDateISO ? -1 : 1;
    return a.time < b.time ? -1 : 1;
  });
}

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>(() => sortBookings(load()));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [bookings]);

  const addBooking = useCallback((draft: BookingDraft) => {
    const next: Booking = {
      ...draft,
      id:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `b_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    };
    setBookings((prev) => sortBookings([...prev, next]));
    return next;
  }, []);

  const updateBooking = useCallback((id: string, draft: BookingDraft) => {
    setBookings((prev) =>
      sortBookings(prev.map((b) => (b.id === id ? { ...draft, id } : b))),
    );
  }, []);

  const deleteBooking = useCallback((id: string) => {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const checkConflict = useCallback(
    (candidate: { startDateISO: string; endDateISO: string; excludeId?: string }) =>
      findConflict(bookings, candidate),
    [bookings],
  );

  return { bookings, addBooking, updateBooking, deleteBooking, checkConflict };
}

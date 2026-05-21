import { useCallback, useEffect, useState } from 'react';
import type { Booking, BookingDraft } from '../types/booking';
import { findConflict } from '../lib/conflicts';
import { isSupabaseEnabled, supabase } from '../lib/supabase';
import {
  bookingDraftToInsert,
  bookingDraftToUpdate,
  rowToBooking,
  type BookingRow,
} from '../types/db';

const STORAGE_KEY = 'tgh.bookings.v2';

function loadFromStorage(): Booking[] {
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

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `b_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export interface UseBookingsResult {
  bookings: Booking[];
  loading: boolean;
  error: string | null;
  addBooking: (draft: BookingDraft) => Promise<void>;
  updateBooking: (id: string, draft: BookingDraft) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  checkConflict: (candidate: {
    startDateISO: string;
    endDateISO: string;
    excludeId?: string;
  }) => Booking | null;
}

export function useBookings(authUserId: string | null): UseBookingsResult {
  const [bookings, setBookings] = useState<Booking[]>(() =>
    isSupabaseEnabled ? [] : sortBookings(loadFromStorage()),
  );
  const [loading, setLoading] = useState<boolean>(isSupabaseEnabled);
  const [error, setError] = useState<string | null>(null);

  // ── Supabase-backed mode ────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) return;
    const sb = supabase;
    if (!authUserId) {
      setBookings([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      const { data, error: fetchErr } = await sb
        .from('bookings')
        .select('*')
        .order('start_date', { ascending: true });
      if (cancelled) return;
      if (fetchErr) {
        setError(fetchErr.message);
        setLoading(false);
        return;
      }
      setBookings(sortBookings((data ?? []).map((row) => rowToBooking(row as BookingRow))));
      setLoading(false);
    })();

    const channel = sb
      .channel('public:bookings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (cancelled) return;
          if (payload.eventType === 'INSERT') {
            const incoming = rowToBooking(payload.new as BookingRow);
            setBookings((prev) =>
              prev.some((b) => b.id === incoming.id)
                ? prev
                : sortBookings([...prev, incoming]),
            );
          } else if (payload.eventType === 'UPDATE') {
            const incoming = rowToBooking(payload.new as BookingRow);
            setBookings((prev) =>
              sortBookings(prev.map((b) => (b.id === incoming.id ? incoming : b))),
            );
          } else if (payload.eventType === 'DELETE') {
            const removed = payload.old as Partial<BookingRow>;
            setBookings((prev) => prev.filter((b) => b.id !== removed.id));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void sb.removeChannel(channel);
    };
  }, [authUserId]);

  // ── localStorage fallback persistence ───────────────────────────────────
  useEffect(() => {
    if (isSupabaseEnabled) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [bookings]);

  const addBooking = useCallback(
    async (draft: BookingDraft) => {
      if (isSupabaseEnabled && supabase) {
        const { error: insertErr } = await supabase
          .from('bookings')
          .insert(bookingDraftToInsert(draft));
        if (insertErr) throw new Error(insertErr.message);
        // realtime subscription will sync the new row into state
        return;
      }
      const next: Booking = { ...draft, id: makeId(), userId: null };
      setBookings((prev) => sortBookings([...prev, next]));
    },
    [],
  );

  const updateBooking = useCallback(
    async (id: string, draft: BookingDraft) => {
      if (isSupabaseEnabled && supabase) {
        const { error: updateErr } = await supabase
          .from('bookings')
          .update(bookingDraftToUpdate(draft))
          .eq('id', id);
        if (updateErr) throw new Error(updateErr.message);
        return;
      }
      setBookings((prev) =>
        sortBookings(
          prev.map((b) => (b.id === id ? { ...draft, id, userId: b.userId } : b)),
        ),
      );
    },
    [],
  );

  const deleteBooking = useCallback(async (id: string) => {
    if (isSupabaseEnabled && supabase) {
      const { error: deleteErr } = await supabase.from('bookings').delete().eq('id', id);
      if (deleteErr) throw new Error(deleteErr.message);
      return;
    }
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const checkConflict = useCallback(
    (candidate: { startDateISO: string; endDateISO: string; excludeId?: string }) =>
      findConflict(bookings, candidate),
    [bookings],
  );

  return { bookings, loading, error, addBooking, updateBooking, deleteBooking, checkConflict };
}

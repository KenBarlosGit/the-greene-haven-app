import type { Booking } from '../types/booking';

export function rangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart <= bEnd && bStart <= aEnd;
}

export function findConflict(
  bookings: Booking[],
  candidate: { startDateISO: string; endDateISO: string; excludeId?: string },
): Booking | null {
  return (
    bookings.find(
      (b) =>
        b.id !== candidate.excludeId &&
        rangesOverlap(b.startDateISO, b.endDateISO, candidate.startDateISO, candidate.endDateISO),
    ) ?? null
  );
}

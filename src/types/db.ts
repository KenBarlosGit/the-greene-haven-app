import type { Booking, BookingDraft } from './booking';

export interface BookingRow {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  time: string;
  guest_name: string;
  guest_email: string;
  party_size: number;
  notes: string;
  created_at: string;
}

export function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    userId: row.user_id,
    startDateISO: row.start_date,
    endDateISO: row.end_date,
    time: row.time,
    guestName: row.guest_name,
    guestEmail: row.guest_email,
    partySize: row.party_size,
    notes: row.notes,
  };
}

export function bookingDraftToInsert(draft: BookingDraft) {
  return {
    start_date: draft.startDateISO,
    end_date: draft.endDateISO,
    time: draft.time,
    guest_name: draft.guestName,
    guest_email: draft.guestEmail,
    party_size: draft.partySize,
    notes: draft.notes,
  };
}

export function bookingDraftToUpdate(draft: BookingDraft) {
  return bookingDraftToInsert(draft);
}

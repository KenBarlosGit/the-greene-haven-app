export interface Booking {
  id: string;
  userId: string | null;
  startDateISO: string;
  endDateISO: string;
  time: string;
  guestName: string;
  guestEmail: string;
  partySize: number;
  notes: string;
}

export type BookingDraft = Omit<Booking, 'id' | 'userId'>;

export type FormStep = 1 | 2 | 3;

export interface DateRange {
  start: Date;
  end: Date;
}

export interface Booking {
  id: string;
  startDateISO: string;
  endDateISO: string;
  time: string;
  guestName: string;
  guestEmail: string;
  partySize: number;
  notes: string;
}

export type BookingDraft = Omit<Booking, 'id'>;

export type FormStep = 1 | 2 | 3;

export interface DateRange {
  start: Date;
  end: Date;
}

export const RATE_PER_NIGHT    = 1800;
export const EXTRA_PERSON_RATE = 200;
export const CURRENCY_SYMBOL   = '₱';
export const STAY_LENGTH_LABEL = '22 hours';

export function billableNights(nights: number): number {
  return Math.max(1, nights);
}

export function rateForParty(partySize: number): number {
  return RATE_PER_NIGHT + Math.max(0, partySize - 4) * EXTRA_PERSON_RATE;
}

export function calculateTotal(nights: number, partySize = 1): number {
  return rateForParty(partySize) * billableNights(nights);
}

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-PH')}`;
}

export function formatRate(): string {
  return `${formatCurrency(RATE_PER_NIGHT)} / ${STAY_LENGTH_LABEL} · +${formatCurrency(EXTRA_PERSON_RATE)}/extra guest`;
}

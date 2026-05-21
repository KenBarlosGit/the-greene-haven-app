// Single source of truth for venue pricing.
// Change RATE_PER_NIGHT here to update every price in the app.
export const RATE_PER_NIGHT = 1800;
export const CURRENCY_SYMBOL = '₱';
export const STAY_LENGTH_LABEL = '22 hours';

export function billableNights(nights: number): number {
  return Math.max(1, nights);
}

export function calculateTotal(nights: number): number {
  return RATE_PER_NIGHT * billableNights(nights);
}

export function formatCurrency(amount: number): string {
  return `${CURRENCY_SYMBOL}${amount.toLocaleString('en-PH')}`;
}

export function formatRate(): string {
  return `${formatCurrency(RATE_PER_NIGHT)} / ${STAY_LENGTH_LABEL}`;
}

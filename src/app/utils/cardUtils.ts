/**
 * Card utilities: type detection, formatting.
 * BIN-based detection for MIR, Visa, Mastercard, Maestro, etc.
 */

export type CardType = 'mir' | 'visa' | 'mastercard' | 'maestro' | 'other';

const MIR_BINS = [/^220[0-4]/, /^2205\d{2}/];
const VISA = /^4/;
const MASTERCARD = /^(5[1-5]|2[2-7][0-9]{2})/;
const MAESTRO = /^(5018|5020|5038|5893|6304|6759|6761|6762|6763)/;

export function getCardType(number: string): CardType {
  const raw = number.replace(/\D/g, '');
  if (raw.length < 4) return 'other';
  if (MIR_BINS.some((r) => r.test(raw))) return 'mir';
  if (MAESTRO.test(raw)) return 'maestro';
  if (VISA.test(raw)) return 'visa';
  if (MASTERCARD.test(raw)) return 'mastercard';
  return 'other';
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  const groups = digits.match(/.{1,4}/g) ?? [];
  return groups.join(' ');
}

/** Formatted number for card preview; empty → placeholder. */
export function formatCardDisplay(value: string): string {
  const s = formatCardNumber(value);
  return s || '•••• •••• •••• ••••';
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatExpiryDisplay(value: string): string {
  const f = formatExpiry(value);
  return f || 'MM/YY';
}

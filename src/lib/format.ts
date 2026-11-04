const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const shortDateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export function formatCurrencyBRL(value: number): string {
  return currencyFormatter.format(value);
}

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function parseAmountInput(value: string): number | null {
  const trimmed = value.trim();
  const normalized = trimmed.includes(',') ? trimmed.replace(/\./g, '').replace(',', '.') : trimmed;
  if (!AMOUNT_PATTERN.test(normalized)) return null;
  const amount = Number(normalized);
  return amount > 0 ? amount : null;
}

export function formatShortDateTime(iso: string): string {
  return shortDateFormatter.format(new Date(iso));
}

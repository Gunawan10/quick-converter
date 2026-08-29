export function formatNumber(value, maximumFractionDigits = 5) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits
  }).format(value);
}

export function formatMoney(amount, currency) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits:
      currency === 'JPY' || currency === 'KRW'
        ? 0
        : 2
  }).format(amount);
}

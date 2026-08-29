export function formatCurrency(value, currency) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency,
    maximumFractionDigits:
      currency === 'JPY' || currency === 'KRW'
        ? 0
        : 2
  }).format(value);
}

export function formatUnitValue(value, unit) {
  const formattedValue = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 5
  }).format(value);

  return `${formattedValue} ${unit}`;
}

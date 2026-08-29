export const DEFAULT_CURRENCY = 'IDR';

export const CURRENCIES = {
  AUD: { name: 'Australian Dollar', symbol: 'A$' }, CAD: { name: 'Canadian Dollar', symbol: 'C$' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' }, CNY: { name: 'Chinese Yuan', symbol: '¥' },
  EUR: { name: 'Euro', symbol: '€' }, GBP: { name: 'British Pound', symbol: '£' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' }, IDR: { name: 'Indonesian Rupiah', symbol: 'Rp' },
  INR: { name: 'Indian Rupee', symbol: '₹' }, JPY: { name: 'Japanese Yen', symbol: '¥' },
  KRW: { name: 'South Korean Won', symbol: '₩' }, MYR: { name: 'Malaysian Ringgit', symbol: 'RM' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' }, SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  THB: { name: 'Thai Baht', symbol: '฿' }, USD: { name: 'US Dollar', symbol: '$' }
};
const LOCALE_CURRENCIES = { ID:'IDR',US:'USD',CA:'CAD',AU:'AUD',NZ:'NZD',GB:'GBP',JP:'JPY',KR:'KRW',CN:'CNY',HK:'HKD',IN:'INR',MY:'MYR',SG:'SGD',TH:'THB',CH:'CHF' };
export function getCurrencyFromLocale(locale) { if (!locale) return DEFAULT_CURRENCY; const country = locale.split(/[-_]/)[1]?.toUpperCase(); return LOCALE_CURRENCIES[country] || DEFAULT_CURRENCY; }

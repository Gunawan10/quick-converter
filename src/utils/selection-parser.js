import { CURRENCIES } from '../constants/currencies.js';
import { resolveUnit } from '../constants/units.js';
import { parseNumber } from './number-parser.js';

const CURRENCY_CODES = Object.keys(CURRENCIES).join('|');
const CODE_PATTERN = new RegExp(
  `^([+-]?[\\d.,]+)\\s*(${CURRENCY_CODES})$`,
  'i'
);
const PREFIX_CODE_PATTERN = new RegExp(
  `^(${CURRENCY_CODES})\\s*([+-]?[\\d.,]+)$`,
  'i'
);

const CURRENCY_SYMBOLS = [
  ['CN¥', 'CNY'],
  ['A$', 'AUD'],
  ['C$', 'CAD'],
  ['HK$', 'HKD'],
  ['NZ$', 'NZD'],
  ['S$', 'SGD'],
  ['Rp', 'IDR'],
  ['RM', 'MYR'],
  ['$', 'USD'],
  ['€', 'EUR'],
  ['£', 'GBP'],
  ['₩', 'KRW'],
  ['₹', 'INR'],
  ['฿', 'THB'],
  ['¥', 'JPY']
];

export function parseSelection(text) {
  const value = String(text ?? '').trim();

  if (!value) {
    return null;
  }

  const currency = parseCurrency(value);

  if (currency) {
    return currency;
  }

  return parseUnitValue(value);
}

function parseUnitValue(value) {
  const match = value.match(
    /^([+-]?[\d.,]+)\s*(.+)$/u
  );

  if (!match) {
    return null;
  }

  const numericValue = parseNumber(match[1]);

  if (numericValue === null) {
    return null;
  }

  const resolved = resolveUnit(match[2]);

  if (!resolved) {
    return null;
  }

  return {
    type: resolved.type,
    value: numericValue,
    unit: resolved.unit
  };
}

function parseCurrency(value) {
  const codeResult = parseCurrencyCode(value);

  if (codeResult) {
    return codeResult;
  }

  return parseCurrencySymbol(value);
}

function parseCurrencyCode(value) {
  let match = value.match(CODE_PATTERN);

  if (match) {
    return buildCurrencyResult(match[1], match[2]);
  }

  match = value.match(PREFIX_CODE_PATTERN);

  if (match) {
    return buildCurrencyResult(match[2], match[1]);
  }

  return null;
}

function parseCurrencySymbol(value) {
  for (const [symbol, code] of CURRENCY_SYMBOLS) {
    if (!value.startsWith(symbol)) {
      continue;
    }

    const amount = parseNumber(
      value.slice(symbol.length)
    );

    if (amount === null || amount < 0) {
      return null;
    }

    return {
      type: 'currency',
      value: amount,
      unit: code
    };
  }

  return null;
}

function buildCurrencyResult(amountText, currencyCode) {
  const amount = parseNumber(amountText);

  if (amount === null || amount < 0) {
    return null;
  }

  return {
    type: 'currency',
    value: amount,
    unit: currencyCode.toUpperCase()
  };
}

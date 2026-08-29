import { CURRENCIES } from '../constants/currencies.js';
import {
  findUnitByAlias,
  UNIT_TYPES
} from '../constants/units.js';
import { parseNumber } from './number-parser.js';

const CURRENCY_SYMBOLS = [
  { code: 'USD', pattern: /^\$/ },
  { code: 'EUR', pattern: /^€/ },
  { code: 'GBP', pattern: /^£/ },
  { code: 'JPY', pattern: /^¥/ },
  { code: 'CNY', pattern: /^CN¥/i },
  { code: 'KRW', pattern: /^₩/ },
  { code: 'INR', pattern: /^₹/ },
  { code: 'THB', pattern: /^฿/ }
];

const CURRENCY_CODES = Object.keys(CURRENCIES);
const CURRENCY_CODE_PATTERN = new RegExp(
  `\\b(${CURRENCY_CODES.join('|')})\\b`,
  'i'
);

export function parseSelection(text) {
  const value = text?.trim();

  if (!value) {
    return null;
  }

  return (
    parseCurrencySelection(value) ||
    parseUnitSelection(value)
  );
}

function parseCurrencySelection(text) {
  const currency = resolveCurrency(text);

  if (!currency) {
    return null;
  }

  const numberText = text
    .replace(CURRENCY_CODE_PATTERN, '')
    .replace(/CN¥|[$€£¥₩₹฿]/gi, '')
    .trim();

  const value = parseNumber(numberText);

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return {
    type: 'currency',
    value,
    unit: currency
  };
}

function resolveCurrency(text) {
  const codeMatch = text.match(CURRENCY_CODE_PATTERN);

  if (codeMatch) {
    return codeMatch[1].toUpperCase();
  }

  return CURRENCY_SYMBOLS.find(({ pattern }) =>
    pattern.test(text)
  )?.code || null;
}

function parseUnitSelection(text) {
  const match = text.match(
    /^\s*([+-]?[\d.,]+)\s*([^\d\s].*?)\s*$/u
  );

  if (!match) {
    return null;
  }

  const value = parseNumber(match[1]);

  if (!Number.isFinite(value)) {
    return null;
  }

  const rawUnit = match[2].trim();

  for (const type of UNIT_TYPES) {
    const unit = findUnitByAlias(type, rawUnit);

    if (!unit) {
      continue;
    }

    if (type !== 'temperature' && value < 0) {
      return null;
    }

    return {
      type,
      value,
      unit
    };
  }

  return null;
}

import {
  CURRENCIES,
  DEFAULT_CURRENCY
} from '../constants/currencies.js';
import {
  UNIT_TYPES,
  getDefaultTarget,
  getUnitLabel
} from '../constants/units.js';
import {
  formatMoney,
  formatNumber
} from '../utils/formatter.js';
import { convertUnit } from './unit-converter.js';
import { getRate } from './exchange-rate.js';

export async function convert(parsed, options = {}) {
  if (!parsed) {
    throw new Error('Nothing to convert');
  }

  if (parsed.type === 'currency') {
    return convertCurrency(parsed, options);
  }

  return convertMeasurement(parsed, options);
}

function convertMeasurement(parsed, options) {
  const targetUnit =
    options.targetUnit || getDefaultTarget(parsed.type);

  const convertedValue = convertUnit(
    parsed.type,
    parsed.value,
    parsed.unit,
    targetUnit
  );

  return {
    success: true,
    type: parsed.type,
    value: parsed.value,
    fromUnit: parsed.unit,
    toUnit: targetUnit,
    source: `${formatNumber(parsed.value)} ${getUnitLabel(parsed.type, parsed.unit)}`,
    result: `${formatNumber(convertedValue)} ${getUnitLabel(parsed.type, targetUnit)}`,
    convertedValue,
    targets: getUnitTargets(parsed.type)
  };
}

async function convertCurrency(parsed, options) {
  const targetCurrency =
    options.targetCurrency || DEFAULT_CURRENCY;

  if (!CURRENCIES[targetCurrency]) {
    throw new Error('Unsupported target currency');
  }

  const { rate, date } = await getRate(
    parsed.unit,
    targetCurrency,
    options.storage,
    options.fetchFn
  );

  const convertedValue = parsed.value * rate;

  return {
    success: true,
    type: 'currency',
    value: parsed.value,
    fromUnit: parsed.unit,
    toUnit: targetCurrency,
    source: formatMoney(parsed.value, parsed.unit),
    result: formatMoney(convertedValue, targetCurrency),
    convertedValue,
    rate,
    date,
    provider: 'Frankfurter',
    targets: Object.entries(CURRENCIES).map(([code, currency]) => ({
      value: code,
      label: `${code} — ${currency.name}`
    }))
  };
}

function getUnitTargets(type) {
  const units = UNIT_TYPES[type]?.units || {};

  return Object.entries(units).map(([code, unit]) => ({
    value: code,
    label: unit.label
  }));
}

import { DEFAULT_TARGETS } from '../constants/units.js';
import { CURRENCIES, DEFAULT_CURRENCY } from '../constants/currencies.js';
import { convertUnit } from './unit-converter.js';
import { getRate } from './exchange-rate.js';
import { formatCurrency, formatUnitValue } from '../utils/formatter.js';

export async function convert(
  parsed,
  { targetCurrency = DEFAULT_CURRENCY, getRateFn = getRate } = {}
) {
  if (!parsed) {
    throw new Error('Parsed input is required.');
  }

  if (parsed.type === 'currency') {
    return convertCurrency(parsed, targetCurrency, getRateFn);
  }

  return convertMeasurement(parsed);
}

async function convertCurrency(parsed, targetCurrency, getRateFn) {
  if (!CURRENCIES[targetCurrency]) {
    throw new Error('Unsupported target currency.');
  }

  const { rate, date } = await getRateFn(
    parsed.unit,
    targetCurrency
  );
  const convertedValue = parsed.value * rate;

  return {
    success: true,
    type: parsed.type,
    value: parsed.value,
    fromUnit: parsed.unit,
    toUnit: targetCurrency,
    convertedValue,
    source: formatCurrency(parsed.value, parsed.unit),
    result: formatCurrency(convertedValue, targetCurrency),
    rate,
    date,
    provider: 'Frankfurter',
    currencies: CURRENCIES
  };
}

function convertMeasurement(parsed) {
  const targetUnit = DEFAULT_TARGETS[parsed.type];

  if (!targetUnit) {
    throw new Error('Unsupported converter type.');
  }

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
    convertedValue,
    source: formatUnitValue(parsed.value, parsed.unit),
    result: formatUnitValue(convertedValue, targetUnit)
  };
}

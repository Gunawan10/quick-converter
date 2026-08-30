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

  const rate = convertUnit(
    parsed.type,
    1,
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
    rate,
    formula: buildUnitFormula(parsed.type, parsed.unit, targetUnit, rate),
    targets: getUnitTargets(parsed.type)
  };
}

async function convertCurrency(parsed, options) {
  const targetCurrency =
    options.targetCurrency || DEFAULT_CURRENCY;

  if (!CURRENCIES[targetCurrency]) {
    throw new Error('Unsupported target currency');
  }

  let rate;
  let date;

  if (Number.isFinite(options.rateOverride)) {
    rate = options.rateOverride;
    date = options.dateOverride || null;
  } else {
    const response = await getRate(
      parsed.unit,
      targetCurrency,
      options.storage,
      options.fetchFn
    );

    rate = response.rate;
    date = response.date;
  }

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

function buildUnitFormula(type, fromUnit, toUnit, rate) {
  if (fromUnit === toUnit) {
    return `${toUnit} = ${fromUnit}`;
  }

  if (type !== 'temperature') {
    return `${toUnit} = ${fromUnit} × ${formatNumber(rate, 6)}`;
  }

  const formulas = {
    '°C→°F': '°F = (°C × 9/5) + 32',
    '°F→°C': '°C = (°F − 32) × 5/9',
    '°C→K': 'K = °C + 273.15',
    'K→°C': '°C = K − 273.15',
    '°C→°R': '°R = °C × 4/5',
    '°R→°C': '°C = °R × 5/4',
    '°F→K': 'K = (°F − 32) × 5/9 + 273.15',
    'K→°F': '°F = (K − 273.15) × 9/5 + 32',
    '°F→°R': '°R = (°F − 32) × 4/9',
    '°R→°F': '°F = °R × 9/4 + 32',
    'K→°R': '°R = (K − 273.15) × 4/5',
    '°R→K': 'K = °R × 5/4 + 273.15'
  };

  return formulas[`${fromUnit}→${toUnit}`] || '';
}

function getUnitTargets(type) {
  const units = UNIT_TYPES[type]?.units || {};

  return Object.entries(units).map(([code, unit]) => ({
    value: code,
    label: `${code} — ${unit.name || unit.label}`
  }));
}

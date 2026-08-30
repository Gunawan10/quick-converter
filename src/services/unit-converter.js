import { UNIT_TYPES } from '../constants/units.js';

export function convertUnit(type, value, fromUnit, toUnit) {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid numeric value');
  }

  if (type === 'temperature') {
    return convertTemperature(value, fromUnit, toUnit);
  }

  const config = UNIT_TYPES[type];
  const from = config?.units?.[fromUnit];
  const to = config?.units?.[toUnit];

  if (!from || !to) {
    throw new Error('Unsupported unit conversion');
  }

  if (type === 'data') {
    return value * from.bytes / to.bytes;
  }

  return value * from.factor / to.factor;
}

function convertTemperature(value, from, to) {
  if (from === to) {
    return value;
  }

  const celsius = toCelsius(value, from);

  if (to === '°C') {
    return celsius;
  }

  if (to === '°F') {
    return celsius * 9 / 5 + 32;
  }

  if (to === 'K') {
    return celsius + 273.15;
  }

  if (to === '°R') {
    return celsius * 4 / 5;
  }

  throw new Error('Unsupported temperature target');
}

function toCelsius(value, unit) {
  if (unit === '°C') {
    return value;
  }

  if (unit === '°F') {
    return (value - 32) * 5 / 9;
  }

  if (unit === 'K') {
    return value - 273.15;
  }

  if (unit === '°R') {
    return value * 5 / 4;
  }

  throw new Error('Unsupported temperature unit');
}

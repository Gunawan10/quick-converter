import { UNITS } from '../constants/units.js';

export function convertUnit(type, value, fromUnit, toUnit) {
  if (type === 'temperature') {
    return convertTemperature(value, fromUnit, toUnit);
  }

  const units = UNITS[type];
  const from = units?.[fromUnit];
  const to = units?.[toUnit];

  if (!from || !to) {
    throw new Error('Unsupported unit conversion.');
  }

  const baseValue = value * from.factor;

  return baseValue / to.factor;
}

function convertTemperature(value, fromUnit, toUnit) {
  if (!UNITS.temperature[fromUnit] || !UNITS.temperature[toUnit]) {
    throw new Error('Unsupported temperature unit.');
  }

  if (fromUnit === toUnit) {
    return value;
  }

  const celsius = toCelsius(value, fromUnit);

  return fromCelsius(celsius, toUnit);
}

function toCelsius(value, unit) {
  switch (unit) {
    case 'c':
      return value;
    case 'f':
      return (value - 32) * (5 / 9);
    case 'k':
      return value - 273.15;
    default:
      throw new Error('Unsupported temperature unit.');
  }
}

function fromCelsius(value, unit) {
  switch (unit) {
    case 'c':
      return value;
    case 'f':
      return value * (9 / 5) + 32;
    case 'k':
      return value + 273.15;
    default:
      throw new Error('Unsupported temperature unit.');
  }
}

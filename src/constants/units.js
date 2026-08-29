export const UNIT_TYPES = [
  'length',
  'weight',
  'temperature',
  'data'
];

export const DEFAULT_TARGETS = {
  length: 'km',
  weight: 'kg',
  temperature: 'c',
  data: 'MB'
};

export const UNITS = {
  length: {
    mm: unit('Millimeter', ['mm', 'millimeter', 'millimeters'], 0.001),
    cm: unit('Centimeter', ['cm', 'centimeter', 'centimeters'], 0.01),
    m: unit('Meter', ['m', 'meter', 'meters', 'metre', 'metres'], 1),
    km: unit('Kilometer', ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'], 1000),
    in: unit('Inch', ['in', 'inch', 'inches'], 0.0254),
    ft: unit('Foot', ['ft', 'foot', 'feet'], 0.3048),
    yd: unit('Yard', ['yd', 'yard', 'yards'], 0.9144),
    mi: unit('Mile', ['mi', 'mile', 'miles'], 1609.344)
  },

  weight: {
    mg: unit('Milligram', ['mg', 'milligram', 'milligrams'], 0.000001),
    g: unit('Gram', ['g', 'gram', 'grams'], 0.001),
    kg: unit('Kilogram', ['kg', 'kilogram', 'kilograms'], 1),
    oz: unit('Ounce', ['oz', 'ounce', 'ounces'], 0.028349523125),
    lb: unit('Pound', ['lb', 'lbs', 'pound', 'pounds'], 0.45359237),
    ton: unit('Ton', ['ton', 'tons', 'tonne', 'tonnes'], 1000)
  },

  temperature: {
    c: temperatureUnit('°C', ['c', '°c', 'celsius']),
    f: temperatureUnit('°F', ['f', '°f', 'fahrenheit']),
    k: temperatureUnit('K', ['k', 'kelvin'])
  },

  data: {
    bit: unit('bit', ['bit', 'bits'], 0.125),
    Byte: unit('Byte', ['byte', 'bytes', 'b'], 1),
    KB: unit('KB', ['kb', 'kilobyte', 'kilobytes'], 1000),
    MB: unit('MB', ['mb', 'megabyte', 'megabytes'], 1000000),
    GB: unit('GB', ['gb', 'gigabyte', 'gigabytes'], 1000000000),
    TB: unit('TB', ['tb', 'terabyte', 'terabytes'], 1000000000000)
  }
};

export function findUnitByAlias(type, value) {
  const normalized = normalizeAlias(value);
  const units = UNITS[type];

  if (!units) {
    return null;
  }

  for (const [code, definition] of Object.entries(units)) {
    if (
      code.toLowerCase() === normalized ||
      definition.aliases.some(
        (alias) => normalizeAlias(alias) === normalized
      )
    ) {
      return code;
    }
  }

  return null;
}

function unit(label, aliases, factor) {
  return {
    label,
    aliases,
    factor
  };
}

function temperatureUnit(label, aliases) {
  return {
    label,
    aliases
  };
}

function normalizeAlias(value) {
  return String(value)
    .trim()
    .toLowerCase();
}

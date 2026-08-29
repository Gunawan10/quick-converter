export const UNIT_TYPES = {
  length: {
    label: 'Length',
    defaultTarget: 'km',
    units: {
      mm: unit('mm', ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'], 0.001),
      cm: unit('cm', ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'], 0.01),
      m: unit('m', ['m', 'meter', 'meters', 'metre', 'metres'], 1),
      km: unit('km', ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'], 1000),
      in: unit('in', ['in', 'inch', 'inches'], 0.0254),
      ft: unit('ft', ['ft', 'foot', 'feet'], 0.3048),
      yd: unit('yd', ['yd', 'yard', 'yards'], 0.9144),
      mi: unit('mi', ['mi', 'mile', 'miles'], 1609.344)
    }
  },

  weight: {
    label: 'Weight',
    defaultTarget: 'kg',
    units: {
      mg: unit('mg', ['mg', 'milligram', 'milligrams'], 0.000001),
      g: unit('g', ['g', 'gram', 'grams'], 0.001),
      kg: unit('kg', ['kg', 'kilogram', 'kilograms', 'kilo', 'kilos'], 1),
      oz: unit('oz', ['oz', 'ounce', 'ounces'], 0.028349523125),
      lb: unit('lb', ['lb', 'lbs', 'pound', 'pounds'], 0.45359237),
      ton: unit('ton', ['ton', 'tons', 'tonne', 'tonnes'], 1000)
    }
  },

  temperature: {
    label: 'Temperature',
    defaultTarget: '°C',
    units: {
      '°C': {
        label: '°C',
        aliases: ['°c', 'c', 'celsius', 'centigrade']
      },
      '°F': {
        label: '°F',
        aliases: ['°f', 'f', 'fahrenheit']
      },
      K: {
        label: 'K',
        aliases: ['k', 'kelvin', 'kelvins']
      }
    }
  },

  data: {
    label: 'Data',
    defaultTarget: 'MB',
    units: {
      bit: dataUnit('bit', ['bit', 'bits'], 0.125),
      Byte: dataUnit('Byte', ['byte', 'bytes', 'b'], 1),
      KB: dataUnit('KB', ['kb', 'kilobyte', 'kilobytes'], 1000),
      MB: dataUnit('MB', ['mb', 'megabyte', 'megabytes'], 1000000),
      GB: dataUnit('GB', ['gb', 'gigabyte', 'gigabytes'], 1000000000),
      TB: dataUnit('TB', ['tb', 'terabyte', 'terabytes'], 1000000000000)
    }
  }
};

const ALIAS_INDEX = buildAliasIndex();

export function resolveUnit(alias) {
  return ALIAS_INDEX.get(
    String(alias).trim().toLowerCase()
  ) || null;
}

export function getDefaultTarget(type) {
  return UNIT_TYPES[type]?.defaultTarget || null;
}

export function getUnitLabel(type, unitCode) {
  return UNIT_TYPES[type]?.units?.[unitCode]?.label || unitCode;
}

function buildAliasIndex() {
  const index = new Map();

  for (const [type, config] of Object.entries(UNIT_TYPES)) {
    for (const [unitCode, definition] of Object.entries(config.units)) {
      for (const alias of definition.aliases) {
        index.set(alias.toLowerCase(), {
          type,
          unit: unitCode
        });
      }
    }
  }

  return index;
}

function unit(label, aliases, factor) {
  return {
    label,
    aliases,
    factor
  };
}

function dataUnit(label, aliases, bytes) {
  return {
    label,
    aliases,
    bytes
  };
}

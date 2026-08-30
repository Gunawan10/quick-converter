export const UNIT_TYPES = {
  length: {
    label: 'Length',
    defaultTarget: 'km',
    units: {
      km: unit('km', 'Kilometer', ['km', 'kilometer', 'kilometers', 'kilometre', 'kilometres'], 1000),
      hm: unit('hm', 'Hectometer', ['hm', 'hectometer', 'hectometers', 'hectometre', 'hectometres'], 100),
      dam: unit('dam', 'Decameter', ['dam', 'dkm', 'decameter', 'decameters', 'decametre', 'decametres', 'dekameter', 'dekameters'], 10),
      m: unit('m', 'Meter', ['m', 'meter', 'meters', 'metre', 'metres'], 1),
      dm: unit('dm', 'Decimeter', ['dm', 'decimeter', 'decimeters', 'decimetre', 'decimetres'], 0.1),
      cm: unit('cm', 'Centimeter', ['cm', 'centimeter', 'centimeters', 'centimetre', 'centimetres'], 0.01),
      mm: unit('mm', 'Millimeter', ['mm', 'millimeter', 'millimeters', 'millimetre', 'millimetres'], 0.001),
      mi: unit('mi', 'Mile', ['mi', 'mile', 'miles'], 1609.344),
      yd: unit('yd', 'Yard', ['yd', 'yard', 'yards'], 0.9144),
      ft: unit('ft', 'Foot', ['ft', 'foot', 'feet'], 0.3048),
      in: unit('in', 'Inch', ['in', 'inch', 'inches'], 0.0254)
    }
  },

  weight: {
    label: 'Weight',
    defaultTarget: 'kg',
    units: {
      ton: unit('ton', 'Ton', ['ton', 'tons', 'tonne', 'tonnes'], 1000),
      kg: unit('kg', 'Kilogram', ['kg', 'kilogram', 'kilograms', 'kilo', 'kilos'], 1),
      hg: unit('hg', 'Hectogram', ['hg', 'hectogram', 'hectograms'], 0.1),
      dag: unit('dag', 'Decagram', ['dag', 'decagram', 'decagrams', 'dekagram', 'dekagrams'], 0.01),
      g: unit('g', 'Gram', ['g', 'gram', 'grams'], 0.001),
      dg: unit('dg', 'Decigram', ['dg', 'decigram', 'decigrams'], 0.0001),
      cg: unit('cg', 'Centigram', ['cg', 'centigram', 'centigrams'], 0.00001),
      mg: unit('mg', 'Milligram', ['mg', 'milligram', 'milligrams'], 0.000001),
      lb: unit('lb', 'Pound', ['lb', 'lbs', 'pound', 'pounds'], 0.45359237),
      oz: unit('oz', 'Ounce', ['oz', 'ounce', 'ounces'], 0.028349523125)
    }
  },

  temperature: {
    label: 'Temperature',
    defaultTarget: '°C',
    units: {
      '°C': temperatureUnit('°C', 'Celsius', ['°c', 'c', 'celsius', 'centigrade']),
      '°F': temperatureUnit('°F', 'Fahrenheit', ['°f', 'f', 'fahrenheit']),
      K: temperatureUnit('K', 'Kelvin', ['k', 'kelvin', 'kelvins']),
      '°R': temperatureUnit('°R', 'Réaumur', ['°r', 'r', '°ré', '°re', 'ré', 're', 'réaumur', 'reaumur', 'reamur'])
    }
  },

  data: {
    label: 'Data',
    defaultTarget: 'MB',
    units: {
      TB: dataUnit('TB', 'Terabyte', ['tb', 'terabyte', 'terabytes'], 1000000000000),
      GB: dataUnit('GB', 'Gigabyte', ['gb', 'gigabyte', 'gigabytes'], 1000000000),
      MB: dataUnit('MB', 'Megabyte', ['mb', 'megabyte', 'megabytes'], 1000000),
      KB: dataUnit('KB', 'Kilobyte', ['kb', 'kilobyte', 'kilobytes'], 1000),
      Byte: dataUnit('Byte', 'Byte', ['byte', 'bytes', 'b'], 1),
      bit: dataUnit('bit', 'Bit', ['bit', 'bits'], 0.125)
    }
  }
};

const ALIAS_INDEX = buildAliasIndex();

export function resolveUnit(alias) {
  return ALIAS_INDEX.get(String(alias).trim().toLowerCase()) || null;
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
        index.set(alias.toLowerCase(), { type, unit: unitCode });
      }
    }
  }

  return index;
}

function unit(label, name, aliases, factor) {
  return { label, name, aliases, factor };
}

function temperatureUnit(label, name, aliases) {
  return { label, name, aliases };
}

function dataUnit(label, name, aliases, bytes) {
  return { label, name, aliases, bytes };
}

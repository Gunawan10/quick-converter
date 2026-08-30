import test from 'node:test';
import assert from 'node:assert/strict';

import { convertUnit } from '../src/services/unit-converter.js';
import { convert } from '../src/services/converter.js';

function assertClose(actual, expected, tolerance = 1e-5) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${actual} != ${expected}`
  );
}

function createMockStorage() {
  return {
    async get() {
      return {};
    },
    async set() {}
  };
}

function createMockRateFetch(rate, date = '2026-08-29') {
  return async () => ({
    ok: true,
    async json() {
      return { rate, date };
    }
  });
}

test('10 km to mi', () => {
  assertClose(
    convertUnit('length', 10, 'km', 'mi'),
    6.21371192
  );
});

test('10 mi to km', () => {
  assertClose(
    convertUnit('length', 10, 'mi', 'km'),
    16.09344
  );
});

test('5 kg to lb', () => {
  assertClose(
    convertUnit('weight', 5, 'kg', 'lb'),
    11.0231131
  );
});

test('1000 g to kg', () => {
  assertClose(
    convertUnit('weight', 1000, 'g', 'kg'),
    1
  );
});

test('0 C to F', () => {
  assertClose(
    convertUnit('temperature', 0, '°C', '°F'),
    32
  );
});

test('100 C to F', () => {
  assertClose(
    convertUnit('temperature', 100, '°C', '°F'),
    212
  );
});

test('100 C to Reaumur', () => {
  assertClose(
    convertUnit('temperature', 100, '°C', '°R'),
    80
  );
});

test('80 Reaumur to C', () => {
  assertClose(
    convertUnit('temperature', 80, '°R', '°C'),
    100
  );
});

test('80 Reaumur to F', () => {
  assertClose(
    convertUnit('temperature', 80, '°R', '°F'),
    212
  );
});

test('5 GB to MB', () => {
  assertClose(
    convertUnit('data', 5, 'GB', 'MB'),
    5000
  );
});

test('8 bit to Byte', () => {
  assertClose(
    convertUnit('data', 8, 'bit', 'Byte'),
    1
  );
});

test('measurement conversion returns rate, formula and targets', async () => {
  const result = await convert(
    {
      type: 'length',
      value: 10,
      unit: 'mi'
    },
    {
      targetUnit: 'km'
    }
  );

  assert.equal(result.success, true);
  assert.equal(result.fromUnit, 'mi');
  assert.equal(result.toUnit, 'km');
  assertClose(result.convertedValue, 16.09344);
  assertClose(result.rate, 1.609344);
  assert.equal(result.formula, 'km = mi × 1.609344');
  assert.ok(result.targets.some((target) => target.value === 'km'));
});

test('temperature conversion exposes Reaumur as a target', async () => {
  const result = await convert(
    {
      type: 'temperature',
      value: 100,
      unit: '°C'
    },
    {
      targetUnit: '°R'
    }
  );

  assert.equal(result.success, true);
  assert.equal(result.toUnit, '°R');
  assertClose(result.convertedValue, 80);
  assert.equal(result.formula, '°R = °C × 4/5');
  assert.ok(result.targets.some((target) => target.value === '°R'));
});

test('temperature formula follows conversion direction', async () => {
  const result = await convert(
    {
      type: 'temperature',
      value: 32,
      unit: '°F'
    },
    {
      targetUnit: '°C'
    }
  );

  assert.equal(result.formula, '°C = (°F − 32) × 5/9');
});

test('data conversion returns multiplier formula', async () => {
  const result = await convert(
    {
      type: 'data',
      value: 5,
      unit: 'GB'
    },
    {
      targetUnit: 'MB'
    }
  );

  assert.equal(result.formula, 'MB = GB × 1,000');
});

test('currency uses mocked exchange rate and preserves metadata', async () => {
  const result = await convert(
    {
      type: 'currency',
      value: 2,
      unit: 'USD'
    },
    {
      targetCurrency: 'IDR',
      storage: createMockStorage(),
      fetchFn: createMockRateFetch(16000)
    }
  );

  assert.equal(result.success, true);
  assert.equal(result.convertedValue, 32000);
  assert.equal(result.rate, 16000);
  assert.equal(result.date, '2026-08-29');
  assert.equal(result.provider, 'Frankfurter');
  assert.equal(result.formula, undefined);
  assert.ok(result.targets.some((target) => target.value === 'USD'));
  assert.ok(result.targets.some((target) => target.value === 'IDR'));
});

test('currency rateOverride avoids fetching a reverse rate', async () => {
  let fetchCalls = 0;

  const result = await convert(
    {
      type: 'currency',
      value: 15926400,
      unit: 'IDR'
    },
    {
      targetCurrency: 'USD',
      rateOverride: 1 / 17696,
      dateOverride: '2026-08-29',
      fetchFn: async () => {
        fetchCalls += 1;
        throw new Error('fetch should not be called');
      }
    }
  );

  assert.equal(fetchCalls, 0);
  assertClose(result.convertedValue, 900, 1e-9);
  assertClose(result.rate, 1 / 17696, 1e-12);
  assert.equal(result.date, '2026-08-29');
  assert.equal(result.provider, 'Frankfurter');
});

test('currency reciprocal rate remains stable across repeated swaps', async () => {
  const originalRate = 17696;

  const forward = await convert(
    {
      type: 'currency',
      value: 900,
      unit: 'USD'
    },
    {
      targetCurrency: 'IDR',
      rateOverride: originalRate,
      dateOverride: '2026-08-29'
    }
  );

  const reverse = await convert(
    {
      type: 'currency',
      value: forward.convertedValue,
      unit: 'IDR'
    },
    {
      targetCurrency: 'USD',
      rateOverride: 1 / forward.rate,
      dateOverride: forward.date
    }
  );

  const forwardAgain = await convert(
    {
      type: 'currency',
      value: reverse.convertedValue,
      unit: 'USD'
    },
    {
      targetCurrency: 'IDR',
      rateOverride: 1 / reverse.rate,
      dateOverride: reverse.date
    }
  );

  assertClose(forward.convertedValue, 15926400, 1e-9);
  assertClose(reverse.convertedValue, 900, 1e-9);
  assertClose(forwardAgain.convertedValue, 15926400, 1e-6);
  assertClose(forwardAgain.rate, originalRate, 1e-9);
  assert.equal(reverse.date, '2026-08-29');
  assert.equal(forwardAgain.date, '2026-08-29');
});

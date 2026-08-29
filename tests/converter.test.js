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

test('currency uses mocked exchange rate', async () => {
  const storage = {
    async get() {
      return {};
    },
    async set() {}
  };

  const fetchFn = async () => ({
    ok: true,
    async json() {
      return {
        rate: 16000,
        date: '2026-08-29'
      };
    }
  });

  const result = await convert(
    {
      type: 'currency',
      value: 2,
      unit: 'USD'
    },
    {
      targetCurrency: 'IDR',
      storage,
      fetchFn
    }
  );

  assert.equal(result.convertedValue, 32000);
  assert.equal(result.provider, 'Frankfurter');
});

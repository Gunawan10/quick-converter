import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSelection } from '../src/utils/selection-parser.js';

const validCases = [
  ['10 km', { type: 'length', value: 10, unit: 'km' }],
  ['10 kilometers', { type: 'length', value: 10, unit: 'km' }],
  ['5 kg', { type: 'weight', value: 5, unit: 'kg' }],
  ['5 pounds', { type: 'weight', value: 5, unit: 'lb' }],
  ['72°F', { type: 'temperature', value: 72, unit: '°F' }],
  ['-10°C', { type: 'temperature', value: -10, unit: '°C' }],
  ['80°R', { type: 'temperature', value: 80, unit: '°R' }],
  ['80 R', { type: 'temperature', value: 80, unit: '°R' }],
  ['80°Ré', { type: 'temperature', value: 80, unit: '°R' }],
  ['80°Re', { type: 'temperature', value: 80, unit: '°R' }],
  ['80 Reaumur', { type: 'temperature', value: 80, unit: '°R' }],
  ['80 Reamur', { type: 'temperature', value: 80, unit: '°R' }],
  ['100 MB', { type: 'data', value: 100, unit: 'MB' }],
  ['100 USD', { type: 'currency', value: 100, unit: 'USD' }],
  ['$100', { type: 'currency', value: 100, unit: 'USD' }],
  ['1.000,50 kg', { type: 'weight', value: 1000.5, unit: 'kg' }]
];

for (const [input, expected] of validCases) {
  test(`parse ${input}`, () => {
    assert.deepEqual(
      parseSelection(input),
      expected
    );
  });
}

const invalidCases = [
  'hello',
  '10 bananas',
  'kg',
  'USD'
];

for (const input of invalidCases) {
  test(`reject ${input}`, () => {
    assert.equal(parseSelection(input), null);
  });
}

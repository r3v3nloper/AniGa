const { test } = require('node:test');
const assert = require('node:assert/strict');
const { parseIntParam } = require('../../utils/sql');

test('parseIntParam parst gültige Integer-Strings', () =>
{
  assert.equal(parseIntParam('42'), 42);
  assert.equal(parseIntParam('0'), 0);
  assert.equal(parseIntParam('-7'), -7);
});

test('parseIntParam liefert null für ungültige Werte', () =>
{
  assert.equal(parseIntParam('abc'), null);
  assert.equal(parseIntParam(''), null);
  assert.equal(parseIntParam(undefined), null);
  assert.equal(parseIntParam(null), null);
});

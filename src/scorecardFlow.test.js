import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCurrency, formatCurrencyInput, paycheckToMonthly, moneyError } from './scorecardFlow.js';
test('paycheck conversion uses each supported frequency', () => {
  assert.equal(paycheckToMonthly(1200,'weekly'),5200); assert.equal(paycheckToMonthly(1200,'biweekly'),2600);
  assert.equal(paycheckToMonthly(1200,'twice'),2400); assert.equal(paycheckToMonthly(1200,'monthly'),1200);
});
test('currency parser handles separators and decimal cents and rejects invalid input', () => {
  assert.equal(parseCurrency('$1,234.56'),1234.56); assert.equal(parseCurrency('0'),0);
  for (const value of ['', '-100','nope','1.2.3','Infinity','1.234','1e3','--1']) assert.ok(Number.isNaN(parseCurrency(value)));
});
test('typing formatter preserves decimal state and groups thousands', () => {
  assert.equal(formatCurrencyInput('12345.60'),'12,345.60'); assert.equal(formatCurrencyInput('1234.'),'1,234.');
  assert.equal(formatCurrencyInput(''),''); assert.equal(formatCurrencyInput('123.456'),null);
});
test('friendly validation enforces finite nonnegative money and positive income', () => {
  assert.match(moneyError(NaN,'needs'),/estimate/); assert.match(moneyError(-1,'savings'),/zero/);
  assert.match(moneyError(0,'income'),/take home/); assert.equal(moneyError(0,'needs'),'');
});

test('paycheck conversion returns cents without confusing twice monthly and biweekly', () => { assert.equal(paycheckToMonthly(1234.56,'biweekly'),2674.88); assert.equal(paycheckToMonthly(1234.56,'twice'),2469.12); });

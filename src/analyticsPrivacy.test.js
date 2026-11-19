import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'acorn';

const forbidden = /income|needs|wants|savings|debt|fund|invest|amount|value/i;
const walk = (node, visit) => {
  if (!node || typeof node !== 'object') return;
  visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach(child => walk(child, visit));
    else if (value && typeof value === 'object') walk(value, visit);
  }
};
const files = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? files(`${dir}/${entry.name}`) : entry.name.endsWith('.js') ? [`${dir}/${entry.name}`] : []);
export const auditAnalytics = source => {
  const failures = [];
  walk(parse(source, { ecmaVersion: 'latest', sourceType: 'module' }), node => {
    if (node.type !== 'CallExpression' || node.callee.name !== 'trackEvent') return;
    const params = node.arguments[1]; if (!params) return;
    if (params.type !== 'ObjectExpression') { failures.push('Parameters must be inspectable object literals'); return; }
    walk(params, prop => {
      if (prop.type === 'SpreadElement') failures.push('Parameter spreads are not allowed');
      if (prop.type !== 'Property') return;
      const name = prop.key.name ?? prop.key.value;
      if (prop.computed || forbidden.test(String(name))) failures.push(String(name));
    });
  });
  return failures;
};
test('every trackEvent call site in src has no financial parameter names', () => {
  for (const file of files(new URL('.',import.meta.url).pathname)) {
    assert.deepEqual(auditAnalytics(readFileSync(file,'utf8')), [], file);
  }
});
test('analytics guard catches financial keys, aliases via spreads, and dynamic params', () => {
  for (const name of ['income','needs','wants','savings','debtTotal','fund','invested','amount','value']) assert.equal(auditAnalytics(`trackEvent('event', { ${name}: 1 })`).length,1);
  assert.ok(auditAnalytics("trackEvent('event', params)").length);
  assert.ok(auditAnalytics("trackEvent('event', { ...params })").length);
});

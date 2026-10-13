const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync('src/lib/group-activity.ts', 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const target = { exports: {} };
new Function('exports', 'require', 'module', compiled)(target.exports, require, target);
const { groupActivity } = target.exports;
const groups = [{ id: 'a' }, { id: 'b' }];
const messages = { a: [
  { mine: false, createdAt: '2026-10-13T10:00:00Z' },
  { mine: true, createdAt: '2026-10-13T11:00:00Z' },
  { mine: false, createdAt: '2026-10-13T12:00:00Z' },
], removed: [{ mine: false, createdAt: '2026-10-13T12:00:00Z' }] };
assert.deepEqual(groupActivity(groups, messages, {}, false), { unread: { a: 0, b: 0 }, newGroups: [], activeCount: 0 });
assert.deepEqual(groupActivity(groups, messages, {}, true), { unread: { a: 2, b: 0 }, newGroups: ['a', 'b'], activeCount: 2 });
assert.deepEqual(groupActivity(groups, messages, { a: '2026-10-13T10:00:00Z', b: '' }, true), { unread: { a: 1, b: 0 }, newGroups: [], activeCount: 1 });
assert.equal(groupActivity(groups, messages, { a: '2026-10-13T12:00:00Z', b: '' }, true).activeCount, 0);
assert.deepEqual(groupActivity([], messages, {}, true), { unread: {}, newGroups: [], activeCount: 0 });
console.log('Passed: hydration, new membership, own-message exclusion, read watermark, revoked membership.');

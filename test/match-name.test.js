const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const bundle = fs.readFileSync(path.join(__dirname, '../assets/overlay-v2.4.9.js'), 'utf8');
const context = {window: {}, URL, URLSearchParams, Intl, Date, setTimeout, clearTimeout};
vm.createContext(context);
vm.runInContext(bundle.slice(0, bundle.indexOf('  const presentation =')) + '\nglobalThis.api = scoreApi;\n})();', context);

test('optional match name never inherits the generic tournament title', () => {
  for (const name of [undefined, null, '', '   ', '\u200B\u202E']) {
    const state = context.api.normalizeTournament({ name });
    assert.equal(state.matchName, '');
    assert.equal(state.name, 'Mario Kart World - Team Knockout');
  }
});

test('match name uses the existing public name and removes controls', () => {
  const state = context.api.normalizeTournament({ name: '  Copa\u202E MKWKO  ', matchName: 'Wrong source' });
  assert.equal(state.matchName, 'Copa MKWKO');
});

test('match name is bounded without discarding literal markup as display text', () => {
  assert.equal(context.api.normalizeTournament({ name: 'x'.repeat(1000) }).matchName.length, 80);
  assert.equal(context.api.normalizeTournament({ name: '<img src=x>' }).matchName, '<img src=x>');
});

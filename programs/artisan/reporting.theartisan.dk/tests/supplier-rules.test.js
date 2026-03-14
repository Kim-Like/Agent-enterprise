const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveSupplierRuleMatch } = require('../utils/categorizer');

test('resolveSupplierRuleMatch prefers exact over contains', () => {
  const lookup = {
    '1211': {
      exact: [
        { id: 2, supplier_pattern: 'Københavns Bageri ApS', category_name: 'Bread', group_key: 'cafe' },
      ],
      contains: [
        { id: 1, supplier_pattern: 'Bageri', category_name: 'Ingredients', group_key: 'cafe' },
      ],
    },
  };
  const match = resolveSupplierRuleMatch('1211', 'Københavns Bageri ApS', lookup);
  assert.equal(match.id, 2);
  assert.equal(match.category_name, 'Bread');
});

test('resolveSupplierRuleMatch supports contains matching for bank import names', () => {
  const lookup = {
    '1211': {
      exact: [],
      contains: [
        { id: 5, supplier_pattern: 'mushroomalchemy', category_name: 'Tea', group_key: 'cafe' },
      ],
    },
  };
  const match = resolveSupplierRuleMatch('1211', 'www.mushroomalchemy.eu', lookup);
  assert.equal(match.id, 5);
  assert.equal(match.category_name, 'Tea');
});

test('resolveSupplierRuleMatch returns null when no rule matches', () => {
  const lookup = {
    '1815': {
      exact: [{ id: 3, supplier_pattern: 'Microsoft', category_name: 'Admin', group_key: 'admin' }],
      contains: [],
    },
  };
  const match = resolveSupplierRuleMatch('1815', 'Stripe', lookup);
  assert.equal(match, null);
});

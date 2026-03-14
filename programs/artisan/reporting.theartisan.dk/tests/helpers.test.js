const test = require('node:test');
const assert = require('node:assert/strict');

const { monthKeyOffset } = require('../utils/distributionService');
const { computeLabour } = require('../utils/labourService');
const { computeFixedCosts } = require('../utils/fixedCostsService');

test('monthKeyOffset handles year boundaries', () => {
  assert.equal(monthKeyOffset('2026-01', -1), '2025-12');
  assert.equal(monthKeyOffset('2026-12', 1), '2027-01');
});

test('computeLabour applies deduction and role splits', () => {
  const allocations = {
    tabs: { cafe: 50 },
    roles: { cafe: { Operations: 60, Management: 40 } },
    deduction: 100,
  };
  const result = computeLabour(1100, allocations, 'cafe');
  assert.equal(result.total, 500);
  assert.equal(result.categories.Operations.total, 300);
  assert.equal(result.categories.Management.total, 200);
});

test('computeFixedCosts scales totals by selected tab percentage', () => {
  const fixedGroup = {
    label: 'Fixed Costs',
    icon: '🏠',
    total: 1000,
    categories: {
      Rent: { total: 1000, lines: [{ id: '1', amount: 1000 }] },
    },
  };
  const result = computeFixedCosts(fixedGroup, { tabs: { cafe: 25 } }, 'cafe');
  assert.equal(result.total, 250);
  assert.equal(result.categories.Rent.total, 250);
  assert.equal(result.categories.Rent.lines[0].amount, 250);
});

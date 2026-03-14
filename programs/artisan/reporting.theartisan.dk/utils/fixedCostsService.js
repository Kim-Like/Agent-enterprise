const reportingStateStore = require('../services/reportingStateStore');

const DEFAULT_TABS = { cafe: 90, events: 0, b2b: 10, webshop: 0 };

/**
 * Load fixed cost allocation for a specific month (YYYY-MM) or the default.
 */
async function loadFixedAlloc(monthKey) {
  const defaultRecord = (await reportingStateStore.loadFixedAlloc('default')) || { tabs: DEFAULT_TABS };
  const base = defaultRecord.tabs || DEFAULT_TABS;

  if (monthKey) {
    const monthRecord = await reportingStateStore.loadFixedAlloc(monthKey);
    if (monthRecord && monthRecord.tabs) {
      return { tabs: Object.assign({}, DEFAULT_TABS, base, monthRecord.tabs) };
    }
  }

  return { tabs: Object.assign({}, DEFAULT_TABS, base) };
}

/**
 * Save fixed cost allocation to a specific month or to the default.
 */
async function saveFixedAlloc(alloc, monthKey) {
  await reportingStateStore.saveFixedAlloc(alloc, monthKey || 'default');
}

/**
 * Apply stream allocation percentage to a raw fixed cost group.
 * Returns a new group object with scaled totals and line amounts.
 */
function computeFixedCosts(fixedGroup, alloc, tab) {
  if (!fixedGroup || !fixedGroup.total) {
    return { label: 'Fixed Costs', icon: '🏠', total: 0, categories: {}, _rawTotal: 0, _tabPct: 0 };
  }
  const pct = (alloc.tabs[tab] || 0) / 100;
  const categories = {};
  Object.entries(fixedGroup.categories).forEach(([name, data]) => {
    const catTotal = data.total * pct;
    if (catTotal > 0) {
      categories[name] = {
        total: catTotal,
        lines: data.lines.map((line) => ({ ...line, amount: line.amount * pct })),
      };
    }
  });
  return {
    label: fixedGroup.label,
    icon: fixedGroup.icon,
    total: fixedGroup.total * pct,
    categories,
    _rawTotal: fixedGroup.total,
    _tabPct: pct,
  };
}

module.exports = { loadFixedAlloc, saveFixedAlloc, computeFixedCosts };

const reportingStateStore = require('../services/reportingStateStore');

async function loadDistributions() {
  return reportingStateStore.loadDistributions();
}

async function saveDistribution(key, months) {
  await reportingStateStore.saveDistribution(key, months);
}

/**
 * Returns the YYYY-MM key that is `offset` months from `baseKey`.
 * offset = -1 → previous month, -2 → two months ago, etc.
 */
function monthKeyOffset(baseKey, offset) {
  const [year, month] = baseKey.split('-').map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Apply distribution rules to cost groups in-place.
 *
 * @param {Object} groups - Current period cost groups (mutated in-place)
 * @param {Object} distributions - { "groupKey:catName": { months } }
 * @param {Object} historicalGroups - { "YYYY-MM": categorized groups } for previous months
 * @param {string} currentMonthKey - "YYYY-MM" of the current period
 */
function applyDistributions(groups, distributions, historicalGroups, currentMonthKey) {
  if (!Object.keys(distributions).length) return;

  Object.entries(groups).forEach(([groupKey, group]) => {
    if (groupKey === 'labour') return;
    if (!group || !group.categories) return;

    let groupTotalChanged = false;

    Object.entries(group.categories).forEach(([catName, catData]) => {
      const distKey = `${groupKey}:${catName}`;
      const dist = distributions[distKey];
      if (!dist || dist.months <= 1) return;

      const months = dist.months;
      const newLines = catData.lines.map((line) => ({
        ...line,
        amount: line.amount / months,
        _distributed: false,
      }));
      let newTotal = catData.total / months;

      let hasCarryOver = false;
      for (let i = 1; i < months; i += 1) {
        const histKey = monthKeyOffset(currentMonthKey, -i);
        const histGroup = historicalGroups && historicalGroups[histKey];
        if (!histGroup || !histGroup[groupKey]) continue;
        const histCat = histGroup[groupKey].categories && histGroup[groupKey].categories[catName];
        if (!histCat) continue;

        const histShare = histCat.total / months;
        newTotal += histShare;
        histCat.lines.forEach((line) => {
          newLines.push({ ...line, amount: line.amount / months, _distributed: true });
        });
        hasCarryOver = true;
      }

      group.categories[catName] = {
        total: newTotal,
        lines: newLines,
        _months: months,
        _hasCarryOver: hasCarryOver,
      };
      groupTotalChanged = true;
    });

    if (groupTotalChanged) {
      group.total = Object.values(group.categories).reduce((sum, category) => sum + category.total, 0);
    }
  });
}

module.exports = { loadDistributions, saveDistribution, applyDistributions, monthKeyOffset };

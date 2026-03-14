const router = require('express').Router();
const billy  = require('../services/billyService');
const { loadAllocations } = require('../utils/labourService');
const { formatCurrency } = require('../utils/formatters');
const mapping = require('../config/mapping');

function getMonthRange(monthKey) {
  const [year, month] = monthKey.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month, 0);
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(start), endDate: fmt(end) };
}

function buildMonthNav(currentKey) {
  const [cy, cm] = currentKey.split('-').map(Number);
  const now    = new Date();
  const nowKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const months = [];
  for (let i = -4; i <= 1; i++) {
    const d   = new Date(cy, cm - 1 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (key > nowKey) continue;
    months.push({
      key,
      label:  d.toLocaleString('en-GB', { month: 'short', year: 'numeric' }),
      active: key === currentKey,
    });
  }
  return months;
}

// GET /labour — render allocation editor
router.get('/', async (req, res) => {
  if (!process.env.BILLY_API_TOKEN) {
    return res.redirect('/settings?error=no_token');
  }

  const now          = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthKey     = /^\d{4}-\d{2}$/.test(req.query.month) ? req.query.month : defaultMonth;

  let labourTotal = 0;
  let error = null;

  try {
    const range = getMonthRange(monthKey);
    const [accountMap, billLines, daybookLines] = await Promise.all([
      billy.getAccounts(),
      billy.getBillsWithLines(range.startDate, range.endDate),
      billy.getDaybookLinesForRevenue(range.startDate, range.endDate),
    ]);

    const prefix = mapping.labour.accountPrefix;
    const labourAccIds = new Set(
      Object.entries(accountMap)
        .filter(([code]) => code.startsWith(prefix))
        .map(([, acc]) => acc.id)
    );
    billLines.forEach(line => {
      if (labourAccIds.has(line.accountId)) labourTotal += (line.amount || 0);
    });
    daybookLines.forEach(line => {
      if (labourAccIds.has(line.accountId) && line.side === 'debit') labourTotal += (line.amount || 0);
    });
  } catch (err) {
    error = 'Could not load salary data from Billy.';
    console.error('Labour route error:', err.message);
  }

  const allocations = loadAllocations(monthKey);
  res.render('labour', {
    monthKey,
    monthNav: buildMonthNav(monthKey),
    labourGross: labourTotal,
    labourTotal: Math.max(0, labourTotal - (allocations.deduction || 0)),
    allocations,
    labourConfig: mapping.labour,
    error,
    saved: req.query.saved === '1',
    formatCurrency,
  });
});

module.exports = router;

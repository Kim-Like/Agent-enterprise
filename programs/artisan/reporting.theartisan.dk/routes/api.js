const router = require('express').Router();

const billy = require('../services/billyService');
const reportingStateStore = require('../services/reportingStateStore');
const { getAccountSnapshotSummary, syncBillyAccounts } = require('../services/accountSyncService');
const { saveOverride, resolveSupplierRuleMatch } = require('../utils/categorizer');
const { loadAllocations, saveAllocations } = require('../utils/labourService');
const { loadFixedAlloc, saveFixedAlloc } = require('../utils/fixedCostsService');
const { saveDistribution } = require('../utils/distributionService');
const { getRangeForPeriod } = require('../utils/dateUtils');
const mapping = require('../config/mapping');

function parseEnabled(value) {
  if (value === undefined) return undefined;
  if (value === '1' || value === 'true' || value === true) return true;
  if (value === '0' || value === 'false' || value === false) return false;
  return undefined;
}

function normalizeSupplier(name) {
  return String(name || '').trim().toLowerCase();
}

// POST /api/categorize — save a manual category override for a bill line
router.post('/categorize', async (req, res) => {
  const { billLineId, category } = req.body;

  if (!billLineId || !category) {
    return res.status(400).json({ error: 'billLineId and category are required' });
  }

  const validCategories = mapping.allCategories;
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: 'Invalid category', valid: validCategories });
  }

  try {
    await saveOverride(billLineId, category);
    return res.json({ ok: true, billLineId, category });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/labour — save labour allocation percentages + deduction
router.post('/labour', async (req, res) => {
  const { tabs, roles, deduction, month } = req.body;

  if (tabs) {
    const sum = Object.values(tabs).reduce((s, v) => s + Number(v), 0);
    if (Math.abs(sum - 100) > 0.5) {
      return res.status(400).json({ error: 'Tab percentages must sum to 100%', got: sum });
    }
  }

  if (roles) {
    for (const [tabKey, roleMap] of Object.entries(roles)) {
      const sum = Object.values(roleMap).reduce((s, v) => s + Number(v), 0);
      if (Math.abs(sum - 100) > 0.5) {
        return res.status(400).json({ error: `Roles for ${tabKey} must sum to 100%`, got: sum });
      }
    }
  }

  try {
    const monthKey = (month && /^\d{4}-\d{2}$/.test(month)) ? month : null;
    const current = await loadAllocations(monthKey);
    const updated = {
      tabs: tabs
        ? Object.fromEntries(Object.entries(tabs).map(([k, v]) => [k, Number(v)]))
        : current.tabs,
      roles: roles
        ? Object.fromEntries(Object.entries(roles).map(([tk, rm]) => [
            tk,
            Object.fromEntries(Object.entries(rm || {}).map(([rk, rv]) => [rk, Number(rv)])),
          ]))
        : current.roles,
      deduction: deduction !== undefined ? Math.max(0, Number(deduction)) : current.deduction,
    };
    await saveAllocations(updated, monthKey);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/fixed-costs — save fixed cost stream allocation
router.post('/fixed-costs', async (req, res) => {
  const { tabs, month } = req.body;

  if (!tabs) {
    return res.status(400).json({ error: 'tabs is required' });
  }

  const sum = Object.values(tabs).reduce((s, v) => s + Number(v), 0);
  if (Math.abs(sum - 100) > 0.5) {
    return res.status(400).json({ error: 'Tab percentages must sum to 100%', got: sum });
  }

  try {
    const monthKey = (month && /^\d{4}-\d{2}$/.test(month)) ? month : null;
    const alloc = { tabs: Object.fromEntries(Object.entries(tabs).map(([k, v]) => [k, Number(v)])) };
    await saveFixedAlloc(alloc, monthKey);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/distribution — save distribution months for a cost category
router.post('/distribution', async (req, res) => {
  const { groupKey, category, months } = req.body;

  if (!groupKey || !category) {
    return res.status(400).json({ error: 'groupKey and category are required' });
  }

  const monthsNum = Number(months) || 1;
  if (monthsNum < 1 || monthsNum > 24) {
    return res.status(400).json({ error: 'months must be between 1 and 24' });
  }

  try {
    await saveDistribution(`${groupKey}:${category}`, monthsNum);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/accounts — account snapshot + mapping summary
router.get('/accounts', async (req, res) => {
  try {
    const summary = await getAccountSnapshotSummary();
    return res.json(summary);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/accounts/sync — force refresh account snapshot from Billy
router.post('/accounts/sync', async (req, res) => {
  try {
    const force = req.body && req.body.force === false ? false : true;
    const sync = await syncBillyAccounts({ force, syncType: 'api' });
    const summary = await getAccountSnapshotSummary();
    return res.json({
      ok: true,
      synced_at: sync.synced_at,
      inserted: sync.inserted,
      updated: sync.updated,
      total_accounts: sync.total_accounts,
      warnings: sync.warnings || [],
      summary,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/supplier-rules/suggestions
router.get('/supplier-rules/suggestions', async (req, res) => {
  const period = ['weekly', 'monthly', 'yearly'].includes(req.query.period) ? req.query.period : 'monthly';
  const offset = Math.min(0, parseInt(req.query.offset || '0', 10) || 0);
  const accountNoFilter = req.query.account_no ? String(req.query.account_no) : null;
  const { startDate, endDate } = getRangeForPeriod(period, offset);

  try {
    const [accountMap, billLines, rulesLookup] = await Promise.all([
      billy.getAccounts(),
      billy.getBillsWithLines(startDate, endDate),
      reportingStateStore.getSupplierRulesForMatching(),
    ]);

    const accountNoById = {};
    Object.entries(accountMap).forEach(([accountNo, account]) => {
      accountNoById[account.id] = String(accountNo);
    });

    const suggestions = {};
    (billLines || []).forEach((line) => {
      const accountNo = accountNoById[line.accountId];
      if (!accountNo) return;
      if (accountNoFilter && accountNoFilter !== accountNo) return;
      const amount = Number(line.amount || 0);
      if (!amount) return;

      const supplierName = String(line.contactName || line.description || '').trim();
      if (!supplierName) return;

      if (resolveSupplierRuleMatch(accountNo, supplierName, rulesLookup || {})) return;

      const key = `${accountNo}::${normalizeSupplier(supplierName)}`;
      if (!suggestions[key]) {
        suggestions[key] = {
          supplier_name: supplierName,
          account_no: accountNo,
          total_amount: 0,
          occurrences: 0,
          sample_bill_line_ids: [],
        };
      }
      suggestions[key].total_amount += amount;
      suggestions[key].occurrences += 1;
      if (suggestions[key].sample_bill_line_ids.length < 5 && line.id) {
        suggestions[key].sample_bill_line_ids.push(line.id);
      }
    });

    const items = Object.values(suggestions).sort((a, b) => {
      return Math.abs(b.total_amount) - Math.abs(a.total_amount);
    });
    return res.json({ suggestions: items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/supplier-rules
router.get('/supplier-rules', async (req, res) => {
  try {
    const filters = {
      account_no: req.query.account_no ? String(req.query.account_no) : undefined,
      group_key: req.query.group_key ? String(req.query.group_key) : undefined,
      enabled: parseEnabled(req.query.enabled),
    };
    const rules = await reportingStateStore.listSupplierRules(filters);
    return res.json({ rules });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/supplier-rules
router.post('/supplier-rules', async (req, res) => {
  const payload = req.body || {};
  if (!payload.account_no || !payload.group_key || !payload.category_name || !payload.supplier_pattern) {
    return res.status(400).json({
      error: 'account_no, group_key, category_name, supplier_pattern are required',
    });
  }
  if (payload.match_type && !['exact', 'contains'].includes(String(payload.match_type))) {
    return res.status(400).json({ error: 'match_type must be exact or contains' });
  }

  try {
    const rule = await reportingStateStore.createSupplierRule(payload);
    return res.json({ ok: true, rule });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /api/supplier-rules/:ruleId
router.patch('/supplier-rules/:ruleId', async (req, res) => {
  const ruleId = Number(req.params.ruleId);
  if (!Number.isFinite(ruleId) || ruleId <= 0) {
    return res.status(400).json({ error: 'invalid rule id' });
  }

  if (req.body && req.body.match_type && !['exact', 'contains'].includes(String(req.body.match_type))) {
    return res.status(400).json({ error: 'match_type must be exact or contains' });
  }

  try {
    const rule = await reportingStateStore.updateSupplierRule(ruleId, req.body || {});
    if (!rule) return res.status(404).json({ error: 'rule not found' });
    return res.json({ ok: true, rule });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/supplier-rules/:ruleId
router.delete('/supplier-rules/:ruleId', async (req, res) => {
  const ruleId = Number(req.params.ruleId);
  if (!Number.isFinite(ruleId) || ruleId <= 0) {
    return res.status(400).json({ error: 'invalid rule id' });
  }

  try {
    const ok = await reportingStateStore.deleteSupplierRule(ruleId);
    if (!ok) return res.status(404).json({ error: 'rule not found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

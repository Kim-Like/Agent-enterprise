const mapping = require('../config/mapping');
const reportingStateStore = require('../services/reportingStateStore');

async function loadOverrides() {
  return reportingStateStore.loadOverrides();
}

async function saveOverride(billLineId, category) {
  await reportingStateStore.saveOverride(billLineId, category);
}

function normName(name) {
  return String(name || '').trim().toLowerCase();
}

function normalizeDbRuleLookup(rawLookup) {
  const out = {};
  Object.entries(rawLookup || {}).forEach(([accountNo, types]) => {
    const exact = (types && types.exact ? types.exact : []).map((rule) => ({
      ...rule,
      _patternNorm: normName(rule.supplier_pattern),
    }));
    const contains = (types && types.contains ? types.contains : []).map((rule) => ({
      ...rule,
      _patternNorm: normName(rule.supplier_pattern),
    }));
    out[String(accountNo)] = { exact, contains };
  });
  return out;
}

function resolveSupplierRuleMatch(accountNo, supplierName, ruleLookup) {
  const bucket = ruleLookup && ruleLookup[String(accountNo)];
  if (!bucket) return null;
  const supplierNorm = normName(supplierName);
  if (!supplierNorm) return null;

  const exact = (bucket.exact || []).find((rule) => {
    const patternNorm = rule._patternNorm || normName(rule.supplier_pattern);
    return patternNorm === supplierNorm;
  });
  if (exact) return exact;

  const contains = (bucket.contains || []).find((rule) => {
    const patternNorm = rule._patternNorm || normName(rule.supplier_pattern);
    return patternNorm.length >= 2 && supplierNorm.includes(patternNorm);
  });
  return contains || null;
}

function buildLegacySupplierLookup() {
  const lookup = {};
  const costs = mapping.costs;

  Object.entries(costs.cafe.categories).forEach(([category, suppliers]) => {
    suppliers.forEach((name) => {
      lookup[normName(name)] = { groupKey: 'cafe', category };
    });
  });
  Object.entries(costs.admin.categories).forEach(([category, suppliers]) => {
    suppliers.forEach((name) => {
      lookup[normName(name)] = { groupKey: 'admin', category };
    });
  });

  return lookup;
}

const legacySupplierLookup = buildLegacySupplierLookup();

function matchLegacySupplier(supplierName) {
  const normalized = normName(supplierName);
  if (legacySupplierLookup[normalized]) return legacySupplierLookup[normalized];
  const key = Object.keys(legacySupplierLookup).find((k) => k.length >= 4 && normalized.includes(k));
  return key ? legacySupplierLookup[key] : null;
}

function buildAccountLookup(accountMap) {
  const lookup = {};
  const costs = mapping.costs;

  Object.entries(costs.coffee.byAccount).forEach(([code, category]) => {
    const account = accountMap[code];
    if (account) lookup[account.id] = { groupKey: 'coffee', category };
  });

  Object.entries(costs.admin.extraAccounts || {}).forEach(([code, category]) => {
    const account = accountMap[code];
    if (account) lookup[account.id] = { groupKey: 'admin', category };
  });

  const accounting = accountMap[costs.accounting.account];
  if (accounting) lookup[accounting.id] = { groupKey: 'accounting', category: costs.accounting.label };

  Object.entries(costs.fixed.byAccount).forEach(([code, category]) => {
    const account = accountMap[code];
    if (account) lookup[account.id] = { groupKey: 'fixed', category };
  });

  Object.entries(costs.webshop.byAccount).forEach(([code, category]) => {
    const account = accountMap[code];
    if (account) lookup[account.id] = { groupKey: 'webshop', category };
  });

  Object.entries(costs.other.byAccount).forEach(([code, category]) => {
    const account = accountMap[code];
    if (account) lookup[account.id] = { groupKey: 'other', category };
  });

  return lookup;
}

function buildIgnoreSet(accountMap) {
  const ignore = new Set();
  mapping.ignore.forEach((code) => {
    const account = accountMap[code];
    if (account) ignore.add(account.id);
  });

  const prefix = mapping.labour.accountPrefix;
  if (prefix) {
    Object.entries(accountMap).forEach(([code, account]) => {
      if (String(code).startsWith(prefix)) ignore.add(account.id);
    });
  }
  return ignore;
}

function getCafeAccountId(accountMap) {
  const account = accountMap[mapping.costs.cafe.account];
  return account ? account.id : null;
}

function getAdminAccountId(accountMap) {
  const account = accountMap[mapping.costs.admin.account];
  return account ? account.id : null;
}

function buildAccountCodeById(accountMap, syncedMapById) {
  const byId = {};
  Object.entries(accountMap || {}).forEach(([accountNo, account]) => {
    if (account && account.id) byId[account.id] = String(accountNo);
  });
  Object.entries(syncedMapById || {}).forEach(([accountId, accountNo]) => {
    if (!byId[accountId]) byId[accountId] = String(accountNo);
  });
  return byId;
}

function addToGroup(groups, groupKey, category, amount, lineId, supplierName, date) {
  if (!groups[groupKey]) return;
  groups[groupKey].total += amount;
  if (!groups[groupKey].categories[category]) {
    groups[groupKey].categories[category] = { total: 0, lines: [] };
  }
  groups[groupKey].categories[category].total += amount;
  groups[groupKey].categories[category].lines.push({ id: lineId, supplierName, amount, date });
}

function findGroupForCategory(categoryName) {
  const costs = mapping.costs;
  if (Object.keys(costs.cafe.categories).includes(categoryName)) return 'cafe';
  if (Object.values(costs.coffee.byAccount).includes(categoryName)) return 'coffee';
  if (Object.keys(costs.admin.categories).includes(categoryName)) return 'admin';
  if (categoryName === costs.accounting.label) return 'accounting';
  if (Object.values(costs.fixed.byAccount).includes(categoryName)) return 'fixed';
  if (Object.values(costs.webshop.byAccount).includes(categoryName)) return 'webshop';
  if (Object.values(costs.other.byAccount).includes(categoryName)) return 'other';
  return 'other';
}

function initializeGroups() {
  const groups = {};
  ['cafe', 'coffee', 'admin', 'accounting', 'fixed', 'webshop', 'other'].forEach((key) => {
    const def = mapping.costs[key];
    groups[key] = {
      label: def.label,
      icon: def.icon || '📁',
      total: 0,
      categories: {},
    };
  });
  return groups;
}

function resolveFixedSubLabel(accountMap, accountId, supplierName, fallbackCategory) {
  const subLabels = mapping.costs.fixed.subLabels || {};
  const accountCode = Object.keys(accountMap).find((code) => accountMap[code].id === accountId);
  const labelMap = accountCode ? subLabels[accountCode] : null;
  if (!labelMap) return fallbackCategory;
  const supplierNorm = normName(supplierName);
  const exactKey = Object.keys(labelMap).find((name) => normName(name) === supplierNorm);
  return exactKey ? labelMap[exactKey] : fallbackCategory;
}

/**
 * Categorize bill lines into grouped costs + uncategorized list.
 * Precedence:
 * 1) manual override
 * 2) DB supplier rules (exact then contains)
 * 3) legacy mapping fallback (supplier + by-account)
 * 4) uncategorized
 */
async function categorizeBillLines(billLines, accountMap) {
  const [overrides, syncedMapById, rawDbRules] = await Promise.all([
    loadOverrides(),
    reportingStateStore.getAccountNoMapById().catch(() => ({})),
    reportingStateStore.getSupplierRulesForMatching().catch(() => ({})),
  ]);

  const ruleLookup = normalizeDbRuleLookup(rawDbRules);
  const accountCodeById = buildAccountCodeById(accountMap, syncedMapById);
  const accountLookup = buildAccountLookup(accountMap);
  const ignoreSet = buildIgnoreSet(accountMap);
  const cafeAccountId = getCafeAccountId(accountMap);
  const adminAccountId = getAdminAccountId(accountMap);

  const groups = initializeGroups();
  const uncategorized = [];

  (billLines || []).forEach((line) => {
    const amount = line.amount || 0;
    if (!amount) return;

    const accountId = line.accountId || (line.account && line.account.id);
    const supplierName = line.contactName || line.description || 'Unknown';
    const lineDate = line.entryDate || line.date || '';
    const accountNo = accountCodeById[accountId];

    if (ignoreSet.has(accountId)) return;

    if (overrides[line.id]) {
      const category = overrides[line.id];
      const groupKey = findGroupForCategory(category);
      addToGroup(groups, groupKey, category, amount, line.id, supplierName, lineDate);
      return;
    }

    if (accountNo) {
      const matchedRule = resolveSupplierRuleMatch(accountNo, supplierName, ruleLookup);
      if (matchedRule) {
        addToGroup(
          groups,
          matchedRule.group_key,
          matchedRule.category_name,
          amount,
          line.id,
          supplierName,
          lineDate
        );
        return;
      }
    }

    if (accountId === cafeAccountId) {
      const match = matchLegacySupplier(supplierName);
      if (match && match.groupKey === 'cafe') {
        addToGroup(groups, 'cafe', match.category, amount, line.id, supplierName, lineDate);
        return;
      }
      uncategorized.push({ id: line.id, supplierName, amount, description: line.description, date: lineDate });
      return;
    }

    if (accountId === adminAccountId) {
      const match = matchLegacySupplier(supplierName);
      if (match && match.groupKey === 'admin') {
        addToGroup(groups, 'admin', match.category, amount, line.id, supplierName, lineDate);
        return;
      }
      uncategorized.push({ id: line.id, supplierName, amount, description: line.description, date: lineDate });
      return;
    }

    if (accountLookup[accountId]) {
      const { groupKey, category } = accountLookup[accountId];
      if (groupKey === 'fixed') {
        const fixedLabel = resolveFixedSubLabel(accountMap, accountId, supplierName, category);
        addToGroup(groups, 'fixed', fixedLabel, amount, line.id, supplierName, lineDate);
      } else {
        addToGroup(groups, groupKey, category, amount, line.id, supplierName, lineDate);
      }
      return;
    }

    uncategorized.push({ id: line.id, supplierName, amount, description: line.description, date: lineDate });
  });

  return { groups, uncategorized };
}

/**
 * Aggregate revenue from two sources:
 * - daybookLines: credit-side entries on known revenue accounts
 * - invoices: approved invoice totals counted as b2b_dk revenue
 */
function aggregateRevenue(daybookLines, invoices, accountMap) {
  const rev = mapping.revenue;
  const result = { cafe: 0, events: 0, webshop: 0, b2b_dk: 0, b2b_eu: 0, total: 0 };

  const streamMap = {};
  Object.entries(rev).forEach(([key, code]) => {
    const account = accountMap[code];
    if (account) streamMap[account.id] = key;
  });

  (daybookLines || []).forEach((line) => {
    if (line.side !== 'credit') return;
    const stream = streamMap[line.accountId];
    if (!stream) return;
    const amount = line.amount || 0;
    result[stream] = (result[stream] || 0) + amount;
    result.total += amount;
  });

  (invoices || []).forEach((invoice) => {
    const amount = invoice.amount || 0;
    result.b2b_dk += amount;
    result.total += amount;
  });

  return result;
}

module.exports = {
  aggregateRevenue,
  categorizeBillLines,
  loadOverrides,
  resolveSupplierRuleMatch,
  saveOverride,
};

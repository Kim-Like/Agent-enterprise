const billy = require('./billyService');
const reportingStateStore = require('./reportingStateStore');
const mapping = require('../config/mapping');

function getRequiredAccountNosFromMapping() {
  const required = new Set();

  Object.values(mapping.revenue || {}).forEach((code) => required.add(String(code)));

  const costs = mapping.costs || {};
  if (costs.cafe && costs.cafe.account) required.add(String(costs.cafe.account));
  if (costs.admin && costs.admin.account) required.add(String(costs.admin.account));
  if (costs.accounting && costs.accounting.account) required.add(String(costs.accounting.account));

  [costs.coffee, costs.fixed, costs.webshop, costs.other].forEach((group) => {
    Object.keys((group && group.byAccount) || {}).forEach((code) => required.add(String(code)));
  });
  Object.keys((costs.admin && costs.admin.extraAccounts) || {}).forEach((code) => required.add(String(code)));
  (mapping.ignore || []).forEach((code) => required.add(String(code)));

  return Array.from(required).sort();
}

async function syncBillyAccounts(options) {
  const force = !options || options.force !== false;
  const syncType = (options && options.syncType) || 'manual';
  const rows = await billy.getAccountsSnapshotRows({ force });
  const result = await reportingStateStore.upsertAccounts(rows, {
    syncType,
    deactivateMissing: true,
  });
  return {
    ...result,
    synced_at: new Date().toISOString(),
    warnings: [],
  };
}

async function getAccountSnapshotSummary() {
  const [accounts, mappedAccountNos, latestSync] = await Promise.all([
    reportingStateStore.listAccounts(),
    reportingStateStore.getMappedAccountNos(),
    reportingStateStore.getLatestSyncInfo(),
  ]);

  const activeAccounts = accounts.filter((row) => row.is_active);
  const mappedAccounts = activeAccounts.filter((row) => mappedAccountNos.has(row.account_no));
  const requiredAccountNos = getRequiredAccountNosFromMapping();
  const missingRequired = requiredAccountNos.filter((accountNo) => {
    return !activeAccounts.some((row) => row.account_no === accountNo);
  });
  const lastSyncedAt = latestSync && latestSync.last_synced_at ? latestSync.last_synced_at : null;
  const stale = !lastSyncedAt;

  return {
    synced_at: lastSyncedAt,
    stale,
    total_accounts: activeAccounts.length,
    mapped_accounts: mappedAccounts.length,
    unmapped_accounts: Math.max(activeAccounts.length - mappedAccounts.length, 0),
    missing_required_account_nos: missingRequired,
    accounts: activeAccounts.map((row) => ({
      account_id: row.account_id,
      account_no: row.account_no,
      account_name: row.account_name,
      is_active: row.is_active,
      is_mapped: mappedAccountNos.has(row.account_no),
    })),
  };
}

module.exports = {
  getAccountSnapshotSummary,
  getRequiredAccountNosFromMapping,
  syncBillyAccounts,
};

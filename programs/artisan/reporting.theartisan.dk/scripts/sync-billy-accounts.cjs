const { loadEnv } = require('../config/loadEnv');
loadEnv();

const { syncBillyAccounts, getAccountSnapshotSummary } = require('../services/accountSyncService');
const { pool } = require('../db/mysql');

function hasFlag(flag) {
  return process.argv.slice(2).includes(flag);
}

async function main() {
  try {
    const force = !hasFlag('--no-force');
    const result = await syncBillyAccounts({ force, syncType: 'cli' });
    const summary = await getAccountSnapshotSummary();
    console.log(JSON.stringify({
      ok: true,
      sync: result,
      summary: {
        synced_at: summary.synced_at,
        total_accounts: summary.total_accounts,
        mapped_accounts: summary.mapped_accounts,
        unmapped_accounts: summary.unmapped_accounts,
        missing_required_account_nos: summary.missing_required_account_nos,
      },
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Account sync failed:', err.message || err);
  process.exit(1);
});

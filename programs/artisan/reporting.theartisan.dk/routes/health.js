const router = require('express').Router();
const { pingDatabase } = require('../db/mysql');
const { getAccountSnapshotSummary } = require('../services/accountSyncService');

router.get('/', async (req, res) => {
  const timestamp = new Date().toISOString();

  try {
    const db = await pingDatabase();
    let accountSync = {
      status: 'unknown',
      last_synced_at: null,
      stale: true,
      total_accounts: 0,
      mapped_accounts: 0,
      missing_required_account_nos: [],
    };
    try {
      const summary = await getAccountSnapshotSummary();
      accountSync = {
        status: summary.stale ? 'stale' : 'ok',
        last_synced_at: summary.synced_at,
        stale: summary.stale,
        total_accounts: summary.total_accounts,
        mapped_accounts: summary.mapped_accounts,
        missing_required_account_nos: summary.missing_required_account_nos,
      };
    } catch (err) {
      accountSync = {
        status: 'error',
        last_synced_at: null,
        stale: true,
        total_accounts: 0,
        mapped_accounts: 0,
        missing_required_account_nos: [],
        error: err.message || 'account sync unavailable',
      };
    }

    return res.json({
      status: 'ok',
      timestamp,
      datastore: 'mysql_cpanel',
      database: {
        status: 'ok',
        host: db.host,
        port: db.port,
        name: db.database,
      },
      account_sync: accountSync,
    });
  } catch (err) {
    return res.status(503).json({
      status: 'degraded',
      timestamp,
      datastore: 'mysql_cpanel',
      database: {
        status: 'error',
        error: err.message || 'Database unavailable',
      },
      account_sync: {
        status: 'error',
        stale: true,
      },
    });
  }
});

module.exports = router;

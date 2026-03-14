const router = require('express').Router();

const { getAccountSnapshotSummary } = require('../services/accountSyncService');
const reportingStateStore = require('../services/reportingStateStore');

router.get('/', async (req, res) => {
  try {
    const [accountSummary, rules] = await Promise.all([
      getAccountSnapshotSummary(),
      reportingStateStore.listSupplierRules({}),
    ]);

    return res.render('rules', {
      accountSummary,
      rules,
    });
  } catch (err) {
    return res.status(500).render('rules', {
      accountSummary: {
        synced_at: null,
        stale: true,
        total_accounts: 0,
        mapped_accounts: 0,
        unmapped_accounts: 0,
        missing_required_account_nos: [],
        accounts: [],
      },
      rules: [],
      error: err.message || 'Failed to load rule management view',
    });
  }
});

module.exports = router;

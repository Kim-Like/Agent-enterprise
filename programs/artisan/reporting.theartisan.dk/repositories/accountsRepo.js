const { pool } = require('../db/mysql');

function normalizeAccount(input) {
  return {
    account_id: String(input.account_id || input.id || ''),
    account_no: String(input.account_no || input.accountNo || ''),
    account_name: String(input.account_name || input.accountName || input.name || ''),
    is_active: input.is_active === 0 || input.isActive === false ? 0 : 1,
    raw_json: JSON.stringify(input.raw_json || input.raw || input),
  };
}

async function listAccounts() {
  const [rows] = await pool.query(
    'SELECT account_id, account_no, account_name, is_active, last_synced_at '
      + 'FROM reporting_billy_accounts ORDER BY CAST(account_no AS UNSIGNED), account_no'
  );
  return rows.map((row) => ({
    account_id: row.account_id,
    account_no: row.account_no,
    account_name: row.account_name,
    is_active: Number(row.is_active) === 1,
    last_synced_at: row.last_synced_at,
  }));
}

async function getAccountNoMapById() {
  const [rows] = await pool.query(
    'SELECT account_id, account_no FROM reporting_billy_accounts WHERE is_active = 1'
  );
  const map = {};
  rows.forEach((row) => {
    map[row.account_id] = row.account_no;
  });
  return map;
}

async function getLatestSyncInfo() {
  const [[latestLog]] = await pool.query(
    'SELECT id, sync_type, status, details_json, created_at '
      + 'FROM reporting_account_sync_log ORDER BY id DESC LIMIT 1'
  );
  const [[latestAccount]] = await pool.query(
    'SELECT MAX(last_synced_at) AS last_synced_at, COUNT(*) AS total_accounts, '
      + 'SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_accounts '
      + 'FROM reporting_billy_accounts'
  );
  return {
    log: latestLog || null,
    last_synced_at: latestAccount && latestAccount.last_synced_at ? latestAccount.last_synced_at : null,
    total_accounts: Number((latestAccount && latestAccount.total_accounts) || 0),
    active_accounts: Number((latestAccount && latestAccount.active_accounts) || 0),
  };
}

async function logSync(syncType, status, details) {
  await pool.query(
    'INSERT INTO reporting_account_sync_log (sync_type, status, details_json) VALUES (?, ?, ?)',
    [String(syncType || 'manual'), String(status || 'success'), JSON.stringify(details || {})]
  );
}

async function upsertAccounts(accounts, options) {
  const syncType = (options && options.syncType) || 'manual';
  const deactivateMissing = !options || options.deactivateMissing !== false;
  const normalized = (accounts || []).map(normalizeAccount).filter((row) => row.account_id && row.account_no);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [existingRows] = await connection.query(
      'SELECT account_id FROM reporting_billy_accounts'
    );
    const existingIds = new Set(existingRows.map((row) => row.account_id));

    let inserted = 0;
    let updated = 0;
    for (const row of normalized) {
      if (existingIds.has(row.account_id)) {
        updated += 1;
      } else {
        inserted += 1;
      }
      await connection.query(
        'INSERT INTO reporting_billy_accounts '
          + '(account_id, account_no, account_name, is_active, raw_json, last_synced_at) '
          + 'VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) '
          + 'ON DUPLICATE KEY UPDATE '
          + 'account_no = VALUES(account_no), '
          + 'account_name = VALUES(account_name), '
          + 'is_active = VALUES(is_active), '
          + 'raw_json = VALUES(raw_json), '
          + 'last_synced_at = CURRENT_TIMESTAMP',
        [row.account_id, row.account_no, row.account_name, row.is_active, row.raw_json]
      );
    }

    if (deactivateMissing) {
      if (normalized.length > 0) {
        const placeholders = normalized.map(() => '?').join(',');
        await connection.query(
          `UPDATE reporting_billy_accounts SET is_active = 0 WHERE account_id NOT IN (${placeholders})`,
          normalized.map((row) => row.account_id)
        );
      } else {
        await connection.query('UPDATE reporting_billy_accounts SET is_active = 0');
      }
    }

    const details = {
      inserted,
      updated,
      total_accounts: normalized.length,
      deactivate_missing: deactivateMissing,
    };
    await connection.query(
      'INSERT INTO reporting_account_sync_log (sync_type, status, details_json) VALUES (?, ?, ?)',
      [String(syncType), 'success', JSON.stringify(details)]
    );
    await connection.commit();
    return details;
  } catch (err) {
    await connection.rollback();
    await logSync(syncType, 'failed', { error: String(err.message || err) });
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = {
  listAccounts,
  getAccountNoMapById,
  getLatestSyncInfo,
  logSync,
  upsertAccounts,
};

const fs = require('fs');
const path = require('path');

const { loadEnv } = require('../config/loadEnv');
loadEnv();

const { pool } = require('../db/mysql');

const DATA_DIR = path.join(__dirname, '..', 'data');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureBackupDir() {
  const stamp = new Date().toISOString().replace(/[.:]/g, '-');
  const backupDir = path.join(DATA_DIR, `backup-${stamp}`);
  fs.mkdirSync(backupDir, { recursive: true });
  return backupDir;
}

function normalizeLabour(raw) {
  if (raw && raw.default) return raw;
  return {
    default: {
      tabs: (raw && raw.tabs) || {},
      roles: (raw && raw.roles) || {},
      deduction: Number((raw && raw.deduction) || 0),
    },
    months: {},
  };
}

function normalizeFixed(raw) {
  if (raw && raw.default) return raw;
  return {
    default: {
      tabs: (raw && raw.tabs) || {},
    },
    months: {},
  };
}

function normalizeDistributions(raw) {
  const out = {};
  Object.entries(raw || {}).forEach(([key, value]) => {
    const months = Number(value && value.months !== undefined ? value.months : value);
    if (Number.isFinite(months) && months > 1) {
      out[key] = { months: Math.max(2, Math.min(24, months)) };
    }
  });
  return out;
}

async function upsertMigrationAudit(connection, status, details) {
  await connection.query(
    'INSERT INTO reporting_migration_audit (migration_name, status, details_json) VALUES (?, ?, ?)',
    ['json_to_mysql_one_shot', status, JSON.stringify(details)]
  );
}

async function main() {
  const overridesPath = path.join(DATA_DIR, 'overrides.json');
  const labourPath = path.join(DATA_DIR, 'labour.json');
  const fixedPath = path.join(DATA_DIR, 'fixed-costs.json');
  const distPath = path.join(DATA_DIR, 'distributions.json');

  const backupDir = ensureBackupDir();
  [overridesPath, labourPath, fixedPath, distPath].forEach((source) => {
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, path.join(backupDir, path.basename(source)));
    }
  });

  const overrides = readJson(overridesPath, {});
  const labour = normalizeLabour(readJson(labourPath, {}));
  const fixed = normalizeFixed(readJson(fixedPath, {}));
  const distributions = normalizeDistributions(readJson(distPath, {}));

  const connection = await pool.getConnection();
  const details = {
    backup_dir: backupDir,
    overrides_count: 0,
    labour_rows: 0,
    fixed_rows: 0,
    distribution_rows: 0,
  };

  try {
    await connection.beginTransaction();

    for (const [billLineId, category] of Object.entries(overrides)) {
      await connection.query(
        'INSERT INTO reporting_category_overrides (bill_line_id, category) VALUES (?, ?) '
          + 'ON DUPLICATE KEY UPDATE category = VALUES(category), updated_at = CURRENT_TIMESTAMP',
        [String(billLineId), String(category)]
      );
      details.overrides_count += 1;
    }

    const labourRows = [{ month_key: 'default', value: labour.default }];
    Object.entries(labour.months || {}).forEach(([monthKey, value]) => {
      if (/^\d{4}-\d{2}$/.test(monthKey)) labourRows.push({ month_key: monthKey, value });
    });

    for (const row of labourRows) {
      const payload = row.value || {};
      await connection.query(
        'INSERT INTO reporting_labour_allocations (month_key, tabs_json, roles_json, deduction) VALUES (?, ?, ?, ?) '
          + 'ON DUPLICATE KEY UPDATE tabs_json = VALUES(tabs_json), roles_json = VALUES(roles_json), '
          + 'deduction = VALUES(deduction), updated_at = CURRENT_TIMESTAMP',
        [
          row.month_key,
          JSON.stringify(payload.tabs || {}),
          JSON.stringify(payload.roles || {}),
          Number(payload.deduction || 0),
        ]
      );
      details.labour_rows += 1;
    }

    const fixedRows = [{ month_key: 'default', value: fixed.default }];
    Object.entries(fixed.months || {}).forEach(([monthKey, value]) => {
      if (/^\d{4}-\d{2}$/.test(monthKey)) fixedRows.push({ month_key: monthKey, value });
    });

    for (const row of fixedRows) {
      const payload = row.value || {};
      await connection.query(
        'INSERT INTO reporting_fixed_cost_allocations (month_key, tabs_json) VALUES (?, ?) '
          + 'ON DUPLICATE KEY UPDATE tabs_json = VALUES(tabs_json), updated_at = CURRENT_TIMESTAMP',
        [row.month_key, JSON.stringify(payload.tabs || {})]
      );
      details.fixed_rows += 1;
    }

    for (const [ruleKey, payload] of Object.entries(distributions)) {
      await connection.query(
        'INSERT INTO reporting_distribution_rules (rule_key, months) VALUES (?, ?) '
          + 'ON DUPLICATE KEY UPDATE months = VALUES(months), updated_at = CURRENT_TIMESTAMP',
        [ruleKey, Number(payload.months)]
      );
      details.distribution_rows += 1;
    }

    await upsertMigrationAudit(connection, 'success', details);
    await connection.commit();

    console.log('Migration completed successfully.');
    console.log(JSON.stringify(details, null, 2));
  } catch (err) {
    await connection.rollback();
    try {
      await upsertMigrationAudit(connection, 'failed', {
        ...details,
        error: String(err.message || err),
      });
    } catch {
      // Ignore audit insert failures after rollback.
    }
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err.message || err);
  process.exit(1);
});

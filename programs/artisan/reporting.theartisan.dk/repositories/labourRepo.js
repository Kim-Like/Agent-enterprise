const { pool } = require('../db/mysql');

function normalizeMonthKey(monthKey) {
  return /^\d{4}-\d{2}$/.test(String(monthKey || '')) ? String(monthKey) : 'default';
}

function parseJson(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

async function loadLabourAlloc(monthKey) {
  const key = normalizeMonthKey(monthKey);
  const [rows] = await pool.query(
    'SELECT tabs_json, roles_json, deduction FROM reporting_labour_allocations WHERE month_key = ? LIMIT 1',
    [key]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    tabs: parseJson(row.tabs_json, {}),
    roles: parseJson(row.roles_json, {}),
    deduction: Number(row.deduction || 0),
  };
}

async function saveLabourAlloc(payload, monthKey) {
  const key = normalizeMonthKey(monthKey);
  const tabs = payload && payload.tabs ? payload.tabs : {};
  const roles = payload && payload.roles ? payload.roles : {};
  const deduction = Number(payload && payload.deduction ? payload.deduction : 0);

  await pool.query(
    'INSERT INTO reporting_labour_allocations (month_key, tabs_json, roles_json, deduction) VALUES (?, ?, ?, ?) '
      + 'ON DUPLICATE KEY UPDATE tabs_json = VALUES(tabs_json), roles_json = VALUES(roles_json), '
      + 'deduction = VALUES(deduction), updated_at = CURRENT_TIMESTAMP',
    [key, JSON.stringify(tabs), JSON.stringify(roles), deduction]
  );
}

module.exports = {
  loadLabourAlloc,
  saveLabourAlloc,
};

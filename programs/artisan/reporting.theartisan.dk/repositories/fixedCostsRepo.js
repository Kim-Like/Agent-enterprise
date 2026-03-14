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

async function loadFixedAlloc(monthKey) {
  const key = normalizeMonthKey(monthKey);
  const [rows] = await pool.query(
    'SELECT tabs_json FROM reporting_fixed_cost_allocations WHERE month_key = ? LIMIT 1',
    [key]
  );
  if (!rows.length) return null;
  return {
    tabs: parseJson(rows[0].tabs_json, {}),
  };
}

async function saveFixedAlloc(payload, monthKey) {
  const key = normalizeMonthKey(monthKey);
  const tabs = payload && payload.tabs ? payload.tabs : {};
  await pool.query(
    'INSERT INTO reporting_fixed_cost_allocations (month_key, tabs_json) VALUES (?, ?) '
      + 'ON DUPLICATE KEY UPDATE tabs_json = VALUES(tabs_json), updated_at = CURRENT_TIMESTAMP',
    [key, JSON.stringify(tabs)]
  );
}

module.exports = {
  loadFixedAlloc,
  saveFixedAlloc,
};

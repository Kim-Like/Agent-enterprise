const { pool } = require('../db/mysql');

async function loadOverrides() {
  const [rows] = await pool.query(
    'SELECT bill_line_id, category FROM reporting_category_overrides ORDER BY bill_line_id'
  );
  const overrides = {};
  rows.forEach((row) => {
    overrides[row.bill_line_id] = row.category;
  });
  return overrides;
}

async function saveOverride(billLineId, category) {
  await pool.query(
    'INSERT INTO reporting_category_overrides (bill_line_id, category) VALUES (?, ?) '
      + 'ON DUPLICATE KEY UPDATE category = VALUES(category), updated_at = CURRENT_TIMESTAMP',
    [String(billLineId), String(category)]
  );
}

module.exports = {
  loadOverrides,
  saveOverride,
};

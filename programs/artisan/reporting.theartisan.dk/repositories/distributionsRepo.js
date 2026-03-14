const { pool } = require('../db/mysql');

async function loadDistributions() {
  const [rows] = await pool.query(
    'SELECT rule_key, months FROM reporting_distribution_rules ORDER BY rule_key'
  );
  const result = {};
  rows.forEach((row) => {
    result[row.rule_key] = { months: Number(row.months || 1) };
  });
  return result;
}

async function saveDistribution(ruleKey, months) {
  const parsedMonths = Number(months) || 1;
  if (parsedMonths <= 1) {
    await pool.query('DELETE FROM reporting_distribution_rules WHERE rule_key = ?', [String(ruleKey)]);
    return;
  }
  const boundedMonths = Math.max(2, Math.min(24, parsedMonths));
  await pool.query(
    'INSERT INTO reporting_distribution_rules (rule_key, months) VALUES (?, ?) '
      + 'ON DUPLICATE KEY UPDATE months = VALUES(months), updated_at = CURRENT_TIMESTAMP',
    [String(ruleKey), boundedMonths]
  );
}

module.exports = {
  loadDistributions,
  saveDistribution,
};

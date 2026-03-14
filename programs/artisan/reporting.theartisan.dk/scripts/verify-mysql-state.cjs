const path = require('path');

const { loadEnv } = require('../config/loadEnv');
loadEnv();

const { pool } = require('../db/mysql');

function parseJson(value, label, errors) {
  try {
    return JSON.parse(value);
  } catch (err) {
    errors.push(`${label}: invalid JSON (${err.message})`);
    return null;
  }
}

async function countRows(table) {
  const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${table}`);
  return Number(rows[0].count || 0);
}

async function main() {
  const errors = [];

  const [labourRows] = await pool.query(
    'SELECT month_key, tabs_json, roles_json FROM reporting_labour_allocations ORDER BY month_key'
  );
  labourRows.forEach((row) => {
    parseJson(row.tabs_json, `reporting_labour_allocations.tabs_json(${row.month_key})`, errors);
    parseJson(row.roles_json, `reporting_labour_allocations.roles_json(${row.month_key})`, errors);
  });

  const [fixedRows] = await pool.query(
    'SELECT month_key, tabs_json FROM reporting_fixed_cost_allocations ORDER BY month_key'
  );
  fixedRows.forEach((row) => {
    parseJson(row.tabs_json, `reporting_fixed_cost_allocations.tabs_json(${row.month_key})`, errors);
  });

  const [distributionRows] = await pool.query(
    'SELECT rule_key, months FROM reporting_distribution_rules ORDER BY rule_key'
  );
  distributionRows.forEach((row) => {
    const months = Number(row.months || 0);
    if (months < 2 || months > 24) {
      errors.push(`reporting_distribution_rules.months(${row.rule_key}) out of range: ${months}`);
    }
  });

  const [auditRows] = await pool.query(
    'SELECT id, details_json FROM reporting_migration_audit ORDER BY id DESC LIMIT 20'
  );
  auditRows.forEach((row) => {
    parseJson(row.details_json, `reporting_migration_audit.details_json(${row.id})`, errors);
  });

  const summary = {
    overrides: await countRows('reporting_category_overrides'),
    labour_allocations: await countRows('reporting_labour_allocations'),
    fixed_allocations: await countRows('reporting_fixed_cost_allocations'),
    distribution_rules: await countRows('reporting_distribution_rules'),
    migration_audit: await countRows('reporting_migration_audit'),
    errors,
  };

  console.log(JSON.stringify(summary, null, 2));

  await pool.end();

  if (errors.length) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error('Verification failed:', err.message || err);
  try {
    await pool.end();
  } catch {
    // ignore
  }
  process.exit(1);
});

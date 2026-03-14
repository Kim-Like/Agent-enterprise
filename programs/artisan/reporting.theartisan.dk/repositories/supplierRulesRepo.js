const { pool } = require('../db/mysql');

const VALID_MATCH_TYPES = new Set(['exact', 'contains']);

function normalizeRule(input) {
  return {
    account_no: String(input.account_no || '').trim(),
    group_key: String(input.group_key || '').trim(),
    category_name: String(input.category_name || '').trim(),
    supplier_pattern: String(input.supplier_pattern || '').trim(),
    match_type: VALID_MATCH_TYPES.has(String(input.match_type || '').trim()) ? String(input.match_type).trim() : 'contains',
    priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 100,
    enabled: input.enabled === undefined ? 1 : (input.enabled ? 1 : 0),
    source: String(input.source || 'manual').trim() || 'manual',
  };
}

function isValidRule(rule) {
  return Boolean(rule.account_no && rule.group_key && rule.category_name && rule.supplier_pattern);
}

async function listRules(filters) {
  const clauses = [];
  const values = [];
  if (filters && filters.account_no) {
    clauses.push('account_no = ?');
    values.push(String(filters.account_no));
  }
  if (filters && filters.group_key) {
    clauses.push('group_key = ?');
    values.push(String(filters.group_key));
  }
  if (filters && filters.enabled !== undefined) {
    clauses.push('enabled = ?');
    values.push(filters.enabled ? 1 : 0);
  }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    'SELECT id, account_no, group_key, category_name, supplier_pattern, match_type, '
      + 'priority, enabled, source, updated_at '
      + `FROM reporting_supplier_rules ${where} `
      + 'ORDER BY account_no, priority, id',
    values
  );
  return rows.map((row) => ({
    id: Number(row.id),
    account_no: row.account_no,
    group_key: row.group_key,
    category_name: row.category_name,
    supplier_pattern: row.supplier_pattern,
    match_type: row.match_type,
    priority: Number(row.priority || 100),
    enabled: Number(row.enabled) === 1,
    source: row.source || 'manual',
    updated_at: row.updated_at,
  }));
}

async function getRulesForMatching() {
  const rows = await listRules({ enabled: true });
  const grouped = {};
  rows.forEach((row) => {
    if (!grouped[row.account_no]) {
      grouped[row.account_no] = { exact: [], contains: [] };
    }
    const key = row.match_type === 'exact' ? 'exact' : 'contains';
    grouped[row.account_no][key].push(row);
  });
  return grouped;
}

async function createRule(input) {
  const normalized = normalizeRule(input);
  if (!isValidRule(normalized)) {
    throw new Error('account_no, group_key, category_name, and supplier_pattern are required');
  }
  const [res] = await pool.query(
    'INSERT INTO reporting_supplier_rules '
      + '(account_no, group_key, category_name, supplier_pattern, match_type, priority, enabled, source) '
      + 'VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [
      normalized.account_no,
      normalized.group_key,
      normalized.category_name,
      normalized.supplier_pattern,
      normalized.match_type,
      normalized.priority,
      normalized.enabled,
      normalized.source,
    ]
  );
  return getRuleById(res.insertId);
}

async function upsertRule(input) {
  const normalized = normalizeRule(input);
  if (!isValidRule(normalized)) {
    throw new Error('account_no, group_key, category_name, and supplier_pattern are required');
  }
  await pool.query(
    'INSERT INTO reporting_supplier_rules '
      + '(account_no, group_key, category_name, supplier_pattern, match_type, priority, enabled, source) '
      + 'VALUES (?, ?, ?, ?, ?, ?, ?, ?) '
      + 'ON DUPLICATE KEY UPDATE '
      + 'priority = VALUES(priority), enabled = VALUES(enabled), source = VALUES(source), updated_at = CURRENT_TIMESTAMP',
    [
      normalized.account_no,
      normalized.group_key,
      normalized.category_name,
      normalized.supplier_pattern,
      normalized.match_type,
      normalized.priority,
      normalized.enabled,
      normalized.source,
    ]
  );
  const [rows] = await pool.query(
    'SELECT id FROM reporting_supplier_rules WHERE account_no = ? AND group_key = ? '
      + 'AND category_name = ? AND supplier_pattern = ? AND match_type = ? LIMIT 1',
    [
      normalized.account_no,
      normalized.group_key,
      normalized.category_name,
      normalized.supplier_pattern,
      normalized.match_type,
    ]
  );
  return rows.length ? getRuleById(rows[0].id) : null;
}

async function getRuleById(id) {
  const [rows] = await pool.query(
    'SELECT id, account_no, group_key, category_name, supplier_pattern, match_type, '
      + 'priority, enabled, source, updated_at FROM reporting_supplier_rules WHERE id = ? LIMIT 1',
    [Number(id)]
  );
  if (!rows.length) return null;
  const row = rows[0];
  return {
    id: Number(row.id),
    account_no: row.account_no,
    group_key: row.group_key,
    category_name: row.category_name,
    supplier_pattern: row.supplier_pattern,
    match_type: row.match_type,
    priority: Number(row.priority || 100),
    enabled: Number(row.enabled) === 1,
    source: row.source || 'manual',
    updated_at: row.updated_at,
  };
}

async function updateRule(ruleId, patch) {
  const current = await getRuleById(ruleId);
  if (!current) return null;

  const merged = normalizeRule({
    ...current,
    ...patch,
    enabled: patch && patch.enabled !== undefined ? patch.enabled : current.enabled,
    source: patch && patch.source ? patch.source : current.source,
  });
  if (!isValidRule(merged)) {
    throw new Error('account_no, group_key, category_name, and supplier_pattern are required');
  }

  await pool.query(
    'UPDATE reporting_supplier_rules SET '
      + 'account_no = ?, group_key = ?, category_name = ?, supplier_pattern = ?, match_type = ?, '
      + 'priority = ?, enabled = ?, source = ?, updated_at = CURRENT_TIMESTAMP '
      + 'WHERE id = ?',
    [
      merged.account_no,
      merged.group_key,
      merged.category_name,
      merged.supplier_pattern,
      merged.match_type,
      merged.priority,
      merged.enabled,
      merged.source,
      Number(ruleId),
    ]
  );
  return getRuleById(ruleId);
}

async function deleteRule(ruleId) {
  const [res] = await pool.query(
    'DELETE FROM reporting_supplier_rules WHERE id = ?',
    [Number(ruleId)]
  );
  return Number(res.affectedRows || 0) > 0;
}

async function getMappedAccountNos() {
  const [rows] = await pool.query(
    'SELECT DISTINCT account_no FROM reporting_supplier_rules WHERE enabled = 1'
  );
  return new Set(rows.map((row) => row.account_no));
}

module.exports = {
  createRule,
  deleteRule,
  getMappedAccountNos,
  getRuleById,
  getRulesForMatching,
  listRules,
  upsertRule,
  updateRule,
};

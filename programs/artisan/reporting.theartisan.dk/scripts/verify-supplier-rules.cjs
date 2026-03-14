const { loadEnv } = require('../config/loadEnv');
loadEnv();

const { pool } = require('../db/mysql');
const supplierRulesRepo = require('../repositories/supplierRulesRepo');

async function main() {
  try {
    const rules1211 = await supplierRulesRepo.listRules({ account_no: '1211', enabled: true });
    const rules1815 = await supplierRulesRepo.listRules({ account_no: '1815', enabled: true });
    const rules1540 = await supplierRulesRepo.listRules({ account_no: '1540', enabled: true });

    const requiredCategories = new Set(['Bread', 'Ingredients', 'Tea', 'Soft Drinks']);
    const seen = new Set(rules1211.filter((row) => row.group_key === 'cafe').map((row) => row.category_name));
    const missing = Array.from(requiredCategories).filter((category) => !seen.has(category));

    const result = {
      ok: missing.length === 0,
      account_1211_rule_count: rules1211.length,
      account_1815_rule_count: rules1815.length,
      account_1540_rule_count: rules1540.length,
      missing_required_1211_categories: missing,
    };

    console.log(JSON.stringify(result, null, 2));
    if (!result.ok) process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Supplier rule verification failed:', err.message || err);
  process.exit(1);
});

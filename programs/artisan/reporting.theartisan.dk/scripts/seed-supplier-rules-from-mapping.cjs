const { loadEnv } = require('../config/loadEnv');
loadEnv();

const mapping = require('../config/mapping');
const { pool } = require('../db/mysql');
const supplierRulesRepo = require('../repositories/supplierRulesRepo');

function buildSeedRules() {
  const rules = [];

  const cafeAccount = String(mapping.costs.cafe.account);
  Object.entries(mapping.costs.cafe.categories || {}).forEach(([category, suppliers]) => {
    suppliers.forEach((supplier) => {
      rules.push({
        account_no: cafeAccount,
        group_key: 'cafe',
        category_name: category,
        supplier_pattern: supplier,
        match_type: 'contains',
        priority: 100,
        enabled: true,
        source: 'seed',
      });
      rules.push({
        account_no: cafeAccount,
        group_key: 'cafe',
        category_name: category,
        supplier_pattern: supplier,
        match_type: 'exact',
        priority: 50,
        enabled: true,
        source: 'seed',
      });
    });
  });

  const adminAccount = String(mapping.costs.admin.account);
  Object.entries(mapping.costs.admin.categories || {}).forEach(([category, suppliers]) => {
    suppliers.forEach((supplier) => {
      rules.push({
        account_no: adminAccount,
        group_key: 'admin',
        category_name: category,
        supplier_pattern: supplier,
        match_type: 'contains',
        priority: 100,
        enabled: true,
        source: 'seed',
      });
      rules.push({
        account_no: adminAccount,
        group_key: 'admin',
        category_name: category,
        supplier_pattern: supplier,
        match_type: 'exact',
        priority: 50,
        enabled: true,
        source: 'seed',
      });
    });
  });

  Object.entries((mapping.costs.fixed && mapping.costs.fixed.subLabels) || {}).forEach(([accountNo, supplierMap]) => {
    Object.entries(supplierMap || {}).forEach(([supplier, category]) => {
      rules.push({
        account_no: String(accountNo),
        group_key: 'fixed',
        category_name: category,
        supplier_pattern: supplier,
        match_type: 'exact',
        priority: 25,
        enabled: true,
        source: 'seed',
      });
    });
  });

  return rules;
}

async function main() {
  try {
    const rules = buildSeedRules();
    let applied = 0;
    for (const rule of rules) {
      await supplierRulesRepo.upsertRule(rule);
      applied += 1;
    }

    const seeded = await supplierRulesRepo.listRules({ enabled: true });
    console.log(JSON.stringify({
      ok: true,
      attempted: rules.length,
      applied,
      total_enabled_rules: seeded.length,
    }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Supplier rule seed failed:', err.message || err);
  process.exit(1);
});

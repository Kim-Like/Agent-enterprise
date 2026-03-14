CREATE TABLE IF NOT EXISTS reporting_category_overrides (
  bill_line_id VARCHAR(128) PRIMARY KEY,
  category VARCHAR(128) NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reporting_labour_allocations (
  month_key CHAR(7) NOT NULL,
  tabs_json LONGTEXT NOT NULL,
  roles_json LONGTEXT NOT NULL,
  deduction DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (month_key)
);

CREATE TABLE IF NOT EXISTS reporting_fixed_cost_allocations (
  month_key CHAR(7) NOT NULL,
  tabs_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (month_key)
);

CREATE TABLE IF NOT EXISTS reporting_distribution_rules (
  rule_key VARCHAR(255) PRIMARY KEY,
  months TINYINT UNSIGNED NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reporting_billy_accounts (
  account_id VARCHAR(128) PRIMARY KEY,
  account_no VARCHAR(32) NOT NULL UNIQUE,
  account_name VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  raw_json LONGTEXT NOT NULL,
  last_synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reporting_supplier_rules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  account_no VARCHAR(32) NOT NULL,
  group_key VARCHAR(64) NOT NULL,
  category_name VARCHAR(128) NOT NULL,
  supplier_pattern VARCHAR(255) NOT NULL,
  match_type VARCHAR(16) NOT NULL DEFAULT 'contains',
  priority INT NOT NULL DEFAULT 100,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  source VARCHAR(32) NOT NULL DEFAULT 'seed',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_supplier_rule (account_no, group_key, category_name, supplier_pattern, match_type),
  KEY idx_supplier_rules_lookup (account_no, enabled, priority),
  KEY idx_supplier_rules_group (group_key, category_name)
);

CREATE TABLE IF NOT EXISTS reporting_account_sync_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  sync_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  details_json LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reporting_migration_audit (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  migration_name VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  details_json LONGTEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

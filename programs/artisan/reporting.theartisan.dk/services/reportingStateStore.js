const overridesRepo = require('../repositories/overridesRepo');
const labourRepo = require('../repositories/labourRepo');
const fixedCostsRepo = require('../repositories/fixedCostsRepo');
const distributionsRepo = require('../repositories/distributionsRepo');
const accountsRepo = require('../repositories/accountsRepo');
const supplierRulesRepo = require('../repositories/supplierRulesRepo');

const reportingStateStore = {
  loadOverrides: overridesRepo.loadOverrides,
  saveOverride: overridesRepo.saveOverride,
  loadLabourAlloc: labourRepo.loadLabourAlloc,
  saveLabourAlloc: labourRepo.saveLabourAlloc,
  loadFixedAlloc: fixedCostsRepo.loadFixedAlloc,
  saveFixedAlloc: fixedCostsRepo.saveFixedAlloc,
  loadDistributions: distributionsRepo.loadDistributions,
  saveDistribution: distributionsRepo.saveDistribution,
  listAccounts: accountsRepo.listAccounts,
  getAccountNoMapById: accountsRepo.getAccountNoMapById,
  getLatestSyncInfo: accountsRepo.getLatestSyncInfo,
  upsertAccounts: accountsRepo.upsertAccounts,
  logAccountSync: accountsRepo.logSync,
  listSupplierRules: supplierRulesRepo.listRules,
  getSupplierRulesForMatching: supplierRulesRepo.getRulesForMatching,
  getSupplierRuleById: supplierRulesRepo.getRuleById,
  createSupplierRule: supplierRulesRepo.createRule,
  upsertSupplierRule: supplierRulesRepo.upsertRule,
  updateSupplierRule: supplierRulesRepo.updateRule,
  deleteSupplierRule: supplierRulesRepo.deleteRule,
  getMappedAccountNos: supplierRulesRepo.getMappedAccountNos,
};

module.exports = reportingStateStore;

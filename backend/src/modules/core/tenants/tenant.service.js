const repository = require('./tenant.repository');
const { createDefaultChartOfAccounts } = require('../../accounting/accounts/account.seed');
const { createDefaultPeriod } = require('../../accounting/period/period.seed');

const createTenant = async (data) => {
  // Create tenant
  const tenant = await repository.create(data);

  // Seed default Chart of Accounts for this tenant
  try {
    await createDefaultChartOfAccounts(tenant._id);
    console.log(`✓ Default Chart of Accounts seeded for tenant: ${tenant._id}`);
  } catch (error) {
    console.error(`Error seeding Chart of Accounts for tenant ${tenant._id}:`, error.message);
  }

  // Seed default Period for this tenant
  try {
    await createDefaultPeriod(tenant._id);
    console.log(`✓ Default Period seeded for tenant: ${tenant._id}`);
  } catch (error) {
    console.error(`Error seeding default Period for tenant ${tenant._id}:`, error.message);
  }

  return tenant;
};

const getTenants = () => repository.findAll();
const getTenantById = (id) => repository.findById(id);
const updateTenant = (id, data) => repository.update(id, data);
const deleteTenant = (id) => repository.remove(id);

module.exports = { createTenant, getTenants, getTenantById, updateTenant, deleteTenant };
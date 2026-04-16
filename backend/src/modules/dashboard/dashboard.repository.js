const Tenant = require('../core/tenants/tenant.model');
const Company = require('../core/companies/company.model');
const Branch = require('../core/branches/branch.model');
const User = require('../core/users/user.model');
const SubscriptionPlan = require('../core/subscriptionPlans/subscriptionPlan.model');
const Subscription = require('../core/subscriptions/subscription.model');

async function getDashboardStats() {
  const [tenants, companies, branches, users, subscriptionPlans, activeSubscriptions] = await Promise.all([
    Tenant.countDocuments({ deletedAt: null }),
    Company.countDocuments({ deletedAt: null }),
    Branch.countDocuments({ deletedAt: null }),
    User.countDocuments({ deletedAt: null }),
    SubscriptionPlan.countDocuments({ deletedAt: null }),
    Subscription.countDocuments({ status: 'active', deletedAt: null })
  ]);
  return {
    tenants,
    companies,
    branches,
    users,
    subscriptionPlans,
    activeSubscriptions
  };
}

module.exports = { getDashboardStats };

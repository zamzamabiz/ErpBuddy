const express = require("express");
const router = express.Router();

// Auth Routes
const authRoutesSimple = require('../modules/core/auth/auth.routes.simple');

// Module Routes
const accountRoutes = require("../modules/accounting/accounts/account.routes");
const journalRoutes = require("../modules/finance/journal/journal.routes");
const paymentsRoutes = require("../modules/finance/payments/payment.routes");
const trialBalanceRoutes = require("../modules/finance/trialBalance/trialBalance.routes");
const ledgerRoutes = require("../modules/finance/ledger/ledger.routes");
const profitLossRoutes = require("../modules/finance/profitLoss/profitLoss.routes");
const balanceSheetRoutes = require("../modules/finance/balanceSheet/balanceSheet.routes");
const periodRoutes = require("../modules/accounting/period/period.routes");
const auditRoutes = require("../modules/audit/audit.routes");
const hrRoutes = require("../modules/hr/hr.routes");
const payrollRoutes = require("../modules/hr/payroll/payroll.routes");
const financeReportsRoutes = require("../modules/finance/reports");
const reportsRoutes = require("../modules/reports/reports.routes");
const dashboardRoutes = require("../modules/dashboard/dashboard.routes");
const documentNumberRoutes = require("../modules/engines/documentNumbering/documentNumber.routes");
const salesRoutes = require("../modules/business/sales/sales.routes");
const purchaseRoutes = require("../modules/business/purchase/purchase.routes");

// Core Routes
const userRoutes = require('../modules/core/users/user.routes');
const roleRoutes = require('../modules/core/roles/role.routes');
const permissionRoutes = require('../modules/core/permissions/permission.routes');
const tenantRoutes = require('../modules/tenant/tenant.routes');
const companyRoutes = require('../modules/core/companies/company.routes');
const branchRoutes = require('../modules/core/branches/branch.routes');
const subscriptionPlanRoutes = require('../modules/core/subscriptionPlans/subscriptionPlan.routes');
const subscriptionRoutes = require('../modules/core/subscriptions/subscription.routes');

// Masters Routes
const customerRoutes = require('../modules/masters/customers/customers.routes');
const supplierRoutes = require('../modules/masters/suppliers/suppliers.routes');
const itemRoutes = require('../modules/item/item.routes');
const warehouseRoutes = require('../modules/masters/warehouse/warehouse.routes');
const categoryRoutes = require('../modules/category/category.routes');
const brandRoutes = require('../modules/brand/brand.routes');
const inventoryRoutes = require('../modules/inventory/inventory.routes');
const invoiceRoutes = require('../modules/invoice/invoice.routes');

// AI Routes
const deepseekRoutes = require('../modules/ai/deepseek.routes');

// Accounting API Routes (New)
const accountingLedgerRoutes = require('../modules/accounting/ledger.routes');
const accountingTrialBalanceRoutes = require('../modules/accounting/trialBalance.routes');

// Register auth endpoints
router.use('/auth', authRoutesSimple);

// Core setup routes
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/tenants', tenantRoutes);
router.use('/companies', companyRoutes);
router.use('/branches', branchRoutes);
router.use('/subscription-plans', subscriptionPlanRoutes);
router.use('/subscriptions', subscriptionRoutes);

// Masters routes
router.use('/customers', customerRoutes);
router.use('/suppliers', supplierRoutes);
const supplierSimpleRoutes = require('../modules/masters/suppliers/supplier.simple.routes');
router.use('/suppliers', supplierSimpleRoutes);
router.use('/items', itemRoutes);
const itemSimpleRoutes = require('../modules/item/item.simple.routes');
router.use('/items', itemSimpleRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/invoices', invoiceRoutes);

// Finance routes
router.use("/accounts", accountRoutes);
router.use("/journal", journalRoutes);
router.use("/payments", paymentsRoutes);
router.use("/trial-balance", trialBalanceRoutes);
router.use("/ledger", ledgerRoutes);
router.use("/profit-loss", profitLossRoutes);
router.use("/balance-sheet", balanceSheetRoutes);
router.use("/periods", periodRoutes);
router.use("/audit", auditRoutes);

// Business routes
router.use("/sales", salesRoutes);
const salesSimpleRoutes = require('../modules/business/sales/sales.simple.routes');
router.use('/sales', salesSimpleRoutes);

// Protected route: Apply auth middleware to purchase
const authDevMiddleware = require('../middleware/auth.dev.middleware');
router.use("/purchase", authDevMiddleware, purchaseRoutes);

// HR routes
router.use("/hr", hrRoutes);
router.use("/payroll", payrollRoutes);

// Reports routes
router.use("/finance/reports", financeReportsRoutes);
router.use("/reports", reportsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/document-number", documentNumberRoutes);

// AI routes
router.use('/ai/deepseek', deepseekRoutes);

// Accounting API routes (New)
router.use('/ledger', accountingLedgerRoutes);
router.use('/trial-balance', accountingTrialBalanceRoutes);

module.exports = router;
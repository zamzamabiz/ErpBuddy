// Script to seed initial data: Permissions, Roles, Tenant, Company, Branch, Admin User
require('module-alias/register');

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config/db.config');

// Models
const Permission = require('../src/modules/core/permissions/permission.model');
const Role = require('../src/modules/core/roles/role.model');
const Tenant = require('../src/modules/core/tenants/tenant.model');
const Company = require('../src/modules/core/companies/company.model');
const Branch = require('../src/modules/core/branches/branch.model');
const User = require('../src/modules/core/users/user.model');
const Auth = require('../src/modules/core/auth/auth.model');

// Default permissions
const defaultPermissions = [
  // Dashboard
  { module: 'dashboard', action: 'read', description: 'View dashboard' },
  
  // Users
  { module: 'users', action: 'read', description: 'View users' },
  { module: 'users', action: 'create', description: 'Create user' },
  { module: 'users', action: 'update', description: 'Update user' },
  { module: 'users', action: 'delete', description: 'Delete user' },
  
  // Roles
  { module: 'roles', action: 'read', description: 'View roles' },
  { module: 'roles', action: 'create', description: 'Create role' },
  { module: 'roles', action: 'update', description: 'Update role' },
  { module: 'roles', action: 'delete', description: 'Delete role' },
  
  // Permissions
  { module: 'permissions', action: 'read', description: 'View permissions' },
  { module: 'permissions', action: 'create', description: 'Create permission' },
  { module: 'permissions', action: 'update', description: 'Update permission' },
  { module: 'permissions', action: 'delete', description: 'Delete permission' },
  
  // Tenants
  { module: 'tenants', action: 'read', description: 'View tenants' },
  { module: 'tenants', action: 'create', description: 'Create tenant' },
  { module: 'tenants', action: 'update', description: 'Update tenant' },
  { module: 'tenants', action: 'delete', description: 'Delete tenant' },
  
  // Companies
  { module: 'companies', action: 'read', description: 'View companies' },
  { module: 'companies', action: 'create', description: 'Create company' },
  { module: 'companies', action: 'update', description: 'Update company' },
  { module: 'companies', action: 'delete', description: 'Delete company' },
  
  // Branches
  { module: 'branches', action: 'read', description: 'View branches' },
  { module: 'branches', action: 'create', description: 'Create branch' },
  { module: 'branches', action: 'update', description: 'Update branch' },
  { module: 'branches', action: 'delete', description: 'Delete branch' },
  
  // Accounts
  { module: 'accounts', action: 'read', description: 'View accounts' },
  { module: 'accounts', action: 'create', description: 'Create account' },
  { module: 'accounts', action: 'update', description: 'Update account' },
  { module: 'accounts', action: 'delete', description: 'Delete account' },
  
  // Finance & Journal
  { module: 'journal', action: 'read', description: 'View journal entries' },
  { module: 'journal', action: 'create', description: 'Create journal entry' },
  { module: 'journal', action: 'update', description: 'Update journal entry' },
  { module: 'journal', action: 'delete', description: 'Delete journal entry' },
  { module: 'journal', action: 'post', description: 'Post journal entry' },
  
  // Payments & Receipts
  { module: 'payment', action: 'read', description: 'View payments and receipts' },
  { module: 'payment', action: 'create', description: 'Create payment or receipt' },
  
  // Document Number Engine
  { module: 'document', action: 'read', description: 'View document numbers' },
  { module: 'document', action: 'create', description: 'Generate document number' },
  
  // Accounting - Chart of Accounts
  { module: 'account', action: 'read', description: 'View accounts' },
  { module: 'account', action: 'create', description: 'Create account' },
  { module: 'account', action: 'update', description: 'Update account' },
  { module: 'account', action: 'delete', description: 'Deactivate account' },
  
  // Items/Products/SKU
  { module: 'items', action: 'read', description: 'View items' },
  { module: 'items', action: 'create', description: 'Create item' },
  { module: 'items', action: 'update', description: 'Update item' },
  { module: 'items', action: 'delete', description: 'Delete item' },
  
  // Warehouses
  { module: 'warehouses', action: 'read', description: 'View warehouses' },
  { module: 'warehouses', action: 'create', description: 'Create warehouse' },
  { module: 'warehouses', action: 'update', description: 'Update warehouse' },
  { module: 'warehouses', action: 'delete', description: 'Delete warehouse' },
  
  // Customers/Parties
  { module: 'parties', action: 'read', description: 'View customers/parties' },
  { module: 'parties', action: 'create', description: 'Create customer/party' },
  { module: 'parties', action: 'update', description: 'Update customer/party' },
  { module: 'parties', action: 'delete', description: 'Delete customer/party' },
  
  // Purchase Orders
  { module: 'purchase', action: 'read', description: 'View purchase orders' },
  { module: 'purchase', action: 'create', description: 'Create purchase order' },
  { module: 'purchase', action: 'update', description: 'Update purchase order' },
  { module: 'purchase', action: 'delete', description: 'Delete purchase order' },
  { module: 'purchase', action: 'post', description: 'Post purchase order' },
  
  // Sales Orders
  { module: 'sales', action: 'read', description: 'View sales orders' },
  { module: 'sales', action: 'create', description: 'Create sales order' },
  { module: 'sales', action: 'update', description: 'Update sales order' },
  { module: 'sales', action: 'delete', description: 'Delete sales order' },
  { module: 'sales', action: 'post', description: 'Post sales order' },
  
  // Stock Ledger
  { module: 'stock', action: 'read', description: 'View stock ledger' },
  
  // Reports
  { module: 'reports', action: 'read', description: 'View reports' },
];

async function seedData() {
  try {
    await mongoose.connect(config.uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✓ MongoDB connected');

    // Clear existing data and drop bad indexes (careful in production!)
    await Permission.deleteMany({});
    await Permission.collection.dropIndexes().catch(() => {});
    await Role.deleteMany({});
    await Role.collection.dropIndexes().catch(() => {});
    await Tenant.deleteMany({});
    await Tenant.collection.dropIndexes().catch(() => {});
    await Company.deleteMany({});
    await Company.collection.dropIndexes().catch(() => {});
    await Branch.deleteMany({});
    await Branch.collection.dropIndexes().catch(() => {});
    await User.deleteMany({});
    await User.collection.dropIndexes().catch(() => {});
    await Auth.deleteMany({});
    await Auth.collection.dropIndexes().catch(() => {});
    console.log('✓ Cleared existing data and indexes');

    // Seed permissions
    const permissions = await Permission.insertMany(defaultPermissions);
    console.log(`✓ Created ${permissions.length} permissions`);

    // Create Admin Role with all permissions
    const adminRole = await Role.create({
      name: 'Admin',
      description: 'Administrator with full system access',
      permissions: permissions.map(p => p._id),
      isActive: true
    });
    console.log('✓ Created Admin role');

    // Create default Tenant
    const tenant = await Tenant.create({
      name: 'Demo Tenant',
      email: 'admin@demo.local',
      phone: '+1-555-0100',
      address: '123 Main St, Demo City',
      country: 'USA',
      subscriptionStatus: 'active',
      maxUsers: 100,
      maxCompanies: 10,
      storageLimit: 50000, // MB
      isActive: true
    });
    console.log('✓ Created default tenant');

    // Create default Company
    const company = await Company.create({
      name: 'Demo Company',
      email: 'info@demo.local',
      phone: '+1-555-0101',
      address: '456 Business Ave, Demo City',
      country: 'USA',
      taxId: 'DEMO-TAX-001',
      tenantId: tenant._id,
      isActive: true
    });
    console.log('✓ Created default company');

    // Create default Branch
    const branch = await Branch.create({
      name: 'Main Branch',
      code: 'MAIN',
      address: '456 Business Ave, Demo City',
      phone: '+1-555-0102',
      email: 'main@demo.local',
      companyId: company._id,
      tenantId: tenant._id,
      isActive: true
    });
    console.log('✓ Created default branch');

    // Create Admin User
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@demo.local',
      password: 'Admin@123', // Will be hashed by pre-save middleware
      role: adminRole._id,
      tenantId: tenant._id,
      company: company._id,
      isActive: true
    });
    console.log('✓ Created admin user');

    // Create Auth record for login
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await Auth.create({
      userId: adminUser._id,
      email: 'admin@demo.local',
      passwordHash,
      tenantId: tenant._id,
      companyId: company._id,
      roleId: adminRole._id,
      isActive: true,
      createdBy: adminUser._id  // ✅ Required by BaseModelSchema
    });
    console.log('✓ Created auth record for admin user');

    console.log('\n═════════════════════════════════════════');
    console.log('✓ SEEDING COMPLETE');
    console.log('═════════════════════════════════════════');
    console.log('\nDefault Credentials:');
    console.log('  Email:    admin@demo.local');
    console.log('  Password: Admin@123');
    console.log('\nUI:');
    console.log('  Frontend: http://localhost:5173');
    console.log('  Backend:  http://localhost:5000');
    console.log('═════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error seeding data:', err.message);
    process.exit(1);
  }
}

seedData();

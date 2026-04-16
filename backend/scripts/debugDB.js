require('module-alias/register');
const mongoose = require('mongoose');
const config = require('../src/config/db.config');
const Role = require('../src/modules/core/roles/role.model');
const Permission = require('../src/modules/core/permissions/permission.model');
const User = require('../src/modules/core/users/user.model');

async function debug() {
  try {
    // Connect to DB
    await mongoose.connect(config.uri, config.options);
    console.log('✓ Connected to MongoDB');

    // Check roles
    const rolesCount = await Role.countDocuments();
    console.log(`\nRoles in DB: ${rolesCount}`);
    const roles = await Role.find().populate('permissions');
    roles.forEach(role => {
      console.log(`  Role: ${role.name}`);
      console.log(`    Permissions: ${role.permissions.length}`);
      if (role.permissions.length > 0) {
        role.permissions.slice(0, 3).forEach(perm => {
          console.log(`      - ${perm.module}:${perm.action}`);
        });
      }
    });

    // Check users
    console.log(`\nUsers in DB:`);
    const users = await User.find().populate({ path: 'role', populate: { path: 'permissions' } });
    users.forEach(user => {
      console.log(`  User: ${user.email}`);
      console.log(`    Role: ${user.role ? user.role.name : 'NO ROLE'}`);
      if (user.role && user.role.permissions) {
        console.log(`    Permissions: ${user.role.permissions.length}`);
        const itemsPerms = user.role.permissions.filter(p => p.module === 'items');
        console.log(`    Items perms: ${itemsPerms.length}` );
        itemsPerms.forEach(p => console.log(`      - ${p.action}`));
      }
    });

    console.log('\n✓ Debug complete');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debug();

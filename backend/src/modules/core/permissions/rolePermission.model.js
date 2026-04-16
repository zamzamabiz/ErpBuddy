const mongoose = require('mongoose');

const RolePermissionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true, index: true },
  permissionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Permission', required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedAt: { type: Date, default: Date.now }
});

RolePermissionSchema.index({ companyId: 1, roleId: 1, permissionId: 1 }, { unique: true });

module.exports = mongoose.model('RolePermission', RolePermissionSchema);

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin', 'staff'] },
  name: { type: String, required: true },
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tenant', 
    required: true 
  },
  userRole: {
    type: String,
    default: 'staff',
    enum: ['admin', 'staff', 'viewer']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for faster tenant-based queries
UserSchema.index({ tenantId: 1 });
UserSchema.index({ email: 1, tenantId: 1 });

// Pre-save middleware to update updatedAt
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance method to check if user is admin
UserSchema.methods.isAdmin = function() {
  return this.role === 'admin' || this.userRole === 'admin';
};

module.exports = mongoose.model('User', UserSchema);
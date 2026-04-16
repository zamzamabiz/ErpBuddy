const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'POST', 'CANCEL', 'APPROVE'],
      required: true,
      index: true,
    },
    module: {
      type: String,
      enum: ['account', 'journal', 'sales', 'purchase', 'payment'],
      required: true,
      index: true,
    },
    recordId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: false }
);

auditSchema.index({ tenantId: 1, module: 1, action: 1, createdAt: -1 });
auditSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
auditSchema.index({ tenantId: 1, recordId: 1 });

module.exports = mongoose.model('Audit', auditSchema);

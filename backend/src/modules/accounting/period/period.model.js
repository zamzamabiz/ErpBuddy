const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    lockedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

periodSchema.index({ tenantId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('Period', periodSchema);

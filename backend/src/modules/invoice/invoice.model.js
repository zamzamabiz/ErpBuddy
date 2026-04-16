const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    batchNo: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
    unit: {
      type: String,
      required: true,
    },
    rate: {
      type: Number,
      required: true,
      min: [0, 'Rate cannot be negative'],
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative'],
    },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ['SALE', 'PURCHASE'],
      required: true,
    },

    partyName: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
      default: Date.now,
    },

    items: {
      type: [invoiceItemSchema],
      required: true,
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'Invoice must have at least one item',
      },
    },

    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative'],
    },

    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },

    status: {
      type: String,
      enum: ['DRAFT', 'POSTED'],
      default: 'DRAFT',
    },

    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes
invoiceSchema.index({ tenantId: 1, status: 1 });
invoiceSchema.index({ invoiceNumber: 1, tenantId: 1 });
invoiceSchema.index({ type: 1, tenantId: 1 });
invoiceSchema.index({ date: 1, tenantId: 1 });

// Soft delete support
invoiceSchema.index({
  tenantId: 1,
  deletedAt: 1,
  partialFilterExpression: { deletedAt: null },
});

module.exports =
  mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

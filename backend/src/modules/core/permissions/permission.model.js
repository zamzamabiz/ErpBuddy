const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  module: { type: String, required: true },
  action: { type: String, required: true },
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
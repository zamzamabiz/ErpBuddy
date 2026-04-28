/**
 * Create Staff User Script
 * Run this to add the staff@erpbuddy.com user
 */
require('module-alias/register');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config();

const { connectDB } = require('./src/loaders/mongodb.loader');

// Simple User schema matching server.js
const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    default: 'user', 
    enum: ['user', 'admin', 'staff'] 
  },
  name: { 
    type: String, 
    required: true 
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: false
  },
  userRole: {
    type: String,
    default: 'staff'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createStaffUser() {
  try {
    await connectDB();
    console.log('✅ MongoDB connected');

    // Check if staff user exists
    const staffExists = await User.findOne({ email: 'staff@erpbuddy.com' });
    
    if (staffExists) {
      console.log('ℹ️ Staff user already exists');
      process.exit(0);
    }

    // Create staff user
    const hashedPassword = await bcrypt.hash('staff123', 10);
    await User.create({
      email: 'staff@erpbuddy.com',
      password: hashedPassword,
      role: 'user',
      name: 'Staff User',
      userRole: 'staff'
    });

    console.log('✅ Staff user created: staff@erpbuddy.com / staff123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createStaffUser();
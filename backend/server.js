require('module-alias/register');
const cors = require('cors');
const mongoose = require('mongoose');
const app = require('./src/app');
const { connectDB } = require('./src/loaders/mongodb.loader');

const PORT = process.env.PORT || 5000;

// Define User Schema once
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Check if model already exists before compiling
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const bcrypt = require('bcrypt');

(async () => {
  // CORS configuration
  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id']
  }));
  
  await connectDB();

  const createDefaultUsers = async () => {
    console.log('⚠️ User creation disabled. Use Dev Mode or register via UI.');
  };

  await createDefaultUsers();
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
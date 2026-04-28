/**
 * ERPBUDDY - DATABASE BACKUP SCRIPT
 * Creates timestamped MongoDB backups
 * 
 * Run: node backend/scripts/backup.js
 */

require('module-alias/register');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

// ============================================
// CONFIGURATION
// ============================================

const BACKUP_DIR = path.join(__dirname, '../backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const BACKUP_NAME = `erpbuddy-backup-${TIMESTAMP}`;
const BACKUP_PATH = path.join(BACKUP_DIR, BACKUP_NAME);

// Get MongoDB connection string
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erpbuddy';

// ============================================
// HELPER FUNCTIONS
// ============================================

function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`📁 Created backup directory: ${BACKUP_DIR}`);
  }
}

function getDatabaseName() {
  // Extract database name from connection string
  const match = MONGO_URI.match(/\/([^/?]+)(\?|$)/);
  return match ? match[1] : 'erpbuddy';
}

// ============================================
// BACKUP FUNCTIONS
// ============================================

/**
 * Create MongoDB dump using mongodump
 */
async function createMongoDump() {
  console.log('\n🗄️  Creating MongoDB dump...');
  
  const dbName = getDatabaseName();
  const dumpPath = path.join(BACKUP_PATH, 'mongodb');
  
  // Create backup directory
  fs.mkdirSync(dumpPath, { recursive: true });
  
  try {
    // Run mongodump
    const cmd = `mongodump --uri="${MONGO_URI}" --out="${dumpPath}"`;
    console.log(`   Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit' });
    
    console.log(`✅ MongoDB dump created: ${dumpPath}`);
    return true;
  } catch (error) {
    console.error('❌ MongoDB dump failed:', error.message);
    console.log('⚠️  Falling back to JSON export...');
    return false;
  }
}

/**
 * Export data as JSON (fallback method)
 */
async function exportJsonData() {
  console.log('\n📄 Exporting data as JSON...');
  
  const { connectDB } = require('../src/loaders/mongodb.loader');
  
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    const collections = [
      'tenants', 'companies', 'accounts', 'items', 'warehouses',
      'customers', 'suppliers', 'users', 'purchases', 'sales',
      'milling', 'expenses', 'journals', 'inventorytransactions'
    ];
    
    const exportPath = path.join(BACKUP_PATH, 'json');
    fs.mkdirSync(exportPath, { recursive: true });
    
    for (const collection of collections) {
      try {
        const db = mongoose.connection.db;
        const data = await db.collection(collection).find({}).toArray();
        
        const filePath = path.join(exportPath, `${collection}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        
        console.log(`   ✅ ${collection}: ${data.length} documents`);
      } catch (err) {
        console.log(`   ⚠️  ${collection}: Skipped (may not exist)`);
      }
    }
    
    console.log(`✅ JSON export created: ${exportPath}`);
    return true;
  } catch (error) {
    console.error('❌ JSON export failed:', error.message);
    return false;
  } finally {
    await mongoose.connection.close();
  }
}

/**
 * Create backup manifest
 */
function createManifest() {
  console.log('\n📋 Creating backup manifest...');
  
  const manifest = {
    backupName: BACKUP_NAME,
    createdAt: new Date().toISOString(),
    database: getDatabaseName(),
    version: '1.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    files: []
  };
  
  // List backup files
  if (fs.existsSync(BACKUP_PATH)) {
    const files = fs.readdirSync(BACKUP_PATH, { recursive: true });
    manifest.files = files.map(file => ({
      name: file,
      size: fs.statSync(path.join(BACKUP_PATH, file)).size
    }));
  }
  
  const manifestPath = path.join(BACKUP_PATH, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`✅ Manifest created: ${manifestPath}`);
  return manifest;
}

/**
 * Clean old backups (keep last 7 days)
 */
function cleanupOldBackups() {
  console.log('\n🧹 Cleaning old backups...');
  
  if (!fs.existsSync(BACKUP_DIR)) return;
  
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
  
  const backups = fs.readdirSync(BACKUP_DIR);
  let removed = 0;
  
  for (const backup of backups) {
    const backupPath = path.join(BACKUP_DIR, backup);
    const stat = fs.statSync(backupPath);
    
    if (stat.isDirectory() && (now - stat.mtimeMs) > maxAge) {
      fs.rmSync(backupPath, { recursive: true, force: true });
      removed++;
      console.log(`   🗑️  Removed old backup: ${backup}`);
    }
  }
  
  console.log(`✅ Cleaned ${removed} old backups`);
}

// ============================================
// MAIN BACKUP FUNCTION
// ============================================

async function createBackup() {
  console.log('='.repeat(60));
  console.log('💾 ERPBUDDY DATABASE BACKUP');
  console.log('='.repeat(60));
  console.log(`📅 Timestamp: ${TIMESTAMP}`);
  console.log(`📁 Backup path: ${BACKUP_PATH}`);
  
  try {
    // Ensure backup directory exists
    ensureBackupDir();
    
    // Try MongoDB dump first
    let dumpSuccess = await createMongoDump();
    
    // If dump failed, export as JSON
    if (!dumpSuccess) {
      await exportJsonData();
    }
    
    // Create manifest
    const manifest = createManifest();
    
    // Clean old backups
    cleanupOldBackups();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ BACKUP COMPLETE');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`  Backup name: ${manifest.backupName}`);
    console.log(`  Created at: ${manifest.createdAt}`);
    console.log(`  Files: ${manifest.files.length}`);
    console.log(`  Location: ${BACKUP_PATH}`);
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Backup failed:', error);
    process.exit(1);
  }
}

// ============================================
// RESTORE FUNCTION
// ============================================

async function restoreBackup(backupName) {
  console.log('='.repeat(60));
  console.log('🔄 ERPBUDDY DATABASE RESTORE');
  console.log('='.repeat(60));
  
  if (!backupName) {
    console.error('❌ Please provide backup name');
    console.log('   Available backups:');
    
    if (fs.existsSync(BACKUP_DIR)) {
      const backups = fs.readdirSync(BACKUP_DIR);
      backups.forEach(b => console.log(`   - ${b}`));
    }
    process.exit(1);
  }
  
  const restorePath = path.join(BACKUP_DIR, backupName);
  
  if (!fs.existsSync(restorePath)) {
    console.error(`❌ Backup not found: ${restorePath}`);
    process.exit(1);
  }
  
  console.log(`📁 Restoring from: ${restorePath}`);
  
  try {
    // Try mongorestore first
    const dumpPath = path.join(restorePath, 'mongodb');
    if (fs.existsSync(dumpPath)) {
      console.log('\n🗄️  Restoring MongoDB dump...');
      const cmd = `mongorestore --uri="${MONGO_URI}" --drop "${dumpPath}"`;
      execSync(cmd, { stdio: 'inherit' });
      console.log('✅ Restore complete');
    } else {
      console.log('❌ No MongoDB dump found in backup');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    process.exit(1);
  }
}

// ============================================
// CLI HANDLER
// ============================================

const args = process.argv.slice(2);

if (args[0] === 'restore') {
  restoreBackup(args[1]);
} else {
  createBackup();
}
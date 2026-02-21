require('dotenv').config();
const migrateRunner = require('./migrateRunner');

const migrate = async () => {
  console.log('🔄 Running database migrations...');
  try {
    await migrateRunner();
    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    process.exit();
  }
};

migrate();

require('dotenv').config();
const db = require('./db');
const migrateRunner = require('./migrateRunner');
const seedRunner = require('./seedRunner');

const reset = async () => {
  console.log('🧨 Resetting database (truncate + migrate + seed)...');

  try {
    // Truncate in dependency-safe order via CASCADE.
    try {
      await db.query(
        'TRUNCATE TABLE notifications, promotions, announcements, reviews, enrollments, class_requests, classes, tutors, users RESTART IDENTITY CASCADE'
      );
      console.log('✅ Truncated tables');
    } catch (err) {
      // If tables don't exist yet, just run migrations.
      console.log('ℹ️  Tables not found to truncate; running migrations first');
    }

    await migrateRunner();
    await seedRunner();

    console.log('✅ Reset complete');
  } catch (err) {
    console.error('❌ Reset failed:', err.message);
  } finally {
    process.exit();
  }
};

reset();

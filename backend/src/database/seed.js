require('dotenv').config();
const seedRunner = require('./seedRunner');

const seed = async () => {
  console.log('🌱 Seeding database...');
  try {
    await seedRunner();
    console.log('✅ Database seeded successfully!');
    console.log('📧 Admin login: admin@tutorbooking.com / password123');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
  } finally {
    process.exit();
  }
};

seed();

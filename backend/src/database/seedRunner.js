require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

module.exports = async function seedRunner() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  await db.query(
    `INSERT INTO users (name, email, password, role, is_approved)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO UPDATE
     SET name = EXCLUDED.name,
         password = EXCLUDED.password,
         role = EXCLUDED.role,
         is_approved = EXCLUDED.is_approved`,
    ['Admin User', 'admin@tutorbooking.com', hashedPassword, 'admin', true]
  );
};

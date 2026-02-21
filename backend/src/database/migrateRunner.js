require('dotenv').config();
const db = require('./db');

module.exports = async function migrateRunner() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'tutor', 'admin')),
      contact_no VARCHAR(30),
      grade VARCHAR(20),
      profile_pic TEXT,
      push_token TEXT,
      is_approved BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Backfill columns for existing DBs (safe to run multiple times)
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_no VARCHAR(30);`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS grade VARCHAR(20);`,

    `CREATE TABLE IF NOT EXISTS tutors (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      bio TEXT,
      subjects TEXT,
      location VARCHAR(255),
      rating DECIMAL(3,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS classes (
      id SERIAL PRIMARY KEY,
      tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(100) NOT NULL,
      grade VARCHAR(20) NOT NULL,
      location VARCHAR(255) NOT NULL,
      schedule VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) DEFAULT 0.00,
      promotion BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      enrolled_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(class_id, student_id)
    );`,

    `CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      review TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(class_id, student_id)
    );`,

    `CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS promotions (
      id SERIAL PRIMARY KEY,
      tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      plan VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
      stripe_payment_id TEXT,
      start_date TIMESTAMP DEFAULT NOW(),
      end_date TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS class_requests (
      id SERIAL PRIMARY KEY,
      tutor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      subject VARCHAR(100) NOT NULL,
      grade VARCHAR(20) NOT NULL,
      location VARCHAR(255) NOT NULL,
      schedule VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) DEFAULT 0.00,
      status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      review_note TEXT,
      reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
      reviewed_at TIMESTAMP,
      class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'general',
      read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE INDEX IF NOT EXISTS idx_classes_subject ON classes(subject);`,
    `CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(grade);`,
    `CREATE INDEX IF NOT EXISTS idx_classes_location ON classes(location);`,
    `CREATE INDEX IF NOT EXISTS idx_classes_tutor ON classes(tutor_id);`,
    `CREATE INDEX IF NOT EXISTS idx_enrollments_class ON enrollments(class_id);`,
    `CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);`,
    `CREATE INDEX IF NOT EXISTS idx_reviews_class ON reviews(class_id);`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_class_requests_tutor ON class_requests(tutor_id);`,
    `CREATE INDEX IF NOT EXISTS idx_class_requests_status ON class_requests(status);`,
    `CREATE INDEX IF NOT EXISTS idx_users_grade ON users(grade);`,
  ];

  for (const query of queries) {
    await db.query(query);
  }
};

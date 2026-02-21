const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['student', 'tutor']).withMessage('Role must be student or tutor'),
    body('contact_no').trim().notEmpty().withMessage('Contact number is required'),
    body('grade').custom((value, { req }) => {
      if (req.body.role === 'student') {
        if (typeof value !== 'string' || value.trim().length === 0) {
          throw new Error('Grade is required for students');
        }
      }
      return true;
    }),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { name, email, password, role, contact_no, grade } = req.body;

      // Check if user exists
      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const isApproved = role === 'student'; // Students auto-approved, tutors need admin

      // Create user
      const result = await db.query(
        `INSERT INTO users (name, email, password, role, is_approved, contact_no, grade)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, role, is_approved, contact_no, grade`,
        [name, email, hashedPassword, role, isApproved, contact_no, role === 'student' ? grade.trim() : (typeof grade === 'string' ? grade.trim() : null)]
      );

      const user = result.rows[0];

      // If tutor, create tutor profile
      if (role === 'tutor') {
        await db.query(
          `INSERT INTO tutors (user_id) VALUES ($1)`,
          [user.id]
        );
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_approved: user.is_approved,
          contact_no: user.contact_no,
          grade: user.grade,
        },
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { email, password } = req.body;

      // Find user
      const result = await db.query(
        'SELECT id, name, email, password, role, is_approved, profile_pic, contact_no, grade FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = result.rows[0];

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          is_approved: user.is_approved,
          profile_pic: user.profile_pic,
          contact_no: user.contact_no,
          grade: user.grade,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// GET /api/auth/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, email, role, is_approved, profile_pic, contact_no, grade, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, email, profile_pic, password, contact_no, grade } = req.body;

    if (email) {
      const existing = await db.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [email, req.user.id]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    let hashedPassword = null;
    if (password) {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await db.query(
      'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), profile_pic = COALESCE($3, profile_pic), password = COALESCE($4, password), contact_no = COALESCE($5, contact_no), grade = COALESCE($6, grade), updated_at = NOW() WHERE id = $7 RETURNING id, name, email, role, profile_pic, contact_no, grade',
      [name, email, profile_pic, hashedPassword, contact_no, grade, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

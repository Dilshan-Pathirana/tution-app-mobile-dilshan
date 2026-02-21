const express = require('express');
const { body, query, validationResult } = require('express-validator');
const db = require('../database/db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/classes — search/list classes (public)
router.get('/', async (req, res) => {
  try {
    const { subject, grade, location, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const conditions = ['c.is_active = true'];
    const params = [];
    let paramIndex = 1;

    if (subject) {
      conditions.push(`c.subject ILIKE $${paramIndex}`);
      params.push(`%${subject}%`);
      paramIndex++;
    }
    if (grade) {
      conditions.push(`c.grade ILIKE $${paramIndex}`);
      params.push(`%${grade}%`);
      paramIndex++;
    }
    if (location) {
      conditions.push(`c.location ILIKE $${paramIndex}`);
      params.push(`%${location}%`);
      paramIndex++;
    }
    if (search) {
      conditions.push(`(c.title ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex} OR c.subject ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Promoted classes first (classes.promotion), then by avg rating
    const sql = `
      SELECT c.*, u.name as tutor_name, u.profile_pic as tutor_pic,
        t.bio as tutor_bio, t.subjects as tutor_subjects, t.location as tutor_location,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT e.id) as enrollment_count,
        c.promotion as is_promoted
      FROM classes c
      JOIN users u ON c.tutor_id = u.id
      LEFT JOIN tutors t ON t.user_id = u.id
      LEFT JOIN reviews r ON r.class_id = c.id
      LEFT JOIN enrollments e ON e.class_id = c.id
      ${whereClause}
      GROUP BY c.id, u.name, u.profile_pic, t.bio, t.subjects, t.location
      ORDER BY is_promoted DESC, avg_rating DESC, c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(sql, params);

    // Get total count
    const countSql = `SELECT COUNT(DISTINCT c.id) FROM classes c ${whereClause}`;
    const countResult = await db.query(countSql, params.slice(0, paramIndex - 1));
    const total = parseInt(countResult.rows[0].count);

    res.json({
      classes: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/classes/:id — single class detail (public)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT c.*, u.name as tutor_name, u.profile_pic as tutor_pic, u.email as tutor_email,
        t.bio as tutor_bio, t.subjects as tutor_subjects, t.location as tutor_location,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT e.id) as enrollment_count,
        c.promotion as is_promoted
      FROM classes c
      JOIN users u ON c.tutor_id = u.id
      LEFT JOIN tutors t ON t.user_id = u.id
      LEFT JOIN reviews r ON r.class_id = c.id
      LEFT JOIN enrollments e ON e.class_id = c.id
      WHERE c.id = $1
      GROUP BY c.id, u.name, u.profile_pic, u.email, t.bio, t.subjects, t.location
    `;
    const result = await db.query(sql, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classes/:id/enroll — student enrolls in a class
router.post('/:id/enroll', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can enroll' });
    }
    const classId = req.params.id;

    // Check class exists
    const classResult = await db.query('SELECT * FROM classes WHERE id = $1 AND is_active = true', [classId]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Check already enrolled
    const existingEnroll = await db.query(
      'SELECT id FROM enrollments WHERE class_id = $1 AND student_id = $2',
      [classId, req.user.id]
    );
    if (existingEnroll.rows.length > 0) {
      return res.status(400).json({ message: 'Already enrolled in this class' });
    }

    // Enroll
    const result = await db.query(
      'INSERT INTO enrollments (class_id, student_id) VALUES ($1, $2) RETURNING *',
      [classId, req.user.id]
    );

    // Notify tutor
    const cls = classResult.rows[0];
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'enrollment')`,
      [cls.tutor_id, 'New Enrollment', `A student enrolled in your class "${cls.title}"`]
    );

    res.status(201).json({ message: 'Enrolled successfully', enrollment: result.rows[0] });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/classes/:id/review — student reviews a class
router.post(
  '/:id/review',
  auth,
  [
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().trim().isLength({ max: 500 }),
  ],
  async (req, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can review' });
      }
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const classId = req.params.id;
      const { rating, comment } = req.body;
      const reviewText = typeof comment === 'string' ? comment : '';

      // Check enrollment
      const enrollment = await db.query(
        'SELECT id FROM enrollments WHERE class_id = $1 AND student_id = $2',
        [classId, req.user.id]
      );
      if (enrollment.rows.length === 0) {
        return res.status(403).json({ message: 'Must be enrolled to review' });
      }

      // Check existing review
      const existingReview = await db.query(
        'SELECT id FROM reviews WHERE class_id = $1 AND student_id = $2',
        [classId, req.user.id]
      );
      if (existingReview.rows.length > 0) {
        // Update existing
        const result = await db.query(
          'UPDATE reviews SET rating = $1, review = $2 WHERE class_id = $3 AND student_id = $4 RETURNING *',
          [rating, reviewText, classId, req.user.id]
        );
        return res.json({ message: 'Review updated', review: result.rows[0] });
      }

      // Create new
      const result = await db.query(
        'INSERT INTO reviews (class_id, student_id, rating, review) VALUES ($1, $2, $3, $4) RETURNING *',
        [classId, req.user.id, rating, reviewText]
      );
      res.status(201).json({ message: 'Review submitted', review: result.rows[0] });
    } catch (error) {
      console.error('Review error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/classes/:id/reviews — get reviews for a class (public)
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT r.*, u.name as student_name, u.profile_pic as student_pic
       FROM reviews r
       JOIN users u ON r.student_id = u.id
       WHERE r.class_id = $1
       ORDER BY r.created_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

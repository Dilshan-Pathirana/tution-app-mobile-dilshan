const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All routes require tutor role
router.use(auth, requireRole('tutor'));

// GET /api/tutor/classes — list tutor's own classes
router.get('/classes', async (req, res) => {
  try {
    const sql = `
      SELECT c.*,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT r.id) as review_count,
        COUNT(DISTINCT e.id) as enrollment_count,
        c.promotion as is_promoted
      FROM classes c
      LEFT JOIN reviews r ON r.class_id = c.id
      LEFT JOIN enrollments e ON e.class_id = c.id
      WHERE c.tutor_id = $1
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(sql, [req.user.id]);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tutor classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tutor/classes — create a new class
router.post(
  '/classes',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('grade').trim().notEmpty().withMessage('Grade is required'),
    body('schedule').trim().notEmpty().withMessage('Schedule is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      // Check approval
      const userResult = await db.query('SELECT is_approved FROM users WHERE id = $1', [req.user.id]);
      if (!userResult.rows[0].is_approved) {
        return res.status(403).json({ message: 'Your account is pending approval' });
      }

      const { title, subject, grade, schedule, location, price, description } = req.body;

      const result = await db.query(
        `INSERT INTO class_requests (tutor_id, title, description, subject, grade, schedule, location, price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         RETURNING *`,
        [req.user.id, title, description || '', subject, grade, schedule, location, price]
      );

      res.status(202).json({
        message: 'Class request submitted for admin approval',
        request: result.rows[0],
      });
    } catch (error) {
      console.error('Create class error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/tutor/class-requests — list tutor's class requests
router.get('/class-requests', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM class_requests WHERE tutor_id = $1 ORDER BY created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get class requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tutor/class-requests/:id — delete a pending request
router.delete('/class-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `DELETE FROM class_requests WHERE id = $1 AND tutor_id = $2 AND status = 'pending' RETURNING id`,
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    res.json({ message: 'Request deleted' });
  } catch (error) {
    console.error('Delete class request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/tutor/classes/:id — update a class
router.put('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const cls = await db.query('SELECT * FROM classes WHERE id = $1 AND tutor_id = $2', [id, req.user.id]);
    if (cls.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const { title, subject, grade, schedule, location, price, description } = req.body;
    const result = await db.query(
      `UPDATE classes SET
        title = COALESCE($1, title),
        subject = COALESCE($2, subject),
        grade = COALESCE($3, grade),
        schedule = COALESCE($4, schedule),
        location = COALESCE($5, location),
        price = COALESCE($6, price),
        description = COALESCE($7, description),
        updated_at = NOW()
      WHERE id = $8 AND tutor_id = $9
      RETURNING *`,
      [title, subject, grade, schedule, location, price, description, id, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/tutor/classes/:id — delete a class
router.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      'DELETE FROM classes WHERE id = $1 AND tutor_id = $2 RETURNING id',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class deleted' });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/tutor/classes/:id/enrollments — students enrolled in a class
router.get('/classes/:id/enrollments', async (req, res) => {
  try {
    const { id } = req.params;
    // Verify ownership
    const cls = await db.query('SELECT id FROM classes WHERE id = $1 AND tutor_id = $2', [id, req.user.id]);
    if (cls.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const result = await db.query(
      `SELECT e.*, u.name as student_name, u.email as student_email, u.profile_pic as student_pic
       FROM enrollments e
       JOIN users u ON e.student_id = u.id
       WHERE e.class_id = $1
       ORDER BY e.enrolled_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get enrollments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/tutor/classes/:id/announcement — create announcement for a class
router.post(
  '/classes/:id/announcement',
  [body('content').trim().notEmpty().withMessage('Content is required')],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { id } = req.params;
      // Verify ownership
      const cls = await db.query('SELECT * FROM classes WHERE id = $1 AND tutor_id = $2', [id, req.user.id]);
      if (cls.rows.length === 0) {
        return res.status(404).json({ message: 'Class not found' });
      }

      const { content } = req.body;
      const result = await db.query(
        'INSERT INTO announcements (class_id, tutor_id, content) VALUES ($1, $2, $3) RETURNING *',
        [id, req.user.id, content]
      );

      // Notify all enrolled students
      const enrollees = await db.query(
        'SELECT student_id FROM enrollments WHERE class_id = $1',
        [id]
      );
      for (const enrollee of enrollees.rows) {
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'announcement')`,
          [enrollee.student_id, `Announcement: ${cls.rows[0].title}`, content]
        );
      }

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// GET /api/tutor/classes/:id/announcements — get announcements for a class
router.get('/classes/:id/announcements', async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await db.query('SELECT id FROM classes WHERE id = $1 AND tutor_id = $2', [id, req.user.id]);
    if (cls.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const result = await db.query(
      'SELECT * FROM announcements WHERE class_id = $1 ORDER BY created_at DESC',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

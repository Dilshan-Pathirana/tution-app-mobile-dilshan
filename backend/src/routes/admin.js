const express = require('express');
const db = require('../database/db');
const { auth, requireRole } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

const router = express.Router();

// All routes require admin role
router.use(auth, requireRole('admin'));

// GET /api/admin/users — list users (students/tutors)
router.get('/users', async (req, res) => {
  try {
    const { role, q, grade } = req.query; // role: student | tutor | admin | all

    const params = [];
    let where = 'WHERE 1=1';
    if (role && role !== 'all') {
      params.push(role);
      where += ` AND role = $${params.length}`;
    } else {
      // Default: only manage students/tutors
      where += " AND role IN ('student','tutor')";
    }

    if (typeof q === 'string' && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (name ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    if (typeof grade === 'string' && grade.trim()) {
      params.push(grade.trim());
      where += ` AND grade ILIKE $${params.length}`;
    }

    const result = await db.query(
      `SELECT id, name, email, role, is_approved, contact_no, grade, created_at, updated_at FROM users ${where} ORDER BY created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/users — create student/tutor
router.post(
  '/users',
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
    body('is_approved').optional().isBoolean(),
    body('bio').optional().isString(),
    body('subjects').optional().isString(),
    body('location').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const {
        name,
        email,
        password,
        role,
        is_approved,
        bio,
        subjects,
        location,
        contact_no,
        grade,
      } = req.body;

      const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const hashed = await bcrypt.hash(password, 10);
      const approved = role === 'student' ? true : !!is_approved;

      const created = await db.query(
        `INSERT INTO users (name, email, password, role, is_approved, contact_no, grade)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, role, is_approved, contact_no, grade, created_at`,
        [
          name,
          email,
          hashed,
          role,
          approved,
          contact_no,
          role === 'student' ? grade.trim() : (typeof grade === 'string' ? grade.trim() : null),
        ]
      );

      const user = created.rows[0];
      if (role === 'tutor') {
        await db.query(
          `INSERT INTO tutors (user_id, bio, subjects, location) VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO NOTHING`,
          [user.id, bio || null, subjects || null, location || null]
        );
      }

      res.status(201).json(user);
    } catch (error) {
      console.error('Admin create user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/admin/users/:id — update student/tutor
router.put(
  '/users/:id',
  [
    body('name').optional().trim().notEmpty(),
    body('email').optional().isEmail(),
    body('password').optional().isLength({ min: 6 }),
    body('is_approved').optional().isBoolean(),
    body('contact_no').optional().trim().notEmpty(),
    body('grade').optional().trim().notEmpty(),
    body('bio').optional().isString(),
    body('subjects').optional().isString(),
    body('location').optional().isString(),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { id } = req.params;
      if (parseInt(id, 10) === req.user.id) {
        return res.status(400).json({ message: 'Use profile endpoint to modify your own account' });
      }

      const existing = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { name, email, password, is_approved, bio, subjects, location, contact_no, grade } = req.body;
      const role = existing.rows[0].role;

      let hashed = null;
      if (password) {
        hashed = await bcrypt.hash(password, 10);
      }

      const updated = await db.query(
        `UPDATE users SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          password = COALESCE($3, password),
          is_approved = COALESCE($4, is_approved),
          contact_no = COALESCE($5, contact_no),
          grade = COALESCE($6, grade),
          updated_at = NOW()
        WHERE id = $7
        RETURNING id, name, email, role, is_approved, contact_no, grade, created_at, updated_at`,
        [name, email, hashed, is_approved, contact_no, grade, id]
      );

      if (role === 'tutor' && (bio !== undefined || subjects !== undefined || location !== undefined)) {
        await db.query(
          `INSERT INTO tutors (user_id, bio, subjects, location)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id) DO UPDATE SET
             bio = COALESCE($2, tutors.bio),
             subjects = COALESCE($3, tutors.subjects),
             location = COALESCE($4, tutors.location)`,
          [id, bio ?? null, subjects ?? null, location ?? null]
        );
      }

      res.json(updated.rows[0]);
    } catch (error) {
      console.error('Admin update user error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// DELETE /api/admin/users/:id — delete student/tutor
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }
    const result = await db.query(
      `DELETE FROM users WHERE id = $1 AND role IN ('student','tutor') RETURNING id, name, email, role`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted', user: result.rows[0] });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/tutors — list tutors (optionally filter by approval status)
router.get('/tutors', async (req, res) => {
  try {
    const { status } = req.query; // 'pending', 'approved', 'all'
    let sql = `
      SELECT u.id, u.name, u.email, u.is_approved, u.created_at,
        t.bio, t.subjects, t.location, t.rating
      FROM users u
      LEFT JOIN tutors t ON t.user_id = u.id
      WHERE u.role = 'tutor'
    `;
    if (status === 'pending') {
      sql += ' AND u.is_approved = false';
    } else if (status === 'approved') {
      sql += ' AND u.is_approved = true';
    }
    sql += ' ORDER BY u.created_at DESC';

    const result = await db.query(sql);
    res.json(result.rows);
  } catch (error) {
    console.error('Get tutors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/class-requests — list class requests
router.get('/class-requests', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (status && status !== 'all') {
      params.push(status);
      where += ` AND cr.status = $${params.length}`;
    }

    const result = await db.query(
      `SELECT cr.*, u.name as tutor_name, u.email as tutor_email
       FROM class_requests cr
       JOIN users u ON cr.tutor_id = u.id
       ${where}
       ORDER BY cr.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get class requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/class-requests/:id/approve — approve request & create class
router.post('/class-requests/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const requestResult = await db.query('SELECT * FROM class_requests WHERE id = $1', [id]);
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }
    const request = requestResult.rows[0];
    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already reviewed' });
    }

    const createdClass = await db.query(
      `INSERT INTO classes (tutor_id, title, description, subject, grade, location, schedule, price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [
        request.tutor_id,
        request.title,
        request.description || '',
        request.subject,
        request.grade,
        request.location,
        request.schedule,
        request.price,
      ]
    );

    const cls = createdClass.rows[0];
    const updatedReq = await db.query(
      `UPDATE class_requests SET status = 'approved', reviewed_by = $1, reviewed_at = NOW(), class_id = $2
       WHERE id = $3
       RETURNING *`,
      [req.user.id, cls.id, id]
    );

    // Notify tutor
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'system')`,
      [request.tutor_id, 'Class Approved', `Your class "${request.title}" has been approved and added.`]
    );

    res.json({ message: 'Request approved', request: updatedReq.rows[0], class: cls });
  } catch (error) {
    console.error('Admin approve class request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/class-requests/:id/reject — reject request
router.post(
  '/class-requests/:id/reject',
  [body('note').optional().isString()],
  async (req, res) => {
    try {
      const { id } = req.params;
      const requestResult = await db.query('SELECT * FROM class_requests WHERE id = $1', [id]);
      if (requestResult.rows.length === 0) {
        return res.status(404).json({ message: 'Request not found' });
      }
      const request = requestResult.rows[0];
      if (request.status !== 'pending') {
        return res.status(400).json({ message: 'Request already reviewed' });
      }

      const note = typeof req.body.note === 'string' ? req.body.note : null;
      const updatedReq = await db.query(
        `UPDATE class_requests SET status = 'rejected', review_note = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [note, req.user.id, id]
      );

      await db.query(
        `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'system')`,
        [request.tutor_id, 'Class Rejected', `Your class "${request.title}" was rejected.`]
      );

      res.json({ message: 'Request rejected', request: updatedReq.rows[0] });
    } catch (error) {
      console.error('Admin reject class request error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// POST /api/admin/tutors/:id/approve
router.post('/tutors/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `UPDATE users SET is_approved = true, updated_at = NOW() WHERE id = $1 AND role = 'tutor' RETURNING id, name, email`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Notify tutor
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'system')`,
      [id, 'Account Approved', 'Your tutor account has been approved! You can now create classes.']
    );

    res.json({ message: 'Tutor approved', tutor: result.rows[0] });
  } catch (error) {
    console.error('Approve tutor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/tutors/:id/reject
router.post('/tutors/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;

    // Notify before deletion
    await db.query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'system')`,
      [id, 'Application Rejected', 'Your tutor application has been rejected. Please contact support for more info.']
    );

    // Mark as rejected (keep user but not approved)
    const result = await db.query(
      `UPDATE users SET is_approved = false, updated_at = NOW() WHERE id = $1 AND role = 'tutor' RETURNING id, name, email`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    res.json({ message: 'Tutor rejected', tutor: result.rows[0] });
  } catch (error) {
    console.error('Reject tutor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/analytics
router.get('/analytics', async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const startIso = start.toISOString();

    const [
      totalTutors,
      totalStudents,
      totalEnrollments,
      enrolledStudents,
      totalRevenue,
      pendingTutorApprovals,
      pendingClassRequests,
      enrollmentsByMonth,
      revenueByMonth,
      registrationsByMonth,
      topSubjects,
      tutorLeaderboard,
    ] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE role = 'tutor'"),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      db.query('SELECT COUNT(*) FROM enrollments'),
      db.query('SELECT COUNT(DISTINCT student_id) FROM enrollments'),
      db.query(`
        SELECT COALESCE(SUM(c.price), 0) as revenue
        FROM enrollments e
        JOIN classes c ON c.id = e.class_id
      `),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'tutor' AND is_approved = false"),
      db.query("SELECT COUNT(*) FROM class_requests WHERE status = 'pending'"),
      db.query(
        `SELECT DATE_TRUNC('month', enrolled_at) as month, COUNT(*)::int as count
         FROM enrollments
         WHERE enrolled_at >= $1
         GROUP BY 1
         ORDER BY 1 ASC`,
        [startIso]
      ),
      db.query(
        `SELECT DATE_TRUNC('month', e.enrolled_at) as month, COALESCE(SUM(c.price), 0)::float as revenue
         FROM enrollments e
         JOIN classes c ON c.id = e.class_id
         WHERE e.enrolled_at >= $1
         GROUP BY 1
         ORDER BY 1 ASC`,
        [startIso]
      ),
      db.query(
        `SELECT DATE_TRUNC('month', created_at) as month, COUNT(*)::int as count
         FROM users
         WHERE created_at >= $1 AND role IN ('student','tutor')
         GROUP BY 1
         ORDER BY 1 ASC`,
        [startIso]
      ),
      db.query(`
        SELECT subject, COUNT(*)::int as count
        FROM classes
        GROUP BY subject
        ORDER BY count DESC
        LIMIT 10
      `),
      db.query(`
        SELECT u.id, u.name, u.email,
          COUNT(DISTINCT c.id)::int as class_count,
          COUNT(DISTINCT e.id)::int as enrollment_count
        FROM users u
        LEFT JOIN classes c ON c.tutor_id = u.id
        LEFT JOIN enrollments e ON e.class_id = c.id
        WHERE u.role = 'tutor'
        GROUP BY u.id
        ORDER BY enrollment_count DESC, class_count DESC, u.created_at DESC
        LIMIT 50
      `),
    ]);

    const monthStarts = [];
    for (let i = 5; i >= 0; i -= 1) {
      monthStarts.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
    }
    const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

    const enrollMap = new Map(enrollmentsByMonth.rows.map((r) => [key(new Date(r.month)), r.count]));
    const revMap = new Map(revenueByMonth.rows.map((r) => [key(new Date(r.month)), Number(r.revenue)]));
    const regMap = new Map(registrationsByMonth.rows.map((r) => [key(new Date(r.month)), r.count]));

    const monthly_enrollments = monthStarts.map((d) => enrollMap.get(key(d)) || 0);
    const monthly_revenue = monthStarts.map((d) => revMap.get(key(d)) || 0);
    const monthly_registrations = monthStarts.map((d) => regMap.get(key(d)) || 0);

    res.json({
      total_tutors: parseInt(totalTutors.rows[0].count, 10),
      total_students: parseInt(totalStudents.rows[0].count, 10),
      total_enrollments: parseInt(totalEnrollments.rows[0].count, 10),
      enrolled_students: parseInt(enrolledStudents.rows[0].count, 10),
      total_revenue: Number(totalRevenue.rows[0].revenue) || 0,
      pending_approvals: parseInt(pendingTutorApprovals.rows[0].count, 10),
      pending_class_requests: parseInt(pendingClassRequests.rows[0].count, 10),
      monthly_enrollments,
      monthly_revenue,
      monthly_registrations,
      top_subjects: topSubjects.rows,
      tutors: tutorLeaderboard.rows,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/admin/classes — list all classes
router.get('/classes', async (req, res) => {
  try {
    const { q, grade, location, tutor } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (typeof q === 'string' && q.trim()) {
      params.push(`%${q.trim()}%`);
      where += ` AND (c.title ILIKE $${params.length} OR c.description ILIKE $${params.length} OR c.subject ILIKE $${params.length})`;
    }

    if (typeof grade === 'string' && grade.trim()) {
      params.push(`%${grade.trim()}%`);
      where += ` AND c.grade ILIKE $${params.length}`;
    }

    if (typeof location === 'string' && location.trim()) {
      params.push(`%${location.trim()}%`);
      where += ` AND c.location ILIKE $${params.length}`;
    }

    if (typeof tutor === 'string' && tutor.trim()) {
      params.push(`%${tutor.trim()}%`);
      where += ` AND u.name ILIKE $${params.length}`;
    }

    const result = await db.query(`
      SELECT c.*, u.name as tutor_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(DISTINCT e.id) as enrollment_count,
        c.promotion as is_promoted
      FROM classes c
      JOIN users u ON c.tutor_id = u.id
      LEFT JOIN reviews r ON r.class_id = c.id
      LEFT JOIN enrollments e ON e.class_id = c.id
      ${where}
      GROUP BY c.id, u.name
      ORDER BY c.created_at DESC
    `, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Admin get classes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/admin/classes — admin creates a class for a tutor
router.post(
  '/classes',
  [
    body('tutor_id').isInt().withMessage('Valid tutor_id is required'),
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

      const { tutor_id, title, subject, grade, schedule, location, price, description } = req.body;

      const tutor = await db.query(
        "SELECT id FROM users WHERE id = $1 AND role = 'tutor'",
        [tutor_id]
      );
      if (tutor.rows.length === 0) {
        return res.status(400).json({ message: 'tutor_id must belong to a tutor' });
      }

      const result = await db.query(
        `INSERT INTO classes (tutor_id, title, subject, grade, schedule, location, price, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [tutor_id, title, subject, grade, schedule, location, price, description || '']
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Admin create class error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// PUT /api/admin/classes/:id — admin updates any class
router.put('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db.query('SELECT id FROM classes WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const { title, subject, grade, schedule, location, price, description, promotion, is_active } = req.body;
    const result = await db.query(
      `UPDATE classes SET
        title = COALESCE($1, title),
        subject = COALESCE($2, subject),
        grade = COALESCE($3, grade),
        schedule = COALESCE($4, schedule),
        location = COALESCE($5, location),
        price = COALESCE($6, price),
        description = COALESCE($7, description),
        promotion = COALESCE($8, promotion),
        is_active = COALESCE($9, is_active),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *`,
      [title, subject, grade, schedule, location, price, description, promotion, is_active, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Admin update class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/admin/classes/:id — remove a class
router.delete('/classes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM classes WHERE id = $1 RETURNING id, title', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.json({ message: 'Class removed', class: result.rows[0] });
  } catch (error) {
    console.error('Admin delete class error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

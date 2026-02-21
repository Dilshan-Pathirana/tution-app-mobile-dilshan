const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — get user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/notifications/:id/read — mark notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const result = await db.query(
      'UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Read notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notifications/token — register push notification token
router.post('/token', auth, async (req, res) => {
  try {
    const { push_token } = req.body;
    if (!push_token) {
      return res.status(400).json({ message: 'Push token is required' });
    }
    await db.query(
      'UPDATE users SET push_token = $1, updated_at = NOW() WHERE id = $2',
      [push_token, req.user.id]
    );
    res.json({ message: 'Push token registered' });
  } catch (error) {
    console.error('Register token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/notifications/send — admin sends notification to users
router.post(
  '/send',
  auth,
  requireRole('admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('target').isIn(['all', 'students', 'tutors']).withMessage('Target must be all, students, or tutors'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
      }

      const { title, message, target } = req.body;

      // Get target users
      let userQuery = 'SELECT id, push_token FROM users WHERE 1=1';
      if (target === 'students') {
        userQuery += " AND role = 'student'";
      } else if (target === 'tutors') {
        userQuery += " AND role = 'tutor'";
      }

      const users = await db.query(userQuery);

      // Create in-app notifications for all target users
      const insertPromises = users.rows.map((user) =>
        db.query(
          `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, 'system')`,
          [user.id, title, message]
        )
      );
      await Promise.all(insertPromises);

      // Send push notifications via Firebase (if configured)
      const pushTokens = users.rows
        .filter((u) => u.push_token)
        .map((u) => u.push_token);

      if (pushTokens.length > 0) {
        try {
          const admin = require('firebase-admin');
          if (admin.apps.length > 0) {
            const messaging = admin.messaging();
            await messaging.sendEachForMulticast({
              tokens: pushTokens,
              notification: { title, body: message },
            });
          }
        } catch (fcmError) {
          console.error('FCM send error (non-fatal):', fcmError.message);
        }
      }

      res.json({
        message: `Notification sent to ${users.rows.length} ${target} users`,
        count: users.rows.length,
      });
    } catch (error) {
      console.error('Send notification error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;

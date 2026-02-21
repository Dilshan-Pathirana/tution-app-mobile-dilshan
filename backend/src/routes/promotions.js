const express = require('express');
const db = require('../database/db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// POST /api/promotions/pay — create a promotion for a class
router.post('/pay', auth, requireRole('tutor'), async (req, res) => {
  try {
    const { class_id, plan, payment_method_id } = req.body;

    // Verify class ownership
    const cls = await db.query('SELECT * FROM classes WHERE id = $1 AND tutor_id = $2', [class_id, req.user.id]);
    if (cls.rows.length === 0) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Plan pricing (in LKR)
    const plans = {
      week: { amount: 500, days: 7, label: '1 Week' },
      month: { amount: 1500, days: 30, label: '1 Month' },
      quarter: { amount: 3500, days: 90, label: '3 Months' },
    };

    if (!plans[plan]) {
      return res.status(400).json({ message: 'Invalid plan. Choose week, month, or quarter.' });
    }

    const selectedPlan = plans[plan];

    // Stripe payment processing
    let paymentIntentId = null;
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: selectedPlan.amount * 100, // Stripe works in cents
        currency: 'lkr',
        payment_method: payment_method_id,
        confirm: true,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          class_id: class_id.toString(),
          tutor_id: req.user.id.toString(),
          plan,
        },
      });
      paymentIntentId = paymentIntent.id;
    } catch (stripeError) {
      console.error('Stripe error:', stripeError.message);
      // In development, allow promotion without actual payment
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({ message: 'Payment failed: ' + stripeError.message });
      }
      paymentIntentId = `dev_${Date.now()}`;
    }

    // Calculate expiry
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + selectedPlan.days);

    // Create promotion
    const result = await db.query(
      `INSERT INTO promotions (tutor_id, class_id, plan, amount, payment_status, stripe_payment_id, start_date, end_date)
       VALUES ($1, $2, $3, $4, 'completed', $5, NOW(), $6)
       RETURNING *`,
      [req.user.id, class_id, plan, selectedPlan.amount, paymentIntentId, endDate]
    );

    // Mark class as promoted (simple flag used by list endpoints)
    await db.query('UPDATE classes SET promotion = true, updated_at = NOW() WHERE id = $1 AND tutor_id = $2', [class_id, req.user.id]);

    res.status(201).json({
      message: `Class promoted for ${selectedPlan.label}!`,
      promotion: result.rows[0],
    });
  } catch (error) {
    console.error('Promotion error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/promotions — tutor's promotions
router.get('/', auth, requireRole('tutor'), async (req, res) => {
  try {
    const result = await db.query(
      `SELECT p.*, c.title as class_title
       FROM promotions p
       JOIN classes c ON p.class_id = c.id
       WHERE p.tutor_id = $1
       ORDER BY p.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

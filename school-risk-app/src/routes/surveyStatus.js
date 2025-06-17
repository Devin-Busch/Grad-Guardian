const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const auth = require('../middleware/auth');

const TOTAL_Q1 = 6;
const TOTAL_Q2 = 6;

router.get('/', auth, async (req, res) => {
  const userId = req.user.user_id;
  try {
    const [q1, q2] = await Promise.all([
      db.query(`SELECT COUNT(*) FROM survey_responses WHERE user_id = $1 AND survey_num = 1`, [userId]),
      db.query(`SELECT COUNT(*) FROM survey_responses WHERE user_id = $1 AND survey_num = 2`, [userId]),
    ]);

    res.json({
      survey1_complete: parseInt(q1.rows[0].count) >= TOTAL_Q1,
      survey2_complete: parseInt(q2.rows[0].count) >= TOTAL_Q2
    });
  } catch (err) {
    console.error('Survey status check failed:', err);
    res.status(500).json({ error: 'Failed to check survey status' });
  }
});

module.exports = router;

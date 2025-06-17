/************************************************************
 * Risk Dashboard Route  (src/routes/riskDashboard.js)
 * Returns risk data for every student in the current school
 ************************************************************/
const express = require('express');
const router  = express.Router();
const db      = require('../utils/db');
const auth    = require('../middleware/auth');

//  GET /api/risk-dashboard
router.get('/', auth, async (req, res) => {
  try {
    /*---------------------------------------------------------
      Select from USERS (role='student') — not students table!
    ---------------------------------------------------------*/
    const students = await db.query(
      `SELECT
          u.user_id,
          u.first_name,
          u.last_name,
          u.grade_level,
          dr.risk_score,
          dr.risk_level
       FROM users u
       LEFT JOIN dropout_risk dr ON dr.user_id = u.user_id
       WHERE u.role = 'student' AND u.school_id = $1
       ORDER BY u.last_name, u.first_name`,
      [req.user.school_id]
    );

    /* ---------- pull flags for those user_ids ---------- */
    const flags = await db.query(
      `SELECT user_id, domain_name, flag_reason
         FROM risk_flags
        WHERE user_id = ANY($1::int[])`,
      [students.rows.map(s => s.user_id)]
    );

    /* ---------- group flags by user_id ---------- */
    const flagMap = {};
    for (const f of flags.rows) {
      if (!flagMap[f.user_id]) flagMap[f.user_id] = [];
      flagMap[f.user_id].push({ domain: f.domain_name, reason: f.flag_reason });
    }

    /* ---------- merge & send ---------- */
    const out = students.rows.map(s => ({
      ...s,
      flags: flagMap[s.user_id] || []
    }));

    res.json(out);
  } catch (err) {
    console.error('❌ Failed to load risk dashboard:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

module.exports = router;

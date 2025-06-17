const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const auth = require('../middleware/auth');

const EFFECT_SIZES_Q1 = [0.12, 0.15, 0.10, 0.20, 0.18, 0.14];
const EFFECT_SIZES_Q2 = [0.25, 0.22, 0.19, 0.30, 0.21, 0.20];

router.post('/:number', auth, async (req, res) => {
  const surveyNum = parseInt(req.params.number);
  const answers = req.body.answers;

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Missing answers object' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const userId = req.user.user_id;

    await client.query(
      `DELETE FROM survey_responses WHERE user_id = $1 AND survey_num = $2`,
      [userId, surveyNum]
    );

    for (const [qid, ans] of Object.entries(answers)) {
      await client.query(
        `INSERT INTO survey_responses (user_id, survey_num, question_id, answer)
         VALUES ($1, $2, $3, $4)`,
        [userId, surveyNum, parseInt(qid), ans]
      );
    }

    const r1 = await client.query(
      `SELECT COUNT(*) FROM survey_responses WHERE user_id = $1 AND survey_num = 1`,
      [userId]
    );
    const r2 = await client.query(
      `SELECT COUNT(*) FROM survey_responses WHERE user_id = $1 AND survey_num = 2`,
      [userId]
    );

    if (parseInt(r1.rows[0].count) >= EFFECT_SIZES_Q1.length &&
        parseInt(r2.rows[0].count) >= EFFECT_SIZES_Q2.length) {

      const q1 = (await client.query(
        `SELECT answer FROM survey_responses
         WHERE user_id = $1 AND survey_num = 1 ORDER BY question_id`, [userId]
      )).rows;

      const q2 = (await client.query(
        `SELECT answer FROM survey_responses
         WHERE user_id = $1 AND survey_num = 2 ORDER BY question_id`, [userId]
      )).rows;

      let score = 0;
      q1.forEach((q, i) => score += q.answer * EFFECT_SIZES_Q1[i]);
      q2.forEach((q, i) => score += q.answer * EFFECT_SIZES_Q2[i]);

      const riskPct = 100 - Math.min(Math.round(score * 10), 99);
      const level = riskPct >= 80 ? 'low' : riskPct >= 50 ? 'moderate' : 'high';

      await client.query(
        `INSERT INTO dropout_risk (user_id, risk_score, risk_level)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id)
         DO UPDATE SET risk_score = $2, risk_level = $3, calculated_at = NOW()`,
        [userId, riskPct, level]
      );

      await client.query(`DELETE FROM risk_flags WHERE user_id = $1`, [userId]);

      const lowAnswersQ1 = q1.map((q, i) => ({ id: i + 1, ans: q.answer })).filter(q => q.ans <= 1);
      const lowAnswersQ2 = q2.map((q, i) => ({ id: i + 1, ans: q.answer })).filter(q => q.ans <= 1);

      for (const q of lowAnswersQ1) {
        await client.query(`INSERT INTO risk_flags (user_id, domain_name, flag_reason)
                            VALUES ($1, $2, $3)`, [userId, 'School Engagement', `Q${q.id}: low score`]);
      }
      for (const q of lowAnswersQ2) {
        await client.query(`INSERT INTO risk_flags (user_id, domain_name, flag_reason)
                            VALUES ($1, $2, $3)`, [userId, 'Home/Background', `Q${q.id}: low score`]);
      }
    }

    await client.query('COMMIT');
    res.sendStatus(204);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Survey error:', err);
    res.status(500).json({ error: 'Survey submission failed' });
  } finally {
    client.release();
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Upload config
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${file.fieldname}${ext}`);
  }
});
const upload = multer({ storage });

// List all students in the school
router.get('/', auth, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT user_id, first_name, last_name, grade_level, dew_score, total_score
       FROM users
       WHERE role = 'student' AND school_id = $1
       ORDER BY last_name, first_name`,
      [req.user.school_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('List students error:', err);
    res.status(500).json({ error: 'Could not list students' });
  }
});

// Get full student details
router.get('/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const student = await db.query(
      `SELECT user_id, first_name, last_name, grade_level, support_staff, dew_score,
              total_score, notes, created_at, updated_at
       FROM users
       WHERE user_id = $1 AND school_id = $2 AND role = 'student'`,
      [id, req.user.school_id]
    );

    const domains = await db.query(
      `SELECT domain_name, score FROM student_domain_scores WHERE user_id = $1`,
      [id]
    );

    const riskFactors = await db.query(
      `SELECT factor_name FROM student_risk_factors WHERE user_id = $1`,
      [id]
    );

    const supports = await db.query(
      `SELECT support_name FROM supports WHERE user_id = $1`,
      [id]
    );

    const docs = await db.query(
      `SELECT filename, uploaded_at FROM student_documents WHERE user_id = $1`,
      [id]
    );

    res.json({
      ...student.rows[0],
      domain_scores: domains.rows,
      risk_factors: riskFactors.rows.map(r => r.factor_name),
      supports: supports.rows.map(s => s.support_name),
      documents: docs.rows
    });
  } catch (err) {
    console.error('Fetch student error:', err);
    res.status(500).json({ error: 'Could not fetch student' });
  }
});

// Update student info
router.put('/:id', auth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { dew_score, total_score, notes, domain_scores, supports, risk_factors } = req.body;

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `UPDATE users SET dew_score = $1, total_score = $2, notes = $3, updated_at = NOW()
       WHERE user_id = $4 AND school_id = $5 AND role = 'student'`,
      [dew_score, total_score, notes, id, req.user.school_id]
    );

    await client.query(`DELETE FROM student_domain_scores WHERE user_id = $1`, [id]);
    for (const { domain_name, score } of domain_scores || []) {
      await client.query(
        `INSERT INTO student_domain_scores (user_id, domain_name, score)
         VALUES ($1, $2, $3)`,
        [id, domain_name, score]
      );
    }

    await client.query(`DELETE FROM supports WHERE user_id = $1`, [id]);
    for (const support of supports || []) {
      await client.query(
        `INSERT INTO supports (user_id, support_name)
         VALUES ($1, $2)`,
        [id, support]
      );
    }

    await client.query(`DELETE FROM student_risk_factors WHERE user_id = $1`, [id]);
    for (const factor of risk_factors || []) {
      await client.query(
        `INSERT INTO student_risk_factors (user_id, factor_name)
         VALUES ($1, $2)`,
        [id, factor]
      );
    }

    await client.query(
      `INSERT INTO audit_log (user_email, role, action, table_name, record_id, changes)
       VALUES ($1, $2, 'update', 'users', $3, $4)`,
      [req.user.email, req.user.role, id, req.body]
    );

    await client.query('COMMIT');
    res.sendStatus(204);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update student error:', err);
    res.status(500).json({ error: 'Could not update student' });
  } finally {
    client.release();
  }
});

// Upload document
router.post('/:id/documents', auth, upload.single('document'), async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await db.query(
      `INSERT INTO student_documents (user_id, filename)
       VALUES ($1, $2)`,
      [id, req.file.filename]
    );
    res.sendStatus(204);
  } catch (err) {
    console.error('Upload doc error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Download document
router.get('/:id/documents/:filename', auth, async (req, res) => {
  const filePath = path.join(uploadDir, req.params.filename);
  res.download(filePath);
});

module.exports = router;

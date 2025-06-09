/***************************************************************************
 * E:\gradGaurdian\school-risk-app\src\routes\students.js
 *
 * Full CRUD for students + domain scores + teacher notes + versioned docs
 * All audit-logged. 
 ***************************************************************************/
const express       = require('express');
const router        = express.Router();
const db            = require('../db');
const roleCheck     = require('../middleware/roleCheck');
const { calculate } = require('../utils/riskEngine');
const { logAudit }  = require('../utils/auditLogger');

/* --------------------------------------------------------------------------
 * Helper: scope and role enforcement
 * ------------------------------------------------------------------------*/
function sameSchoolOnly(req, res, studentRow) {
  if (req.user.role === 'system_admin') {
    return res.status(403).json({ error: 'System admin cannot access student data' });
  }
  if (req.user.role === 'student') {
    if (req.user.uid !== studentRow.student_uid) {
      return res.status(403).json({ error: 'Students can only access their own record.' });
    }
  } else {
    if (studentRow.school_id !== req.user.school_id) {
      return res.status(403).json({ error: 'Cross-school access denied.' });
    }
  }
}

/* ==========================================================================
 * GET /students      — list basic student info
 * ========================================================================*/
router.get(
  '/',
  roleCheck(['teacher', 'school_admin']),
  async (req, res) => {
    try {
      const result = await db.query(
        `SELECT student_id, first_name, last_name, grade_level,
                dew_score, total_score, risk_level
         FROM students
         WHERE school_id = $1
         ORDER BY last_name, first_name`,
        [req.user.school_id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error('GET /students error →', err);
      res.status(500).json({ error: 'Failed to list students' });
    }
  }
);

/* ==========================================================================
 * GET /students/:id   — full student + domain scores
 * ========================================================================*/
router.get(
  '/:id',
  roleCheck(['teacher', 'school_admin', 'student']),
  async (req, res) => {
    const { id } = req.params;
    try {
      const studentRes = await db.query(
        'SELECT * FROM students WHERE student_id = $1',
        [id]
      );
      if (!studentRes.rows.length) return res.status(404).json({ error: 'Student not found' });
      const student = studentRes.rows[0];
      const deny = sameSchoolOnly(req, res, student);
      if (deny) return;

      const domains = await db.query(
        `SELECT d.domain_id, d.domain_name, s.score
         FROM student_domain_scores s
         JOIN domains d ON d.domain_id = s.domain_id
         WHERE s.student_id = $1`,
        [id]
      );

      res.json({ ...student, domain_scores: domains.rows });
    } catch (err) {
      console.error('GET /students/:id error →', err);
      res.status(500).json({ error: 'Failed to fetch student' });
    }
  }
);

/* ==========================================================================
 * POST /students      — create student + domain scores
 * ========================================================================*/
router.post(
  '/',
  roleCheck(['teacher', 'school_admin', 'student']),
  async (req, res) => {
    const {
      first_name, last_name, grade_level,
      support_staff, dew_score, notes,
      domain_scores = []
    } = req.body;

    const domainMap = {};
    domain_scores.forEach(ds => { domainMap[ds.domain_id] = ds.score });
    const { total, level } = calculate(domainMap);

    const school_id = req.user.role === 'student' ? req.body.school_id : req.user.school_id;

    try {
      await db.query('BEGIN');
      const insStu = await db.query(
        `INSERT INTO students
           (school_id, first_name, last_name, grade_level, support_staff,
            dew_score, total_score, risk_level, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         RETURNING student_id`,
        [school_id, first_name, last_name, grade_level,
         support_staff, dew_score, total, level, notes]
      );
      const studentId = insStu.rows[0].student_id;

      const insScore = `INSERT INTO student_domain_scores
                         (student_id, domain_id, score)
                       VALUES ($1,$2,$3)`;
      for (const ds of domain_scores) {
        await db.query(insScore, [studentId, ds.domain_id, ds.score]);
      }

      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  school_id,
        action:     'create_student',
        table:      'students',
        record_id:  studentId,
        changes:    { after: { first_name, last_name, grade_level } }
      });

      await db.query('COMMIT');
      res.status(201).json({ student_id: studentId });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('POST /students error →', err);
      res.status(500).json({ error: 'Failed to create student' });
    }
  }
);

/* ==========================================================================
 * PUT /students/:id   — update student + domain scores
 * ========================================================================*/
router.put(
  '/:id',
  roleCheck(['teacher', 'school_admin']),
  async (req, res) => {
    const { id } = req.params;
    const {
      first_name, last_name, grade_level,
      support_staff, dew_score, notes,
      domain_scores = []
    } = req.body;

    try {
      const befRes = await db.query('SELECT * FROM students WHERE student_id = $1', [id]);
      if (!befRes.rows.length) return res.status(404).json({ error: 'Student not found' });
      const before = befRes.rows[0];
      if (before.school_id !== req.user.school_id) {
        return res.status(403).json({ error: 'Cross-school denied' });
      }

      const domainMap = {};
      domain_scores.forEach(ds => { domainMap[ds.domain_id] = ds.score });
      const { total, level } = calculate(domainMap);

      await db.query('BEGIN');
      await db.query(
        `UPDATE students SET
           first_name=$1, last_name=$2, grade_level=$3,
           support_staff=$4, dew_score=$5,
           total_score=$6, risk_level=$7, notes=$8,
           updated_at=NOW()
         WHERE student_id=$9`,
        [first_name, last_name, grade_level,
         support_staff, dew_score, total, level, notes, id]
      );

      await db.query('DELETE FROM student_domain_scores WHERE student_id=$1', [id]);
      for (const ds of domain_scores) {
        await db.query(insScore, [id, ds.domain_id, ds.score]);
      }

      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  req.user.school_id,
        action:     'update_student',
        table:      'students',
        record_id:  id,
        changes:    { before: { first_name: before.first_name, last_name: before.last_name }, after: { first_name, last_name } }
      });

      await db.query('COMMIT');
      res.json({ message: 'Student updated' });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('PUT /students/:id error →', err);
      res.status(500).json({ error: 'Failed to update student' });
    }
  }
);

/* ==========================================================================
 * DELETE /students/:id  — delete student
 * ========================================================================*/
router.delete(
  '/:id',
  roleCheck(['teacher', 'school_admin']),
  async (req, res) => {
    const { id } = req.params;
    try {
      const befRes = await db.query('SELECT * FROM students WHERE student_id=$1', [id]);
      if (!befRes.rows.length) return res.status(404).json({ error: 'Student not found' });
      const before = befRes.rows[0];
      if (before.school_id !== req.user.school_id) {
        return res.status(403).json({ error: 'Cross-school denied' });
      }

      await db.query('DELETE FROM students WHERE student_id=$1', [id]);
      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  req.user.school_id,
        action:     'delete_student',
        table:      'students',
        record_id:  id,
        changes:    { before }
      });

      res.json({ message: 'Student deleted' });
    } catch (err) {
      console.error('DELETE /students/:id error →', err);
      res.status(500).json({ error: 'Failed to delete student' });
    }
  }
);

/* ==========================================================================
 * Document API: versioned docs
 * ========================================================================*/
// GET latest document
router.get(
  '/:id/document',
  roleCheck(['teacher', 'school_admin', 'student']),
  async (req, res) => {
    const { id } = req.params;
    try {
      const docRes = await db.query(
        'SELECT d.document_id, d.content, d.updated_at FROM student_documents d JOIN students s ON s.student_id=d.student_id WHERE s.student_id=$1',
        [id]
      );
      if (!docRes.rows.length) return res.status(404).json({ error: 'Document not found.' });
      res.json(docRes.rows[0]);
    } catch (err) {
      console.error('GET /students/:id/document error →', err);
      res.status(500).json({ error: 'Failed to fetch document.' });
    }
  }
);

// PUT new document revision
/**
 * PUT /students/:id/document  — upsert versioned document
 */
router.put(
  '/:id/document',
  roleCheck(['teacher', 'school_admin']),
  async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string.' });
    }

    try {
      await db.query('BEGIN');

      // 1) Try to fetch existing document_id
      const docRes = await db.query(
        'SELECT document_id FROM student_documents WHERE student_id = $1',
        [id]
      );

      let document_id;
      if (docRes.rows.length) {
        // already exists
        document_id = docRes.rows[0].document_id;
      } else {
        // first save → create master document
        const ins = await db.query(
          `INSERT INTO student_documents (student_id, content)
           VALUES ($1, $2)
           RETURNING document_id`,
          [id, content]
        );
        document_id = ins.rows[0].document_id;
      }

      // 2) Insert a revision
      await db.query(
        `INSERT INTO student_doc_revisions
           (document_id, content, author_email)
         VALUES ($1, $2, $3)`,
        [document_id, content, req.user.email]
      );

      // 3) Always update the master record to latest content/timestamp
      await db.query(
        `UPDATE student_documents
           SET content = $1, updated_at = NOW()
         WHERE document_id = $2`,
        [content, document_id]
      );

      // 4) Audit log
      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  req.user.school_id,
        action:     'update_document',
        table:      'student_documents',
        record_id:  document_id,
        changes:    { after: { content } }
      });

      await db.query('COMMIT');
      return res.json({ message: 'Document saved.' });
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('PUT /students/:id/document error →', err);
      return res.status(500).json({ error: 'Failed to save document.' });
    }
  }
);


// GET revision list
router.get(
  '/:id/document/revisions',
  roleCheck(['teacher', 'school_admin']),
  async (req, res) => {
    const { id } = req.params;
    try {
      const docIdRes = await db.query('SELECT document_id FROM student_documents WHERE student_id=$1', [id]);
      if (!docIdRes.rows.length) return res.status(404).json({ error: 'Document not found.' });
      const document_id = docIdRes.rows[0].document_id;

      const revs = await db.query(
        `SELECT revision_id, author_email, created_at
         FROM student_doc_revisions
         WHERE document_id=$1
         ORDER BY created_at DESC`,
        [document_id]
      );
      res.json(revs.rows);
    } catch (err) {
      console.error('GET /students/:id/document/revisions error →', err);
      res.status(500).json({ error: 'Failed to fetch revisions.' });
    }
  }
);

// GET single revision
router.get(
  '/:id/document/revisions/:rev',
  roleCheck(['teacher', 'school_admin']),
  async (req, res) => {
    const { rev } = req.params;
    try {
      const revRes = await db.query(
        `SELECT revision_id, content, author_email, created_at
         FROM student_doc_revisions
         WHERE revision_id=$1`,
        [rev]
      );
      if (!revRes.rows.length) return res.status(404).json({ error: 'Revision not found.' });
      res.json(revRes.rows[0]);
    } catch (err) {
      console.error('GET /students/:id/document/revisions/:rev error →', err);
      res.status(500).json({ error: 'Failed to fetch revision.' });
    }
  }
);

module.exports = router;

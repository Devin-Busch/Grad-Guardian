/************************************************************
 * E:\gradGaurdian\school-risk-app\src\routes\schools.js
 *
 * CRUD for schools, only accessible by system_admin
 ************************************************************/
const express    = require('express');
const router     = express.Router();
const db         = require('../db');
const roleCheck  = require('../middleware/roleCheck');
const { logAudit } = require('../utils/auditLogger');

/**
 * GET /schools
 *   List all schools
 */
router.get(
  '/',
  roleCheck(['system_admin']),
  async (_req, res) => {
    try {
      const result = await db.query(
        `SELECT school_id, school_name, district_name
         FROM schools
         ORDER BY district_name, school_name`
      );
      res.json(result.rows);
    } catch (err) {
      console.error('GET /schools error →', err);
      res.status(500).json({ error: 'Failed to list schools' });
    }
  }
);

/**
 * POST /schools
 *   Body: { school_name, district_name }
 *   Create a new school
 */
router.post(
  '/',
  roleCheck(['system_admin']),
  async (req, res) => {
    const { school_name, district_name } = req.body;
    if (!school_name || !district_name) {
      return res.status(400).json({ error: 'Both school_name and district_name required.' });
    }
    try {
      const insertRes = await db.query(
        `INSERT INTO schools (school_name, district_name)
         VALUES ($1, $2)
         RETURNING school_id`,
        [school_name, district_name]
      );
      const id = insertRes.rows[0].school_id;

      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  null,
        action:     'create_school',
        table:      'schools',
        record_id:  id,
        changes:    { after: { school_name, district_name } }
      });

      res.status(201).json({ school_id: id });
    } catch (err) {
      console.error('POST /schools error →', err);
      res.status(500).json({ error: 'Failed to create school' });
    }
  }
);

/**
 * PUT /schools/:id
 *   Body: { school_name?, district_name? }
 *   Update an existing school
 */
router.put(
  '/:id',
  roleCheck(['system_admin']),
  async (req, res) => {
    const { id } = req.params;
    const { school_name, district_name } = req.body;
    if (!school_name && !district_name) {
      return res.status(400).json({ error: 'At least one of school_name or district_name required.' });
    }
    try {
      // Fetch before state
      const beforeRes = await db.query(
        'SELECT school_name, district_name FROM schools WHERE school_id = $1',
        [id]
      );
      if (!beforeRes.rows.length) {
        return res.status(404).json({ error: 'School not found.' });
      }
      const before = beforeRes.rows[0];

      // Build dynamic set
      const sets = [];
      const params = [];
      let idx = 1;
      if (school_name) {
        sets.push(`school_name = $${idx++}`);
        params.push(school_name);
      }
      if (district_name) {
        sets.push(`district_name = $${idx++}`);
        params.push(district_name);
      }
      params.push(id);

      await db.query(
        `UPDATE schools SET ${sets.join(', ')} WHERE school_id = $${idx}`,
        params
      );

      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  null,
        action:     'update_school',
        table:      'schools',
        record_id:  id,
        changes:    { before, after: { school_name, district_name } }
      });

      res.json({ message: 'School updated.' });
    } catch (err) {
      console.error(`PUT /schools/${id} error →`, err);
      res.status(500).json({ error: 'Failed to update school.' });
    }
  }
);

/**
 * DELETE /schools/:id
 *   Remove a school (cascades to users & students via FKs if set)
 */
router.delete(
  '/:id',
  roleCheck(['system_admin']),
  async (req, res) => {
    const { id } = req.params;
    try {
      // Fetch before
      const beforeRes = await db.query(
        'SELECT school_name, district_name FROM schools WHERE school_id = $1',
        [id]
      );
      if (!beforeRes.rows.length) {
        return res.status(404).json({ error: 'School not found.' });
      }
      const before = beforeRes.rows[0];

      await db.query('DELETE FROM schools WHERE school_id = $1', [id]);

      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  null,
        action:     'delete_school',
        table:      'schools',
        record_id:  id,
        changes:    { before }
      });

      res.json({ message: 'School deleted.' });
    } catch (err) {
      console.error(`DELETE /schools/${id} error →`, err);
      res.status(500).json({ error: 'Failed to delete school.' });
    }
  }
);

module.exports = router;

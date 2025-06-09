/************************************************************
 * E:\gradGaurdian\school-risk-app\src\routes\users.js
 *
 * CRUD + audit logging for user management:
 *  • GET    /users
 *  • POST   /users       (invite teacher)
 *  • PUT    /users/:email (change role)
 *  • DELETE /users/:email (remove user)
 ************************************************************/
const express      = require('express');
const router       = express.Router();
const db           = require('../db');
const roleCheck    = require('../middleware/roleCheck');
const { logAudit } = require('../utils/auditLogger');

/**
 * GET /users
 */
router.get(
  '/',
  roleCheck(['school_admin', 'system_admin']),
  async (req, res) => {
    try {
      const q = req.user.role === 'system_admin'
        ? `SELECT email, role, school_id, created_at FROM users
           ORDER BY school_id, role, email`
        : `SELECT email, role, school_id, created_at FROM users
           WHERE school_id = $1
           ORDER BY role, email`;
      const params = req.user.role === 'system_admin'
        ? []
        : [req.user.school_id];
      const result = await db.query(q, params);
      res.json(result.rows);
    } catch (err) {
      console.error('GET /users error →', err);
      res.status(500).json({ error: 'Failed to list users' });
    }
  }
);

/**
 * POST /users  — invite new teacher
 */
router.post(
  '/',
  roleCheck(['school_admin', 'system_admin']),
  async (req, res) => {
    const { email, school_id: bodySchoolId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Missing email in request body.' });
    }
    const school_id = req.user.role === 'system_admin'
      ? (bodySchoolId || req.user.school_id)
      : req.user.school_id;

    try {
      // Create teacher account
      await db.query(
        `INSERT INTO users (email, role, school_id)
         VALUES ($1, 'teacher', $2)
         ON CONFLICT (email) DO NOTHING`,
        [email, school_id]
      );

      // Audit log
      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  req.user.school_id,
        action:     'invite_user',
        table:      'users',
        record_id:  email,
        changes:    { after: { email, role: 'teacher', school_id } }
      });

      res.status(201).json({ message: `Teacher account created for ${email}` });
    } catch (err) {
      console.error('POST /users error →', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
);

/**
 * PUT /users/:email  — update role
 */
router.put(
  '/:email',
  roleCheck(['school_admin', 'system_admin']),
  async (req, res) => {
    const { email }      = req.params;
    const { role: newRole } = req.body;
    const validRoles     = ['system_admin','school_admin','teacher','student'];
    if (!validRoles.includes(newRole)) {
      return res.status(400).json({ error: 'Invalid role specified.' });
    }

    try {
      // Fetch existing
      const userRes = await db.query(
        'SELECT email, role, school_id FROM users WHERE email = $1',
        [email]
      );
      if (!userRes.rows.length) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const before = userRes.rows[0];

      // Scope checks
      if (req.user.role === 'school_admin') {
        if (before.school_id !== req.user.school_id) {
          return res.status(403).json({ error: 'Cannot modify users outside your school.' });
        }
        if (newRole === 'system_admin') {
          return res.status(403).json({ error: 'School admin cannot grant system_admin.' });
        }
      }

      // Update role
      await db.query(
        'UPDATE users SET role = $1 WHERE email = $2',
        [newRole, email]
      );

      // Audit log
      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  req.user.school_id,
        action:     'update_user_role',
        table:      'users',
        record_id:  email,
        changes:    { before: { role: before.role }, after: { role: newRole } }
      });

      res.json({ message: `Updated ${email} → role = ${newRole}` });
    } catch (err) {
      console.error(`PUT /users/${email} error →`, err);
      res.status(500).json({ error: 'Failed to update user role.' });
    }
  }
);

/**
 * DELETE /users/:email  — remove user
 */
router.delete(
  '/:email',
  roleCheck(['school_admin', 'system_admin']),
  async (req, res) => {
    const { email } = req.params;
    try {
      // Fetch existing
      const userRes = await db.query(
        'SELECT email, role, school_id FROM users WHERE email = $1',
        [email]
      );
      if (!userRes.rows.length) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const before = userRes.rows[0];

      // Scope checks
      if (req.user.role === 'school_admin') {
        if (before.school_id !== req.user.school_id) {
          return res.status(403).json({ error: 'Cannot remove users outside your school.' });
        }
        if (before.role === 'system_admin') {
          return res.status(403).json({ error: 'Cannot remove a system_admin.' });
        }
      }

      // Delete
      await db.query('DELETE FROM users WHERE email = $1', [email]);

      // Audit log
      await logAudit({
        user_email: req.user.email,
        role:       req.user.role,
        school_id:  req.user.school_id,
        action:     'delete_user',
        table:      'users',
        record_id:  email,
        changes:    { before }
      });

      res.json({ message: `Deleted user ${email}` });
    } catch (err) {
      console.error(`DELETE /users/${email} error →`, err);
      res.status(500).json({ error: 'Failed to delete user.' });
    }
  }
);

module.exports = router;

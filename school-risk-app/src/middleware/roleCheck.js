// src/middleware/roleCheck.js
//---------------------------------------------------------
// Middleware factory: restrict route to specific roles.
//   usage:  app.use('/path', roleCheck(['teacher','school_admin']))
//
//   - Looks up the caller in the `users` table by email
//   - Attaches `req.user.role`  and `req.user.school_id`
//   - Returns 403 if role not in allowedRoles array
//---------------------------------------------------------
const db = require('../db');

module.exports = function roleCheck(allowedRoles) {
  return async function (req, res, next) {
    try {
      const email = req.user.email; // set by auth middleware
      const result = await db.query(
        'SELECT role, school_id FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        return res
          .status(403)
          .json({ error: 'User email not registered in system.' });
      }

      const { role, school_id } = result.rows[0];
      req.user.role = role;
      req.user.school_id = school_id; // may be null for system_admin

      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Insufficient role.' });
      }

      next();
    } catch (err) {
      console.error('roleCheck error →', err);
      res.status(500).json({ error: 'Role check failed.' });
    }
  };
};

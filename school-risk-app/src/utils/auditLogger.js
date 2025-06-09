// src/utils/auditLogger.js
//------------------------------------------------------
// Generic audit helper.  Call it after any mutation.
//------------------------------------------------------
const db = require('../db');

/**
 * @param {Object} opts
 *   user_email  – req.user.email
 *   role        – req.user.role
 *   school_id   – req.user.school_id
 *   action      – 'create' | 'update' | 'delete'
 *   table       – e.g. 'students'
 *   record_id   – the PK value
 *   changes     – JSON object (can be { before, after })
 */
async function logAudit(opts) {
  try {
    await db.query(
      `INSERT INTO audit_log
       (user_email, role, school_id, action,
        table_name, record_id, changes)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        opts.user_email,
        opts.role,
        opts.school_id,
        opts.action,
        opts.table,
        opts.record_id,
        opts.changes
      ]
    );
  } catch (err) {
    console.error('⚠️  Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };

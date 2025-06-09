// E:\gradGaurdian\school-risk-app\src\middleware\auth.js
const admin = require('firebase-admin');
const db    = require('../db');
const svc   = require('../../serviceAccountKey.json'); // adjust path

// Initialize Firebase Admin with your service account
try {
  admin.initializeApp({
    credential: admin.credential.cert(svc)
  });
} catch (e) {
  // ignore "already initialized" errors
}

/**
 * Verifies the Firebase ID token, then looks up
 * the user in Postgres to get role & school_id.
 */
module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Bearer token' });
  }

  const idToken = header.split(' ')[1];
  try {
    // 1) Verify in Firebase
    const decoded = await admin.auth().verifyIdToken(idToken);
    const email   = decoded.email;

    // 2) Lookup in Postgres
    const result = await db.query(
      'SELECT role, school_id FROM users WHERE email = $1',
      [email]
    );
    if (!result.rows.length) {
      return res.status(403).json({ error: 'User not found in database.' });
    }

    // 3) Attach full user info
    req.user = {
      email:     email,
      role:      result.rows[0].role,
      school_id: result.rows[0].school_id
    };

    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(403).json({ error: 'Authentication / authorization failed.' });
  }
};

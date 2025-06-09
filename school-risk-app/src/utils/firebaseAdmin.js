// src/utils/firebaseAdmin.js
//---------------------------------------------------------
// Initializes the Firebase Admin SDK ONE time.
//---------------------------------------------------------

const admin = require('firebase-admin');
const path = require('path');

// Absolute path to the service-account json
const serviceAccount = require(path.join(
  __dirname,
  '..',
  '..',
  'firebase-service-account.json'
));

/**
 * We only need app.initializeApp once. If nodemon reloads
 * the file, admin.apps will already contain an app instance.
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
}

module.exports = admin;

const fs = require('fs');

let initialized = false;

const tryParseJson = (value) => {
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const tryParseBase64Json = (value) => {
  if (typeof value !== 'string') return null;
  try {
    const json = Buffer.from(value, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
};

module.exports = function initFirebaseAdmin() {
  if (initialized) return;

  const admin = require('firebase-admin');
  if (admin.apps.length > 0) {
    initialized = true;
    return;
  }

  const configured = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!configured) return;

  let serviceAccount = null;

  // Option A: a JSON string
  serviceAccount = tryParseJson(configured);

  // Option B: base64-encoded JSON
  if (!serviceAccount) serviceAccount = tryParseBase64Json(configured);

  // Option C: a filesystem path
  if (!serviceAccount && fs.existsSync(configured)) {
    try {
      serviceAccount = JSON.parse(fs.readFileSync(configured, 'utf8'));
    } catch {
      serviceAccount = null;
    }
  }

  if (!serviceAccount) {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT is set but could not be parsed. Skipping Firebase Admin init.');
    return;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    initialized = true;
    console.log('✅ Firebase Admin initialized');
  } catch (err) {
    console.warn('⚠️  Firebase Admin init failed. Push notifications will be disabled.', err.message);
  }
};

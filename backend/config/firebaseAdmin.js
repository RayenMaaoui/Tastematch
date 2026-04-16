const admin = require('firebase-admin');

let firebaseApp;

function getPrivateKey() {
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  return rawKey ? rawKey.replace(/\\n/g, '\n') : undefined;
}

function initializeFirebaseAdmin() {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY in backend/.env'
    );
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return firebaseApp;
}

function getFirebaseAuth() {
  return initializeFirebaseAdmin().auth();
}

module.exports = { getFirebaseAuth };

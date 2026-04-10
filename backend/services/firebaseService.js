const admin = require('firebase-admin');

let db;

function initFirebase() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  }
  db = admin.firestore();
  return db;
}

function getDb() {
  if (!db) initFirebase();
  return db;
}

module.exports = { initFirebase, getDb, admin };

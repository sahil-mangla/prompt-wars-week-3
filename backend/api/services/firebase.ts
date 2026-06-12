import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs';

let isFirebaseInitialized = false;

try {
  if (process.env.NODE_ENV !== 'test' && admin.apps.length === 0) {
    const serviceAccountPath = path.join(__dirname, '../../service-account.json');
    if (fs.existsSync(serviceAccountPath)) {
      admin.initializeApp({ credential: admin.credential.cert(serviceAccountPath) });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      } catch (err: any) {
        console.error('[Firestore] Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', err.message || err);
        admin.initializeApp();
      }
    } else {
      admin.initializeApp();
    }
    isFirebaseInitialized = true;
    console.log('[Firestore] Firebase Admin initialized.');
  }
} catch (e) {
  console.warn('[Firestore] Firebase init failed. Using in-memory fallback.');
}

export { admin, isFirebaseInitialized };

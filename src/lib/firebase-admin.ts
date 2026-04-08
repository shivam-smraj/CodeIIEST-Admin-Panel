// Server-side Firebase Admin SDK — Node.js only (not Edge-compatible)
import admin from "firebase-admin";

function initAdmin() {
  if (!admin.apps.length) {
    const projectId   = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawKey      = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !rawKey) {
      throw new Error(
        "[firebase-admin] Missing env vars. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
      );
    }

    // .env files store \n as a literal two-char sequence; convert to real newlines.
    // Also handle the case where the key already contains real newlines (rare).
    const privateKey = rawKey.includes("\\n")
      ? rawKey.replace(/\\n/g, "\n")
      : rawKey;

    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  }
  return admin.auth();
}

export const adminAuth = initAdmin();

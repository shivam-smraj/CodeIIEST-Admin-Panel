// Server-side Firebase Admin SDK — Node.js only (not Edge-compatible)
import admin from "firebase-admin";

function initAdmin() {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel env stores private key with literal \\n → replace with real newlines
        privateKey:  process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return admin.auth();
}

export const adminAuth = initAdmin();

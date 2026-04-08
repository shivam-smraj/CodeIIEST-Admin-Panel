// Client-side Firebase SDK
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:            "AIzaSyAAWa93HXv4TdAx8RR-itUmWzXRFIBr3F0",
  authDomain:        "codeiiest-c0bf7.firebaseapp.com",
  projectId:         "codeiiest-c0bf7",
  storageBucket:     "codeiiest-c0bf7.firebasestorage.app",
  messagingSenderId: "106563691874",
  appId:             "1:106563691874:web:c15d6b66b1f4f8cfa6783b",
};

// Prevent duplicate app initialisation in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const firebaseAuth   = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

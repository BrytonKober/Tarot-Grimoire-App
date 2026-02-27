import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBVWbTWBjPhbHFonaxyPO1DTMigLA2CTyg",
  authDomain: "tarot-grimoire.firebaseapp.com",
  projectId: "tarot-grimoire",
  storageBucket: "tarot-grimoire.firebasestorage.app",
  messagingSenderId: "178235546708",
  appId: "1:178235546708:web:8759e99d63d7709d4ca1c1",
  measurementId: "G-MJ2W950K0S"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { app, analytics };

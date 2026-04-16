import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBRl0f9kGwcuLC4JG5h-gnGEl-eHdC5QzA",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "tastematch-9465e.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tastematch-9465e",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "tastematch-9465e.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "459169446146",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:459169446146:web:cc1b40d659b9ddac9a2a1b",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-8GGM1MMD4K",
};

const firebaseApp = initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    const idToken = await result.user.getIdToken();

    return {
      idToken,
      fullName: result.user.displayName || "",
      email: result.user.email || "",
      avatar: result.user.photoURL || "",
    };
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

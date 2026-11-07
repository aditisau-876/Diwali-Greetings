import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDIyIWPF1MFOug9Ksc08rzHp9RZYOei83o",
  authDomain: "diwali-digital-diya-1f0ba.firebaseapp.com",
  projectId: "diwali-digital-diya-1f0ba",
  storageBucket: "diwali-digital-diya-1f0ba.firebasestorage.app",
  messagingSenderId: "145373873505",
  appId: "1:145373873505:web:4505569cc18b8f581ff120"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Always let the visitor choose which Google account to use.
googleProvider.setCustomParameters({ prompt: "select_account" });
export const db = getFirestore(app);
export const storage = getStorage(app);
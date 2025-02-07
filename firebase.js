// firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBHn8jjwqS-FM2Z3Tpc45xMNA_k8upcSsU",
  authDomain: "oiceapp.firebaseapp.com",
  projectId: "oiceapp",
  storageBucket: "oiceapp.appspot.com",
  messagingSenderId: "775772248681",
  appId: "1:775772248681:android:99f0953c872ee95517a0f8",
};

// Initialize the Firebase app only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const firestore = getFirestore(app);

export { app, auth, firestore };

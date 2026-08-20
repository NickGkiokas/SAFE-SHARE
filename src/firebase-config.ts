// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAVzn3fWGONkA6uxt64sjNPc6OpCw6nMrE",
  authDomain: "safeshare-app-8ed3f.firebaseapp.com",
  projectId: "safeshare-app-8ed3f",
  storageBucket: "safeshare-app-8ed3f.firebasestorage.app",
  messagingSenderId: "204332900522",
  appId: "1:204332900522:web:e6eb68c351ca66f6ab30d3",
  measurementId: "G-MGG76V5B15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export const auth = getAuth(app);
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBSjWkWxJPdeopbQUTPcJFaZaA4j5-jL1I",
  authDomain: "gpsapplication-eb206.firebaseapp.com",
  projectId: "gpsapplication-eb206",
  storageBucket: "gpsapplication-eb206.firebasestorage.app",
  messagingSenderId: "464447578600",
  appId: "1:464447578600:web:45f45c0de894d904ebc45d",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

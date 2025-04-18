import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database"; // Import Realtime Database


const firebaseConfig = {
  apiKey: "AIzaSyDQ8ySH3u1xgufZzhk8kvlhd7DdDCObrsc",
  authDomain: "demo1-6a68e.firebaseapp.com",
  databaseURL: "https://demo1-6a68e-default-rtdb.firebaseio.com/",
  projectId: "demo1-6a68e",
  storageBucket: "demo1-6a68e.firebasestorage.app",
  messagingSenderId: "487444103403",
  appId: "1:487444103403:web:29e8780025ed32879efeae",
  measurementId: "G-4GWLGN2TV4"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const realtimeDb = getDatabase(app); // ✅ Initialize Realtime Database

export { db, realtimeDb }; // ✅ Export both Firestore & Realtime Database

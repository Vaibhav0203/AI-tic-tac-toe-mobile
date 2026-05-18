import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD3VogPgm0AwLPX49yeFsJtH1Mauc1aje4",
  authDomain: "tictatoewithai.firebaseapp.com",
  projectId: "tictatoewithai",
  storageBucket: "tictatoewithai.firebasestorage.app",
  messagingSenderId: "636514850845",
  appId: "1:636514850845:web:99029a8a770558ff900ef4",
  measurementId: "G-R7J6PMV938"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

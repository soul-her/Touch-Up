import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyASMwQq6AwESgR6soOpRpebJ7-cjoNdD-Y",
  authDomain: "touch-up-de835.firebaseapp.com",
  projectId: "touch-up-de835",
  storageBucket: "touch-up-de835.appspot.com",
  messagingSenderId: "592539791985",
  appId: "1:592539791985:web:98a4d2bf88dab48ffee1d0",
  measurementId: "G-NFGHQQCMPK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
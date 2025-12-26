import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBuGxiSMhYQyhGxoQkz4ipy_TC6Gok-_k4",
  authDomain: "xann-8a966.firebaseapp.com",
  databaseURL:
    "https://xann-8a966-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "xann-8a966",
  storageBucket: "xann-8a966.firebasestorage.app",
  messagingSenderId: "996989485176",
  appId: "1:996989485176:web:5e7f5e92c3275755546d8d",
};

const app = initializeApp(firebaseConfig);

// ✅ DÙNG CÁI NÀY
export const realtimeDb = getDatabase(app);

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyA3WzpnR1e-qSa0A9E_Jj24Spsex1NWfHU",
    authDomain: "familiafifacup.firebaseapp.com",
    projectId: "familiafifacup",
    storageBucket: "familiafifacup.firebasestorage.app",
    messagingSenderId: "875569939878",
    appId: "1:875569939878:web:2d2a9816cd77a602ee3b67"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

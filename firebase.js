import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD98AmOX8eHYn2QSxU8ImcRGzyDqQ9QXQs",
  authDomain: "rapido-global.firebaseapp.com",
  projectId: "rapido-global",
  storageBucket: "rapido-global.firebasestorage.app",
  messagingSenderId: "205317876725",
  appId: "1:205317876725:web:8da4ca7164e2bc0022cebc"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

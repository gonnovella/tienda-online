import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-storage.js";

// Configuración de Firebase
export const firebaseConfig = {
    apiKey: "AIzaSyBjxpUkNnXOf3VjvgR3cI6Hpw_iZXaP-oc",
    authDomain: "tiendaonlinetfg.firebaseapp.com",
    projectId: "tiendaonlinetfg",
    storageBucket: "tiendaonlinetfg.firebasestorage.app",
    messagingSenderId: "228446562012",
    appId: "1:228446562012:web:fc25595dd53eab30283619",
    measurementId: "G-ELPZR7RPW2"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

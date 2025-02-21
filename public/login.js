import { firebaseConfig } from "./firebase-config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.3.0/firebase-auth.js";

// ✅ Esperar a que el DOM se cargue antes de ejecutar el código
document.addEventListener("DOMContentLoaded", () => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const formLogin = document.getElementById("formLogin");

    if (!formLogin) {
        console.error("❌ ERROR: No se encontró el formulario de login.");
        return;
    }

    formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if (email !== "admin@tuweb.com" || password !== "admin1") {
            alert("❌ Credenciales incorrectas. Solo el administrador puede acceder.");
            return;
        }

        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert("✅ Inicio de sesión exitoso.");
            window.location.href = "admin-dashboard.html";
        } catch (error) {
            console.error("❌ Error en el inicio de sesión:", error);
            alert("❌ Error al iniciar sesión. Verifica tu email y contraseña.");
        }
    });
});

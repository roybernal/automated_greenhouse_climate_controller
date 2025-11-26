// dashboard/js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// --- USA TU MISMA CONFIGURACIÓN DE FIREBASE AQUÍ ---
const firebaseConfig = {
    apiKey: "AIzaSyD7fWCpBesKzl8rwsTzmsRkHuE9S49mvxs", // <--- TU API KEY REAL
    authDomain: "agcroller.firebaseapp.com",
    databaseURL: "https://agcroller-default-rtdb.firebaseio.com",
    projectId: "agcroller",
    storageBucket: "agcroller.appspot.com",
    messagingSenderId: "727334750629",
    appId: "1:727334750629:web:116cb81a3f18722385804c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Elementos del DOM
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const toggleLink = document.getElementById('toggle-auth');
const title = document.getElementById('form-title');
const errorMsg = document.getElementById('error-msg');

let isLogin = true;

// Verificar si ya está logueado
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "plants.html";
    }
});

toggleLink.addEventListener('click', () => {
    isLogin = !isLogin;
    title.innerText = isLogin ? "Welcome Back" : "Create Account";
    submitBtn.innerText = isLogin ? "Login" : "Register";
    toggleLink.innerText = isLogin ? "Don't have an account? Register" : "Already have an account? Login";
    errorMsg.style.display = 'none';
});

submitBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passInput.value;

    try {
        if (isLogin) {
            await signInWithEmailAndPassword(auth, email, password);
        } else {
            await createUserWithEmailAndPassword(auth, email, password);
        }
        // La redirección la maneja onAuthStateChanged
    } catch (error) {
        errorMsg.innerText = error.message;
        errorMsg.style.display = 'block';
    }
});
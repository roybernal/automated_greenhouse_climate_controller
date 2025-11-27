import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// CORRECCIÓN: Importamos getText
import { initLanguage, getText } from './lang_manager.js';

// Iniciamos el sistema de idiomas
initLanguage();

// --- TU CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyD7fWCpBesKzl8rwsTzmsRkHuE9S49mvxs",
    authDomain: "agcroller.firebaseapp.com",
    databaseURL: "https://agcroller-default-rtdb.firebaseio.com",
    projectId: "agcroller",
    storageBucket: "agcroller.appspot.com",
    messagingSenderId: "727334750629",
    appId: "1:727334750629:web:116cb81a3f18722385804c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// DOM Elements
const emailInput = document.getElementById('email');
const passInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const toggleLink = document.getElementById('toggle-auth');
const title = document.getElementById('form-title');
const errorMsg = document.getElementById('error-msg');

let isLogin = true;

// Verificar Auth
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = "plants.html";
    }
});

// LÓGICA DEL TOGGLE (CORREGIDA CON IDIOMA)
toggleLink.addEventListener('click', () => {
    isLogin = !isLogin;
    
    // Usamos getText() para que respete el idioma actual
    title.innerText = isLogin ? getText("welcome_back") : getText("create_account");
    submitBtn.innerText = isLogin ? getText("login_btn") : getText("register_btn");
    toggleLink.innerText = isLogin ? getText("no_account") : getText("have_account");
    
    if(errorMsg) errorMsg.style.display = 'none';
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
    } catch (error) {
        errorMsg.innerText = error.message;
        errorMsg.style.display = 'block';
    }
});
// dashboard/js/plants.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

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
const db = getDatabase(app);
const auth = getAuth(app);

let allReadings = {}; 
let currentUserUID = null;
let currentPrediction = null; // Variable para la IA

// 1. Autenticación
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        currentUserUID = user.uid;
        initDashboard();
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});

async function initDashboard() {
    // Obtener IA (Si falla, no rompe la página)
    try {
        const res = await fetch('https://EnriqueAGC.pythonanywhere.com/predict_and_control');
        const data = await res.json();
        if (data.predicted_temperature) currentPrediction = data.predicted_temperature;
    } catch (e) { console.log("AI Offline/Loading"); }

    // A. Escuchar TODOS los sensores
    onValue(ref(db, 'latest_readings'), (snapshot) => {
        allReadings = snapshot.val() || {};
        refreshPlantCards();
    });

    // B. Escuchar SOLO las plantas de ESTE usuario
    const userPlantsRef = ref(db, `users/${currentUserUID}/plants`);
    
    onValue(userPlantsRef, (snapshot) => {
        const profiles = snapshot.val();
        renderPlants(profiles); 
    });
}

let loadedProfiles = {};

function renderPlants(profiles) {
    loadedProfiles = profiles;
    const grid = document.getElementById('plantsGrid');
    grid.innerHTML = ''; // Limpiar todo
    
    // 1. Renderizar Plantas del Usuario
    if (profiles) {
        Object.entries(profiles).forEach(([id, plant]) => {
            if(!plant.deviceId) plant.deviceId = "greenhouse_1"; 
            const card = createPlantCard(id, plant);
            grid.appendChild(card);
        });
    }

    // 2. Crear Botón de Agregar (Dinámicamente para evitar errores)
    const addBtn = document.createElement('div');
    addBtn.className = 'plant-card add-card';
    addBtn.innerHTML = `
        <span class="material-symbols-outlined add-icon">add_circle</span>
        <h3>Add Plant</h3>
    `;
    addBtn.onclick = () => document.getElementById('addPlantModal').style.display = 'flex';
    grid.appendChild(addBtn);

    // 3. MOSTRAR CONTENIDO (¡ESTA FUE LA CORRECCIÓN!) 
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block'; // <--- ¡IMPORTANTE!
}

function refreshPlantCards() {
    if (loadedProfiles) renderPlants(loadedProfiles);
}

function createPlantCard(id, plant) {
    const div = document.createElement('div');
    div.className = 'plant-card glass-effect';
    
    // Datos específicos
    const sensorData = allReadings[plant.deviceId] || {};
    
    const t = sensorData.temperature || 0;
    const h = sensorData.humidity || 0;
    const s = sensorData.soil_moisture || 0;
    
    // Estado Visual
    let tempStatus = (t > plant.maxTemp) ? '🔥 High' : (t < plant.minTemp ? '❄️ Low' : '✅ Good');
    
    // Estado IA
    let aiStatus = "Waiting...";
    if (currentPrediction) {
        // Nota: La IA actualmente predice global, aquí la interpretamos por planta
        if (currentPrediction > plant.maxTemp) aiStatus = "⚠️ Heat Spike Predicted";
        else if (currentPrediction < plant.minTemp) aiStatus = "⚠️ Cold Drop Predicted";
        else aiStatus = "🛡️ Forecast Stable";
    }

    div.innerHTML = `
        <div class="card-header">
            <h3>🌱 ${plant.name}</h3>
            <span class="status-dot ${tempStatus.includes('Good') ? 'green' : 'red'}"></span>
        </div>
        <div style="font-size:0.8rem; color:#555; margin-bottom:5px;">ID: <strong>${plant.deviceId}</strong></div>
        <div class="card-stats">
            <div class="stat-row"><span><span class="material-symbols-outlined">device_thermostat</span> ${t.toFixed(1)}°C</span> <small>${tempStatus}</small></div>
            <div class="stat-row"><span><span class="material-symbols-outlined">water_drop</span> ${h.toFixed(1)}%</span></div>
            <div class="stat-row"><span><span class="material-symbols-outlined">grass</span> ${s}</span></div>
        </div>
        <div class="ai-prediction-box" style="margin-top:10px; font-size:0.85rem;">
            <strong>AI Forecast:</strong><br>
            <span style="color:${aiStatus.includes('Stable') ? '#2ecc71' : '#e74c3c'}">${aiStatus}</span>
        </div>
    `;

    div.addEventListener('click', () => {
        localStorage.setItem('activePlant', JSON.stringify(plant));
        window.location.href = "index.html";
    });

    return div;
}

// Modales
const modal = document.getElementById('addPlantModal');
document.getElementById('closeAddModal').addEventListener('click', () => modal.style.display = 'none');

document.getElementById('addPlantForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newPlant = {
        name: document.getElementById('newPlantName').value,
        deviceId: document.getElementById('newDeviceId').value.trim(),
        minTemp: parseFloat(document.getElementById('newMinTemp').value),
        maxTemp: parseFloat(document.getElementById('newMaxTemp').value),
        maxHum: parseFloat(document.getElementById('newMaxHum').value),
        soilLimit: parseFloat(document.getElementById('newSoilLimit').value)
    };
    
    push(ref(db, `users/${currentUserUID}/plants`), newPlant).then(() => {
        modal.style.display = 'none';
        e.target.reset();
    });
});
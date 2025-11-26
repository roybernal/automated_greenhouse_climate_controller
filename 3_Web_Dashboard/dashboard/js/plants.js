import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// --- CONFIGURACIÓN FIREBASE ---
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
let userUid = null;

onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
    else {
        userUid = user.uid;
        initSystem();
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

function initSystem() {
    // 1. Escuchar datos en tiempo real
    onValue(ref(db, 'latest_readings'), (snap) => {
        allReadings = snap.val() || {};
        if(lastLoadedData) renderGreenhouses(lastLoadedData);
    });

    // 2. Escuchar estructura del usuario
    onValue(ref(db, `users/${userUid}/greenhouses`), (snap) => {
        renderGreenhouses(snap.val());
    });
}

let lastLoadedData = null;

function renderGreenhouses(data) {
    lastLoadedData = data;
    const container = document.getElementById('greenhouseContainer');
    container.innerHTML = '';

    if (data) {
        Object.entries(data).forEach(([ghId, gh]) => {
            const section = document.createElement('section');
            section.className = 'greenhouse-section';
            section.innerHTML = `<h2 class="gh-title">🏠 ${gh.name}</h2>`;
            
            const grid = document.createElement('div');
            grid.className = 'plants-grid';

            if (gh.plants) {
                Object.entries(gh.plants).forEach(([plantId, plant]) => {
                    // --- CORRECCIÓN: Pasamos ghId y plantId ---
                    grid.appendChild(createPlantCard(plant, plantId, ghId));
                });
            }

            const addCard = document.createElement('div');
            addCard.className = 'plant-card add-card';
            addCard.innerHTML = '<span class="material-symbols-outlined add-icon">add</span><h3>Add Plant</h3>';
            addCard.onclick = () => openAddPlantModal(ghId);
            
            grid.appendChild(addCard);
            section.appendChild(grid);
            container.appendChild(section);
        });
    }
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

// --- FUNCIÓN CORREGIDA PARA RECIBIR IDs ---
function createPlantCard(plant, plantId, ghId) {
    const div = document.createElement('div');
    div.className = 'plant-card glass-effect';
    
    // Datos
    const data = allReadings[plant.deviceId] || {};
    const t = data.temperature !== undefined ? data.temperature.toFixed(1) : "--";
    const h = data.humidity !== undefined ? data.humidity.toFixed(0) : "--";
    const l = data.light_received !== undefined ? data.light_received : "--";
    const s = data.soil_moisture !== undefined ? data.soil_moisture : "--";
    
    let statusColor = 'green';
    if (data.temperature > plant.maxTemp || data.temperature < plant.minTemp) statusColor = 'red';

    const aiTextId = `ai-msg-${plantId}`;

    div.innerHTML = `
        <div class="card-header">
            <h3>🌱 ${plant.name}</h3>
            <span class="status-dot ${statusColor}"></span>
        </div>
        
        <div class="card-stats">
            <div class="stat-row"><span>Temp:</span> <strong>${t} °C</strong></div>
            <div class="stat-row"><span>Hum:</span> <strong>${h} %</strong></div>
            <div class="stat-row"><span>Light:</span> <strong>${l}</strong></div>
            <div class="stat-row"><span>Soil:</span> <strong>${s}</strong></div>
            <div class="stat-row" style="font-size:0.8rem; color:#888; margin-top:5px;">${plant.deviceId}</div>
        </div>

        <div class="ai-prediction-box" style="background: rgba(255,255,255,0.6); margin-top:10px; padding:10px; border-radius:8px; text-align:center;">
            <div style="font-size:0.75rem; font-weight:bold; color:#555; margin-bottom:2px;">🔮 AI Forecast (1h):</div>
            <div id="${aiTextId}" style="font-weight:bold; font-size:0.9rem; color:#95a5a6;">Analyzing...</div>
        </div>
    `;

    div.addEventListener('click', () => {
        // --- GUARDAMOS LA RUTA COMPLETA ---
        const plantToSave = { 
            ...plant, 
            id: plantId,   // ID de la planta (-Mx...)
            ghId: ghId     // ID del invernadero (-Mz...)
        };
        localStorage.setItem('activePlant', JSON.stringify(plantToSave));
        window.location.href = "index.html";
    });

    // Llamar a la IA
    fetchIndividualAI(plant, aiTextId);

    return div;
}

// --- IA FETCH ---
async function fetchIndividualAI(plant, msgId) {
    try {
        const payload = { device_id: plant.deviceId, limits: plant };
        
        const res = await fetch('https://EnriqueAGC.pythonanywhere.com/predict_and_control', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });

        if(res.ok) {
            const d = await res.json();
            const el = document.getElementById(msgId);
            if(el && d.ai_reasoning) {
                el.innerText = d.ai_reasoning;
                if(d.ai_condition_status === 'warning') el.style.color = '#e74c3c'; 
                else el.style.color = '#2ecc71'; 
            }
        }
    } catch (e) { /* Silent fail */ }
}

// --- MODALES ---
document.getElementById('openGhModalBtn').onclick = () => document.getElementById('addGhModal').style.display = 'flex';
document.getElementById('ghForm').onsubmit = (e) => {
    e.preventDefault();
    push(ref(db, `users/${userUid}/greenhouses`), { name: document.getElementById('ghName').value });
    document.getElementById('addGhModal').style.display = 'none';
    e.target.reset();
};

window.openAddPlantModal = (ghId) => {
    document.getElementById('targetGhId').value = ghId;
    document.getElementById('addPlantModal').style.display = 'flex';
};

document.getElementById('plantForm').onsubmit = (e) => {
    e.preventDefault();
    const ghId = document.getElementById('targetGhId').value;
    const newPlant = {
        name: document.getElementById('pName').value,
        deviceId: document.getElementById('pDevice').value,
        minTemp: parseFloat(document.getElementById('pMinT').value),
        maxTemp: parseFloat(document.getElementById('pMaxT').value),
        maxHum: parseFloat(document.getElementById('pMaxH').value),
        soilLimit: parseFloat(document.getElementById('pSoil').value)
    };
    push(ref(db, `users/${userUid}/greenhouses/${ghId}/plants`), newPlant);
    document.getElementById('addPlantModal').style.display = 'none';
    e.target.reset();
};
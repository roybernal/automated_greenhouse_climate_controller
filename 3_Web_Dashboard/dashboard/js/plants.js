import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, push, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// IMPORTANTE: Importamos getText para traducir dentro del JS
import { initLanguage, getText } from './lang_manager.js';

initLanguage();

// ... (Tu Configuración Firebase sigue igual) ...
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
    onValue(ref(db, 'latest_readings'), (snap) => {
        allReadings = snap.val() || {};
        if(lastLoadedData) renderGreenhouses(lastLoadedData);
    });

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
            
            // Cabecera Invernadero
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:10px; margin-bottom:15px;";
            
            headerDiv.innerHTML = `<h2 style="margin:0; color:white; font-size:1.5rem;">🏠 ${gh.name}</h2>`;
            
            const delGhBtn = document.createElement('button');
            delGhBtn.style.cssText = "background:none; border:none; cursor:pointer; padding:5px; transition: transform 0.2s;";
            delGhBtn.title = "Delete Greenhouse";
            delGhBtn.innerHTML = '<span class="material-symbols-outlined" style="color:#e74c3c; font-size:1.6rem;">delete_forever</span>';
            
            delGhBtn.onclick = () => {
                if(confirm(`Delete greenhouse "${gh.name}"?`)) {
                    remove(ref(db, `users/${userUid}/greenhouses/${ghId}`));
                }
            };

            headerDiv.appendChild(delGhBtn);
            section.appendChild(headerDiv);
            
            const grid = document.createElement('div');
            grid.className = 'plants-grid';

            if (gh.plants) {
                Object.entries(gh.plants).forEach(([plantId, plant]) => {
                    grid.appendChild(createPlantCard(plant, plantId, ghId));
                });
            }

            const addCard = document.createElement('div');
            addCard.className = 'plant-card add-card';
            // Usamos data-i18n aquí también para "Add Plant"
            addCard.innerHTML = `<span class="material-symbols-outlined add-icon">add</span><h3 data-i18n="add_plant">${getText('add_plant')}</h3>`;
            addCard.onclick = () => openAddPlantModal(ghId);
            
            grid.appendChild(addCard);
            section.appendChild(grid);
            container.appendChild(section);
        });
    }
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function createPlantCard(plant, plantId, ghId) {
    const div = document.createElement('div');
    div.className = 'plant-card glass-effect';
    
    const data = allReadings[plant.deviceId] || {};
    const t = data.temperature !== undefined ? data.temperature.toFixed(1) : "--";
    const h = data.humidity !== undefined ? data.humidity.toFixed(0) : "--";
    const l = data.light_received !== undefined ? data.light_received : "--";
    const s = data.soil_moisture !== undefined ? data.soil_moisture : "--";
    
    const now = Date.now();
    const lastSeen = data.timestamp || 0;
    const isOnline = (now - lastSeen) < 60000;

    let statusColor = 'green';
    if (!isOnline) statusColor = 'grey';
    else if (data.temperature > plant.maxTemp || data.temperature < plant.minTemp) statusColor = 'red';
    
    const aiTextId = `ai-msg-${plantId}`;
    const deleteBtnId = `del-${plantId}`;

    // --- AQUI ESTA LA TRADUCCION DINAMICA ---
    // Usamos getText('clave') para obtener el texto en el idioma actual
    
    div.innerHTML = `
    <div class="card-header">
        <h3>🌱 ${plant.name}</h3>
        <div style="display:flex; align-items:center; gap:10px;">
             <button id="${deleteBtnId}" style="background:none; border:none; cursor:pointer; padding:0; display:flex;">
                <span class="material-symbols-outlined" style="color:#e74c3c;">delete</span>
            </button>
            <span class="status-dot" style="background-color: ${statusColor === 'grey' ? '#95a5a6' : (statusColor==='red'?'#e74c3c':'#2ecc71')}"></span>
        </div>
    </div>

    <div style="font-size:0.7rem; color:${isOnline ? '#2ecc71' : '#95a5a6'}; margin-bottom:5px;">
        ${isOnline ? getText('online') : getText('offline')}
    </div>
        
    <div class="card-stats">
        <div class="stat-row">
            <span><span class="material-symbols-outlined">device_thermostat</span> ${getText('temp')}:</span> 
            <strong>${t} °C</strong>
        </div>
        <div class="stat-row">
            <span><span class="material-symbols-outlined">water_drop</span> ${getText('hum')}:</span> 
            <strong>${h} %</strong>
        </div>
        <div class="stat-row">
            <span><span class="material-symbols-outlined">wb_sunny</span> ${getText('light')}:</span> 
            <strong>${l}</strong>
        </div>
        <div class="stat-row">
            <span><span class="material-symbols-outlined">grass</span> ${getText('soil')}:</span> 
            <strong>${s}</strong>
        </div>
    </div>

    <div class="ai-prediction-box" style="background: rgba(255,255,255,0.6); margin-top:10px; padding:10px; border-radius:8px; text-align:center;">
        <div style="font-size:0.75rem; font-weight:bold; color:#555; margin-bottom:2px;">${getText('ai_forecast')}:</div>
        <div id="${aiTextId}" style="font-weight:bold; font-size:0.9rem; color:#95a5a6;">${getText('loading')}</div>
    </div>
    `;

    div.addEventListener('click', () => {
        const plantToSave = { ...plant, id: plantId, ghId: ghId };
        localStorage.setItem('activePlant', JSON.stringify(plantToSave));
        window.location.href = "index.html";
    });

    setTimeout(() => {
        const delBtn = div.querySelector(`#${deleteBtnId}`);
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm("Delete?")) {
                    remove(ref(db, `users/${userUid}/greenhouses/${ghId}/plants/${plantId}`));
                }
            });
        }
    }, 0);

    fetchIndividualAI(plant, aiTextId);
    return div;
}

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
                // Aquí idealmente traducirías también el mensaje de la IA si el backend mandara códigos
                // Por ahora mostramos lo que viene
                el.innerText = d.ai_reasoning;
                if(d.ai_condition_status === 'warning') el.style.color = '#e74c3c'; 
                else el.style.color = '#2ecc71'; 
            }
        }
    } catch (e) { }
}

// --- MODALES ---
document.getElementById('openGhModalBtn').onclick = () => document.getElementById('addGreenhouseModal').style.display = 'flex';
document.getElementById('ghForm').onsubmit = (e) => {
    e.preventDefault();
    push(ref(db, `users/${userUid}/greenhouses`), { name: document.getElementById('ghName').value });
    document.getElementById('addGreenhouseModal').style.display = 'none';
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

window.closeModal = (modalId) => {
    const m = document.getElementById(modalId);
    if(m) m.style.display = 'none';
};
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
// Importamos 'remove'
import { getDatabase, ref, onValue, push, remove } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
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
            
            // --- CABECERA DEL INVERNADERO CON BOTÓN ELIMINAR ---
            const headerDiv = document.createElement('div');
            headerDiv.style.cssText = "display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.2); padding-bottom:10px; margin-bottom:15px;";
            
            // Título
            headerDiv.innerHTML = `<h2 style="margin:0; color:white; font-size:1.5rem;">🏠 ${gh.name}</h2>`;
            
            // Botón de Borrar Invernadero
            const delGhBtn = document.createElement('button');
            delGhBtn.style.cssText = "background:none; border:none; cursor:pointer; padding:5px; transition: transform 0.2s;";
            delGhBtn.title = "Delete Greenhouse";
            delGhBtn.innerHTML = '<span class="material-symbols-outlined" style="color:#e74c3c; font-size:1.6rem;">delete_forever</span>';
            
            // Efecto Hover
            delGhBtn.onmouseover = () => delGhBtn.style.transform = "scale(1.2)";
            delGhBtn.onmouseout = () => delGhBtn.style.transform = "scale(1)";

            // Acción de Borrar
            delGhBtn.onclick = () => {
                if(confirm(`⚠️ DANGER:\nAre you sure you want to delete the greenhouse "${gh.name}"?\n\nThis will delete ALL plants inside it.`)) {
                    remove(ref(db, `users/${userUid}/greenhouses/${ghId}`))
                        .then(() => console.log("Greenhouse deleted"))
                        .catch(err => alert(err.message));
                }
            };

            headerDiv.appendChild(delGhBtn);
            section.appendChild(headerDiv);
            
            // --- GRID DE PLANTAS ---
            const grid = document.createElement('div');
            grid.className = 'plants-grid';

            if (gh.plants) {
                Object.entries(gh.plants).forEach(([plantId, plant]) => {
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

function createPlantCard(plant, plantId, ghId) {
    const div = document.createElement('div');
    div.className = 'plant-card glass-effect';
    
    const data = allReadings[plant.deviceId] || {};
    const t = data.temperature !== undefined ? data.temperature.toFixed(1) : "--";
    const h = data.humidity !== undefined ? data.humidity.toFixed(0) : "--";
    const l = data.light_received !== undefined ? data.light_received : "--";
    const s = data.soil_moisture !== undefined ? data.soil_moisture : "--";
    
    // CALCULAR ESTADO ONLINE/OFFLINE
    const now = Date.now();
    const lastSeen = data.timestamp || 0;
    const isOnline = (now - lastSeen) < 60000;

    let statusColor = 'green';
    if (!isOnline) {
        statusColor = 'grey'; // O define una clase .grey en CSS
    } else if (data.temperature > plant.maxTemp || data.temperature < plant.minTemp) {
        statusColor = 'red';
    }
    const aiTextId = `ai-msg-${plantId}`;
    const deleteBtnId = `del-${plantId}`;

    div.innerHTML = `
    <div class="card-header">
        <h3>🌱 ${plant.name}</h3>
        <span class="status-dot" style="background-color: ${statusColor === 'grey' ? '#95a5a6' : (statusColor==='red'?'#e74c3c':'#2ecc71')}"></span>
    </div>

    <div style="font-size:0.7rem; color:${isOnline ? '#2ecc71' : '#95a5a6'}; margin-bottom:5px;">
        ${isOnline ? '● Online' : `● Offline (Last seen: ${new Date(lastSeen).toLocaleTimeString()})`}
    </div>
        
        <div class="card-stats">
            <div class="stat-row"><span>Temp:</span> <strong>${t} °C</strong></div>
            <div class="stat-row"><span>Hum:</span> <strong>${h} %</strong></div>
            <div class="stat-row"><span>Light:</span> <strong>${l}</strong></div>
            <div class="stat-row"><span>Soil:</span> <strong>${s}</strong></div>
            <div class="stat-row" style="font-size:0.8rem; color:#888; margin-top:5px;">${plant.deviceId}</div>
        </div>

        <div class="ai-prediction-box" style="background: rgba(255,255,255,0.6); margin-top:10px; padding:10px; border-radius:8px; text-align:center;">
            <div style="font-size:0.75rem; font-weight:bold; color:#555; margin-bottom:2px;">AI Forecast (1h):</div>
            <div id="${aiTextId}" style="font-weight:bold; font-size:0.9rem; color:#95a5a6;">Analyzing...</div>
        </div>
    `;

    div.addEventListener('click', () => {
        const plantToSave = { ...plant, id: plantId, ghId: ghId };
        localStorage.setItem('activePlant', JSON.stringify(plantToSave));
        window.location.href = "index.html";
    });

    // Botón Borrar Planta
    setTimeout(() => {
        const delBtn = div.querySelector(`#${deleteBtnId}`);
        if (delBtn) {
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete plant "${plant.name}"?`)) {
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
                el.innerText = d.ai_reasoning;
                if(d.ai_condition_status === 'warning') el.style.color = '#e74c3c'; 
                else el.style.color = '#2ecc71'; 
            }
        }
    } catch (e) { }
}

// --- MODALES ---
document.getElementById('openGhModalBtn').onclick = () => document.getElementById('addGreenhouseModal').style.display = 'flex';

const ghForm = document.getElementById('ghForm');
if(ghForm) {
    ghForm.onsubmit = (e) => {
        e.preventDefault();
        push(ref(db, `users/${userUid}/greenhouses`), { name: document.getElementById('ghName').value });
        document.getElementById('addGreenhouseModal').style.display = 'none';
        e.target.reset();
    };
}

window.openAddPlantModal = (ghId) => {
    document.getElementById('targetGhId').value = ghId;
    document.getElementById('addPlantModal').style.display = 'flex';
};

const plantForm = document.getElementById('plantForm');
if(plantForm) {
    plantForm.onsubmit = (e) => {
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
}

window.closeModal = (modalId) => {
    const m = document.getElementById(modalId);
    if(m) m.style.display = 'none';
};
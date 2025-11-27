import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
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
const database = getDatabase(app);
const auth = getAuth(app);

// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');

// --- CARGAR PLANTA ACTIVA ---
let activePlantJSON = localStorage.getItem('activePlant');
let PLANT_CONFIG = activePlantJSON ? JSON.parse(activePlantJSON) : null;

// Validación
if (!PLANT_CONFIG || !PLANT_CONFIG.deviceId) {
    // Si no hay planta, volver a la selección
    window.location.href = "plants.html"; 
}

// UI Inicial
if(PLANT_CONFIG) {
    document.getElementById('currentPlantName').innerText = `Monitoring: ${PLANT_CONFIG.name}`;
}

// 1. AUTH
let currentUser = null;
onAuthStateChanged(auth, (user) => {
    if (!user) window.location.href = "login.html";
    else {
        currentUser = user;
        updateLoadingProgress(100, "Ready");
        showMainContent();
        startMonitoring();
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => signOut(auth));

function startMonitoring() {
    queryHistoricalData();
    fetchPrediction();
    
    // Sensores
    onValue(ref(database, `latest_readings/${PLANT_CONFIG.deviceId}`), (snap) => {
        const data = snap.val();
        if (data) {
            updateSensorUI(data);
            checkConnectionStatus(data.timestamp);
        }
    });
    
    // Actuadores
    onValue(ref(database, `actuator_controls/${PLANT_CONFIG.deviceId}`), (snap) => {
        updateButtonUI(snap.val());
    });
}

// --- FUNCIÓN DE ESTADO DE CONEXIÓN ---
function checkConnectionStatus(lastTimestamp) {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    const now = Date.now();
    const diff = now - lastTimestamp;
    
    // Si han pasado más de 60 segundos (60000 ms)
    if (diff > 60000) {
        statusEl.innerText = "● System Offline";
        statusEl.style.background = "rgba(149, 165, 166, 0.8)"; // Gris
    } else {
        statusEl.innerText = "● System Online";
        statusEl.style.background = "rgba(46, 204, 113, 0.8)"; // Verde
    }
}

// 2. LÓGICA DE AJUSTES (BOTÓN "GEAR") ⚙️
const modal = document.getElementById('plantModal');

document.getElementById('settingsBtn').addEventListener('click', () => {
    // Rellenar formulario con datos actuales
    document.getElementById('plantName').value = PLANT_CONFIG.name;
    // CORRECCIÓN AQUÍ: Usamos 'newDeviceId' que es el ID que tienes en tu HTML
    document.getElementById('newDeviceId').value = PLANT_CONFIG.deviceId; 
    
    document.getElementById('minTemp').value = PLANT_CONFIG.minTemp;
    document.getElementById('maxTemp').value = PLANT_CONFIG.maxTemp;
    document.getElementById('maxHum').value = PLANT_CONFIG.maxHum;
    document.getElementById('soilLimit').value = PLANT_CONFIG.soilLimit;
    
    modal.style.display = 'flex';
});

document.getElementById('closeModal').addEventListener('click', () => modal.style.display = 'none');

// GUARDAR CAMBIOS (Submit)
document.getElementById('plantForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const updatedConfig = {
        ...PLANT_CONFIG, // Mantener IDs (ghId, id)
        name: document.getElementById('plantName').value,
        // CORRECCIÓN AQUÍ TAMBIÉN:
        deviceId: document.getElementById('newDeviceId').value.trim(),
        minTemp: parseFloat(document.getElementById('minTemp').value),
        maxTemp: parseFloat(document.getElementById('maxTemp').value),
        maxHum: parseFloat(document.getElementById('maxHum').value),
        soilLimit: parseFloat(document.getElementById('soilLimit').value)
    };

    try {
        // Guardar en Firebase (Ruta específica del usuario)
        const path = `users/${currentUser.uid}/greenhouses/${PLANT_CONFIG.ghId}/plants/${PLANT_CONFIG.id}`;
        await update(ref(database, path), updatedConfig);
        
        // Actualizar LocalStorage y Variable Global
        localStorage.setItem('activePlant', JSON.stringify(updatedConfig));
        PLANT_CONFIG = updatedConfig;
        
        // Actualizar UI
        document.getElementById('currentPlantName').innerText = `Monitoring: ${PLANT_CONFIG.name}`;
        alert("Settings Saved!");
        modal.style.display = 'none';
        
        // Recargar página para reiniciar listeners con el nuevo ID si cambió
        location.reload();
        
    } catch (error) {
        console.error("Save error:", error);
        alert("Error saving: " + error.message);
    }
});

// ELIMINAR PLANTA
document.getElementById('deletePlant').addEventListener('click', async () => {
    if(confirm("Are you sure you want to delete this plant?")) {
        const path = `users/${currentUser.uid}/greenhouses/${PLANT_CONFIG.ghId}/plants/${PLANT_CONFIG.id}`;
        await set(ref(database, path), null); // Borrar
        window.location.href = "plants.html";
    }
});


// 3. FUNCIONES UI (Igual que antes)

function updateSensorUI(data) {
    // Temperatura
    if (data.temperature !== undefined) {
        const t = parseFloat(data.temperature).toFixed(1);
        setCard('temperature', `${t} °C`, t, PLANT_CONFIG.minTemp, PLANT_CONFIG.maxTemp);
    }
    // Humedad
    if (data.humidity !== undefined) {
        const h = parseFloat(data.humidity).toFixed(1);
        setCard('humidity', `${h} %`, h, 0, PLANT_CONFIG.maxHum, true);
    }
    // Suelo
    if (data.soil_moisture !== undefined) {
        const s = parseInt(data.soil_moisture);
        const el = document.getElementById('soil-moisture-value');
        const st = document.getElementById('soil-moisture-status');
        el.innerText = s;
        // Lógica inversa suelo
        if (s > PLANT_CONFIG.soilLimit) { 
            el.className = 'sensor-value status-high'; 
            st.innerText = 'Needs Water'; 
            st.style.color='#e74c3c'; 
        } else { 
            el.className = 'sensor-value status-optimal'; 
            st.innerText = 'Moist'; 
            st.style.color='#2ecc71'; 
        }
    }
    // Luz
    if (data.light_received !== undefined) {
        const l = parseInt(data.light_received);
        const el = document.getElementById('light-value');
        const st = document.getElementById('light-status');
        el.innerText = `${l} val`;
        
        if (l < 200) {
             el.className = 'sensor-value status-optimal';
             st.innerText = "Bright";
        } else if (l > 2000) {
             el.className = 'sensor-value status-low'; 
             st.innerText = "Dark";
        } else {
             el.className = 'sensor-value';
             st.innerText = "Dim";
        }
    }
}

function setCard(id, text, val, min, max, invert=false) {
    const el = document.getElementById(`${id}-value`);
    const st = document.getElementById(`${id}-status`);
    el.innerText = text;
    let status = 'optimal';
    if (!invert) { if(val>max) status='high'; else if(val<min) status='low'; }
    else { if(val>max) status='high'; }
    
    el.className = `sensor-value status-${status}`;
    st.innerText = status==='optimal'?'Optimal':(status==='high'?'Too High':'Too Low');
}

function updateButtonUI(data) {
    if(!data) return;
    if(data.fan !== undefined) document.getElementById('fan-toggle').checked = (data.fan === true || data.fan === "true");
    if(data.heater !== undefined) document.getElementById('heater-toggle').checked = (data.heater === true || data.heater === "true");
    if(data.irrigation !== undefined) document.getElementById('irrigation-toggle').checked = (data.irrigation === true || data.irrigation === "true");
}

// Listeners Botones Actuadores
['fan','heater','irrigation'].forEach(id => {
    const elem = document.getElementById(`${id}-toggle`);
    if(elem) {
        const newElem = elem.cloneNode(true);
        elem.parentNode.replaceChild(newElem, elem);
        newElem.addEventListener('change', (e) => {
            set(ref(database, `actuator_controls/${PLANT_CONFIG.deviceId}/${id}`), e.target.checked);
        });
    }
});

// --- IA (Cerebro Mejorado con Colores) ---
async function fetchPrediction() {
    try {
        const payload = { device_id: PLANT_CONFIG.deviceId, limits: PLANT_CONFIG };
        const res = await fetch('https://EnriqueAGC.pythonanywhere.com/predict_and_control', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.predicted_temperature) {
            // 1. Temp (Rojo si se sale del rango min/max)
            updateMiniPred('pred-temp', data.predicted_temperature.toFixed(1) + '°', data.predicted_temperature, PLANT_CONFIG.minTemp, PLANT_CONFIG.maxTemp);
            
            // 2. Humedad (Rojo si es mayor al maximo)
            updateMiniPred('pred-hum', data.predicted_humidity.toFixed(0) + '%', data.predicted_humidity, 0, PLANT_CONFIG.maxHum, true);
            
            // 3. Luz (Rojo si está muy oscuro > 2500, ajustable)
            // True al final significa: "Si es mayor al límite, es malo"
            updateMiniPred('pred-light', parseFloat(data.predicted_light).toFixed(0), data.predicted_light, 0, 2500, true);
            
            // 4. Suelo (Rojo si está muy seco > soilLimit)
            updateMiniPred('pred-soil', parseFloat(data.predicted_soil).toFixed(0), data.predicted_soil, 0, PLANT_CONFIG.soilLimit, true);
            
            // Mensaje de estado
            const aiReason = document.getElementById('ai-reasoning');
            if(aiReason) {
                aiReason.innerText = data.ai_reasoning;
                // Si el status es warning, poner el texto en rojo
                aiReason.style.color = data.ai_condition_status === 'warning' ? '#e74c3c' : '#2c3e50';
            }
        }
    } catch (e) { console.error(e); }
}

function updateMiniPred(id, text, val, min, max, invert=false) {
    const el = document.getElementById(id);
    if(!el) return;
    el.innerText = text;
    
    // Lógica de colores:
    // invert = false: Rojo si está FUERA del rango (menor que min O mayor que max)
    // invert = true: Rojo SOLO si es MAYOR que max (ej. Humedad alta o Suelo muy seco)
    let isBad = false;
    if (!invert) {
        isBad = (val > max || val < min);
    } else {
        isBad = (val > max);
    }

    el.style.color = isBad ? '#e74c3c' : '#2ecc71'; // Rojo : Verde
}

// Gráficas
let tempChart, humChart, soilChart;
async function queryHistoricalData() {
    const selector = document.getElementById('history-range');
    let limit = selector ? parseInt(selector.value) : 30;
    const q = query(ref(database, `sensor_logs/${PLANT_CONFIG.deviceId}`), orderByChild('timestamp'), limitToLast(limit));
    try {
        const snap = await get(q);
        if (snap.exists()) renderCharts(snap.val());
        const lastUp = document.getElementById('last-updated');
        if(lastUp) lastUp.innerText = `Updated: ${new Date().toLocaleTimeString()}`;
    } catch (e) {}
}
function renderCharts(data) {
    const sorted = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    const total = sorted.length;
    const step = total > 500 ? Math.ceil(total / 500) : 1;
    const filtered = [];
    for(let i=0; i<total; i+=step) filtered.push(sorted[i]);

    const labels = filtered.map(d => new Date(d.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
    updateChart('chartTemp', tempChart, labels, filtered.map(d=>d.temperature), 'Temp', '#e74c3c', c=>tempChart=c);
    updateChart('chartHumidity', humChart, labels, filtered.map(d=>d.humidity), 'Hum', '#3498db', c=>humChart=c);
    updateChart('chartSoil', soilChart, labels, filtered.map(d=>d.soil_moisture), 'Soil', '#2ecc71', c=>soilChart=c);
}
function updateChart(id, chart, labels, data, label, color, setC) {
    const ctx = document.getElementById(id);
    if(!ctx) return;
    if(chart) chart.destroy();
    setC(new Chart(ctx, {
        type: 'line', data: { labels, datasets: [{ label, data, borderColor: color, backgroundColor: color+'33', fill: true, tension: 0.4, pointRadius: data.length>50?0:3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display:false}, title: {display:true, text:label, color:'#0'} }, scales: { x: {display:false}, y: {grid: {color:'rgba(255,255,255,0.1)'}} } }
    }));
}
if(document.getElementById('history-range')) document.getElementById('history-range').addEventListener('change', queryHistoricalData);

// Helpers UI
function updateLoadingProgress() {}
function showMainContent() {
    if(loadingScreen) { loadingScreen.style.opacity='0'; setTimeout(()=>{loadingScreen.style.display='none'; mainContent.style.display='block'},500); }
}

// Loop
setInterval(fetchPrediction, 60000);
setInterval(queryHistoricalData, 60000);
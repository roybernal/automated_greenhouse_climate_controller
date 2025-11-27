import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get, update } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
// CORRECCIÓN: Una sola línea de importación para lang_manager
import { getText, initLanguage } from './lang_manager.js'; 
initLanguage();

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
    // Usamos getText para traducir también el texto inicial si es necesario, 
    // aunque "Monitoring:" es dinámico, lo dejamos simple o usamos getText('monitoring') + ...
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
        statusEl.innerText = getText("offline"); // Traducido
        statusEl.style.background = "rgba(149, 165, 166, 0.8)"; // Gris
    } else {
        statusEl.innerText = getText("online"); // Traducido
        statusEl.style.background = "rgba(46, 204, 113, 0.8)"; // Verde
    }
}

// 2. LÓGICA DE AJUSTES (BOTÓN "GEAR") ⚙️
const modal = document.getElementById('plantModal');

document.getElementById('settingsBtn').addEventListener('click', () => {
    // Rellenar formulario con datos actuales
    document.getElementById('plantName').value = PLANT_CONFIG.name;
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


// 3. FUNCIONES UI (TRADUCIDAS CON getText)

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
            st.innerText = getText('needs_water'); // Traducido
            st.style.color='#e74c3c'; 
        } else { 
            el.className = 'sensor-value status-optimal'; 
            st.innerText = getText('moist'); // Traducido
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
             st.innerText = getText("bright"); // Traducido
        } else if (l > 2000) {
             el.className = 'sensor-value status-low'; 
             st.innerText = getText("dark"); // Traducido
        } else {
             el.className = 'sensor-value';
             st.innerText = getText("dim"); // Traducido
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
    
    // Traducción de estados dinámicos
    if (status === 'optimal') st.innerText = getText('optimal');
    else if (status === 'high') st.innerText = invert ? getText('high_hum') : getText('too_hot');
    else st.innerText = getText('too_cold');
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
        const currentLang = localStorage.getItem('appLang') || 'en';
        const payload = { device_id: PLANT_CONFIG.deviceId, limits: PLANT_CONFIG, lang: currentLang };
        const res = await fetch('https://EnriqueAGC.pythonanywhere.com/predict_and_control', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        });
        if (!res.ok) return;
        const data = await res.json();
        
        if (data.predicted_temperature) {
            // 1. Temp
            updateMiniPred('pred-temp', data.predicted_temperature.toFixed(1) + '°', data.predicted_temperature, PLANT_CONFIG.minTemp, PLANT_CONFIG.maxTemp);
            // 2. Humedad
            updateMiniPred('pred-hum', data.predicted_humidity.toFixed(0) + '%', data.predicted_humidity, 0, PLANT_CONFIG.maxHum, true);
            // 3. Luz
            updateMiniPred('pred-light', parseFloat(data.predicted_light).toFixed(0), data.predicted_light, 0, 2500, true);
            // 4. Suelo
            updateMiniPred('pred-soil', parseFloat(data.predicted_soil).toFixed(0), data.predicted_soil, 0, PLANT_CONFIG.soilLimit, true);
            
            // Mensaje de estado
            const aiReason = document.getElementById('ai-reasoning');
            if(aiReason) {
                // Aquí podríamos traducir el mensaje de la IA si el backend devolviera códigos,
                // pero por ahora mostramos lo que envía Python.
                aiReason.innerText = data.ai_reasoning;
                aiReason.style.color = data.ai_condition_status === 'warning' ? '#e74c3c' : '#2c3e50';
            }
        }
    } catch (e) { console.error(e); }
}

function updateMiniPred(id, text, val, min, max, invert=false) {
    const el = document.getElementById(id);
    if(!el) return;
    el.innerText = text;
    
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
    
    // Usamos getText para los títulos de las gráficas también
    updateChart('chartTemp', tempChart, labels, filtered.map(d=>d.temperature), getText('temp'), '#e74c3c', c=>tempChart=c);
    updateChart('chartHumidity', humChart, labels, filtered.map(d=>d.humidity), getText('hum'), '#3498db', c=>humChart=c);
    updateChart('chartSoil', soilChart, labels, filtered.map(d=>d.soil_moisture), getText('soil'), '#2ecc71', c=>soilChart=c);
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
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// PEGA TU CONFIGURACIÓN FIREBASE AQUÍ
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

// --- ELEMENTOS DOM (Con protección contra null) ---
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');

// --- CARGAR PLANTA SELECCIONADA ---
let activePlantJSON = localStorage.getItem('activePlant');
let PLANT_CONFIG = activePlantJSON ? JSON.parse(activePlantJSON) : null;

// Si no hay planta seleccionada o le falta el ID, usar valores por defecto
if (!PLANT_CONFIG || !PLANT_CONFIG.deviceId) {
    console.warn("No plant selected or missing ID. Using default.");
    PLANT_CONFIG = {
        name: "Default Plant",
        deviceId: "greenhouse_1", // ID POR DEFECTO IMPRESCINDIBLE
        minTemp: 18, maxTemp: 28, maxHum: 70, soilLimit: 3000
    };
}

// Actualizar Título
const titleElem = document.getElementById('currentPlantName');
if(titleElem) titleElem.innerText = `Monitoring: ${PLANT_CONFIG.name}`;

// 1. AUTH
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        updateLoadingProgress(100, "Ready");
        showMainContent();
        // Iniciar gráficas y predicción solo cuando estemos listos
        queryHistoricalData();
        fetchPrediction();
    }
});

const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn) logoutBtn.addEventListener('click', () => signOut(auth));

// 2. SENSORES EN TIEMPO REAL
const sensorRef = ref(database, `latest_readings/${PLANT_CONFIG.deviceId}`);
onValue(sensorRef, (snap) => {
    const data = snap.val();
    if (data) {
        updateSensorUI(data);
        // Check connection status visual logic here if needed
    }
});

const actuatorsRef = ref(database, `actuator_controls/${PLANT_CONFIG.deviceId}`);
onValue(actuatorsRef, (snap) => {
    const data = snap.val();
    if (data) updateButtonUI(data);
});

// 3. ACTUALIZAR UI (Incluyendo LUZ y SUELO)
function updateSensorUI(data) {
    // Temperatura
    if (data.temperature !== undefined) {
        const t = data.temperature.toFixed(1);
        const el = document.getElementById('temperature-value');
        const st = document.getElementById('temperature-status');
        el.innerText = `${t} °C`;
        
        if (t > PLANT_CONFIG.maxTemp) { el.className = 'sensor-value status-high'; st.innerText = 'Too Hot'; }
        else if (t < PLANT_CONFIG.minTemp) { el.className = 'sensor-value status-low'; st.innerText = 'Too Cold'; }
        else { el.className = 'sensor-value status-optimal'; st.innerText = 'Optimal'; }
    }

    // Humedad
    if (data.humidity !== undefined) {
        const h = data.humidity.toFixed(1);
        const el = document.getElementById('humidity-value');
        const st = document.getElementById('humidity-status');
        el.innerText = `${h} %`;
        
        if (h > PLANT_CONFIG.maxHum) { el.className = 'sensor-value status-high'; st.innerText = 'High Humidity'; }
        else { el.className = 'sensor-value status-optimal'; st.innerText = 'Optimal'; }
    }

    // Suelo
    if (data.soil_moisture !== undefined) {
        const s = data.soil_moisture;
        const el = document.getElementById('soil-moisture-value');
        const st = document.getElementById('soil-moisture-status');
        el.innerText = s;

        if (s > PLANT_CONFIG.soilLimit) {
             el.className = 'sensor-value status-high'; 
             st.innerText = 'Needs Water';
             st.style.color = '#e74c3c';
        } else { 
            el.className = 'sensor-value status-optimal'; 
            st.innerText = 'Moist'; 
            st.style.color = '#2ecc71';
        }
    }
    
    // Luz (CORREGIDO: Ahora sí muestra estado)
    if (data.light_received !== undefined) {
         const l = data.light_received;
         const el = document.getElementById('light-value');
         const st = document.getElementById('light-status');
         el.innerText = `${l} val`;
         
         // Lógica inversa (Bajo = Luz, Alto = Oscuro)
         if (l < 200) {
             el.className = 'sensor-value status-optimal';
             st.innerText = "Bright / Sunny";
         } else if (l > 2000) {
             el.className = 'sensor-value status-low'; // Azul o gris
             st.innerText = "Dark / Night";
         } else {
             el.className = 'sensor-value';
             st.innerText = "Dim Light";
         }
    }
}

// 4. IA CON POST (Corrección del Error 400)
async function fetchPrediction() {
    try {
        const devId = PLANT_CONFIG.deviceId || "greenhouse_1";

        const payload = {
            device_id: devId,
            limits: PLANT_CONFIG
        };

        const res = await fetch('https://EnriqueAGC.pythonanywhere.com/predict_and_control', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`AI Error: ${res.status}`);
        const data = await res.json();
        
        // Actualizar los 4 Bloques
        if (data.predicted_temperature !== undefined) {
            // 1. Temp
            updatePredCard('pred-temp', data.predicted_temperature.toFixed(1) + ' °C', 
                data.predicted_temperature, PLANT_CONFIG.minTemp, PLANT_CONFIG.maxTemp);
            
            // 2. Hum
            updatePredCard('pred-hum', data.predicted_humidity.toFixed(0) + ' %', 
                data.predicted_humidity, 0, PLANT_CONFIG.maxHum);

            // 3. Luz (Lógica inversa: Alto = Oscuro)
            const lVal = document.getElementById('pred-light');
            lVal.innerText = data.predicted_light.toFixed(0);
            // Si quieres colorearlo: (Valor, Min, Max) -> Ajusta según tu preferencia

            // 4. Suelo (Lógica inversa: Alto = Seco)
            const sVal = document.getElementById('pred-soil');
            sVal.innerText = data.predicted_soil.toFixed(0);
            if(data.predicted_soil > PLANT_CONFIG.soilLimit) sVal.style.color = '#e74c3c'; // Rojo
            else sVal.style.color = '#2ecc71'; // Verde

            // 5. Mensaje
            const msgEl = document.getElementById('ai-reasoning');
            msgEl.innerText = data.ai_reasoning;
            msgEl.style.color = data.ai_condition_status === 'warning' ? '#e74c3c' : '#2c3e50';
        }

    } catch (e) {
        console.error(e);
        document.getElementById('ai-reasoning').innerText = "AI Offline";
    }
}

// Helper para colorear fácil
function updatePredCard(elementId, text, value, min, max) {
    const el = document.getElementById(elementId);
    el.innerText = text;
    if (value > max || value < min) {
        el.style.color = '#e74c3c'; // Alerta
    } else {
        el.style.color = '#2ecc71'; // Bien
    }
}

// 5. GRÁFICAS (Historical Data)
let tempChart, humChart, soilChart;

async function queryHistoricalData() {
    // Usamos la ruta ESPECÍFICA del dispositivo
    const logsRef = ref(database, `sensor_logs/${PLANT_CONFIG.deviceId}`);
    const q = query(logsRef, orderByChild('timestamp'), limitToLast(30));

    try {
        const snapshot = await get(q);
        if (snapshot.exists()) {
            renderCharts(snapshot.val());
            document.getElementById('last-updated').innerText = `Last updated: ${new Date().toLocaleTimeString()}`;
        }
    } catch (error) {
        console.error("Chart Error:", error);
    }
}

function renderCharts(data) {
    const sorted = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
    const labels = sorted.map(d => new Date(d.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}));
    const temps = sorted.map(d => d.temperature);
    const hums = sorted.map(d => d.humidity);
    const soils = sorted.map(d => d.soil_moisture);

    updateChart('chartTemp', tempChart, labels, temps, 'Temp', '#e74c3c', (c) => tempChart = c);
    updateChart('chartHumidity', humChart, labels, hums, 'Hum', '#3498db', (c) => humChart = c);
    updateChart('chartSoil', soilChart, labels, soils, 'Soil', '#2ecc71', (c) => soilChart = c);
}

function updateChart(canvasId, chartInstance, labels, data, label, color, setInstance) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;
    
    if (chartInstance) chartInstance.destroy();
    
    const newChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label,
                data: data,
                borderColor: color,
                backgroundColor: color + '33', // Transparencia
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { 
                legend: { display: false }, // Ocultamos leyenda pequeña
                title: {                    // <--- AQUÍ AGREGAMOS EL TÍTULO
                    display: true,
                    text: getChartTitle(label), // Función para poner nombre bonito
                    color: '#00000',           // Color blanco para contraste
                    font: { size: 16, weight: 'bold' },
                    padding: { bottom: 15 }
                }
            },
            scales: { 
                x: { 
                    display: false // Ocultamos eje X para limpieza visual
                },
                y: {
                    ticks: { color: 'rgba(0,0,0,0.7)' },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                }
            }
        }
    });
    setInstance(newChart);
}

// Helper para convertir etiquetas cortas en Títulos Completos
function getChartTitle(shortLabel) {
    switch(shortLabel) {
        case 'Temp': return 'Temperature History (°C)';
        case 'Hum': return 'Humidity History (%)';
        case 'Soil': return 'Soil Moisture Trend';
        default: return shortLabel;
    }
}

// Helpers UI
function updateLoadingProgress(prog, text) { /* Opcional */ }
function showMainContent() {
    if(loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            if(mainContent) mainContent.style.display = 'block';
        }, 500);
    }
}

// Control de Botones Manuales
function updateButtonUI(data) {
    if(data.fan !== undefined) document.getElementById('fan-toggle').checked = (data.fan === true || data.fan === "true");
    if(data.heater !== undefined) document.getElementById('heater-toggle').checked = (data.heater === true || data.heater === "true");
    if(data.irrigation !== undefined) document.getElementById('irrigation-toggle').checked = (data.irrigation === true || data.irrigation === "true");
}

// Listeners de Botones
const toggles = ['fan', 'heater', 'irrigation'];
toggles.forEach(id => {
    const elem = document.getElementById(`${id}-toggle`);
    if(elem) {
        elem.addEventListener('change', () => {
            set(ref(database, `actuator_controls/${PLANT_CONFIG.deviceId}/${id}`), elem.checked);
        });
    }
});

// Loop
setInterval(fetchPrediction, 60000);
setInterval(queryHistoricalData, 60000);
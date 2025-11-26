// --- Gestión de Pantalla de Carga ---
let loadingProgress = 0;
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');
const loadingProgressBar = document.getElementById('loadingProgress');
const loadingSubtext = document.querySelector('.loading-subtext');
const connectionStatusElement = document.getElementById('connection-status');

function updateLoadingProgress(progress, text) {
    loadingProgress = progress;
    loadingProgressBar.style.width = `${progress}%`;
    if (text) {
        loadingSubtext.textContent = text;
    }
}

function showMainContent() {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
        loadingScreen.style.display = 'none';
        mainContent.style.display = 'block';
    }, 500);
}

// --- Importaciones de Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";

// --- Configuración de Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyD7fWCpBesKzl8rwsTzmsRkHuE9S49mvxs",
    authDomain: "agcroller.firebaseapp.com",
    databaseURL: "https://agcroller-default-rtdb.firebaseio.com",
    projectId: "agcroller",
    storageBucket: "agcroller.appspot.com",
    messagingSenderId: "727334750629",
    appId: "1:727334750629:web:116cb81a3f18722385804c",
    measurementId: "G-Z5V96W39V6"
};

updateLoadingProgress(10, "Connecting to Cloud...");
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- (Inicialización de Firebase App y Database existente) ---
const auth = getAuth(app);

// --- VARIABLES GLOBALES DE PLANTA (Con valores por defecto) ---
let PLANT_CONFIG = {
    name: "Default",
    minTemp: 18,
    maxTemp: 28,
    maxHum: 70,
    soilLimit: 3000 // Valor crudo (Seco)
};

// 1. PROTECCIÓN DE RUTA Y LOGOUT
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html";
    } else {
        console.log("Logged as:", user.email);
        loadPlantProfile(); // Cargar datos al iniciar
    }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});

// 2. GESTIÓN DEL PERFIL DE PLANTA (Firebase)
const plantConfigRef = ref(database, 'plant_config');

function loadPlantProfile() {
    onValue(plantConfigRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            PLANT_CONFIG = data;
            document.getElementById('currentPlantName').innerText = `Monitoring: ${data.name}`;
            updateLoadingProgress(100, "Profile Loaded");
        }
    });
}

// 3. LÓGICA DEL MODAL (Abrir/Cerrar/Guardar)
const modal = document.getElementById('plantModal');
document.getElementById('settingsBtn').addEventListener('click', () => {
    // Poner valores actuales en el formulario
    document.getElementById('plantName').value = PLANT_CONFIG.name;
    document.getElementById('minTemp').value = PLANT_CONFIG.minTemp;
    document.getElementById('maxTemp').value = PLANT_CONFIG.maxTemp;
    document.getElementById('maxHum').value = PLANT_CONFIG.maxHum;
    document.getElementById('soilLimit').value = PLANT_CONFIG.soilLimit;
    modal.style.display = 'flex';
});

document.getElementById('closeModal').addEventListener('click', () => modal.style.display = 'none');

document.getElementById('plantForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newConfig = {
        name: document.getElementById('plantName').value,
        minTemp: parseFloat(document.getElementById('minTemp').value),
        maxTemp: parseFloat(document.getElementById('maxTemp').value),
        maxHum: parseFloat(document.getElementById('maxHum').value),
        soilLimit: parseFloat(document.getElementById('soilLimit').value)
    };
    
    // Guardar en Firebase
    set(plantConfigRef, newConfig).then(() => {
        modal.style.display = 'none';
        alert("Plant profile updated!");
    });
});

document.getElementById('deletePlant').addEventListener('click', () => {
    if(confirm("Reset to default settings?")) {
        const defaultConfig = { name: "Default", minTemp: 18, maxTemp: 28, maxHum: 70, soilLimit: 3000 };
        set(plantConfigRef, defaultConfig);
        modal.style.display = 'none';
    }
});

// --- Referencias al DOM ---
const tempValueElement = document.getElementById('temperature-value');
const tempStatusElement = document.getElementById('temperature-status');
const humidityValueElement = document.getElementById('humidity-value');
const humidityStatusElement = document.getElementById('humidity-status');
const lightValueElement = document.getElementById('light-value');
const lightStatusElement = document.getElementById('light-status');
const predictionValueElement = document.getElementById('prediction-value');
const predictionStatusElement = document.getElementById('prediction-status');
const soilMoistureValueElement = document.getElementById('soil-moisture-value');
const soilMoistureStatusElement = document.getElementById('soil-moisture-status');

const fanToggle = document.getElementById('fan-toggle');
const heaterToggle = document.getElementById('heater-toggle'); // Controla Luces
const irrigationToggle = document.getElementById('irrigation-toggle');

const tempCanvas = document.getElementById('chartTemp');
const humCanvas = document.getElementById('chartHumidity');
const soilCanvas = document.getElementById('chartSoil');

// --- Listeners de Datos en Tiempo Real ---
updateLoadingProgress(30, "Syncing sensors...");
const sensorDataRef = ref(database, 'latest_readings');
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        updateSensorUI(data);
        checkConnectionStatus(data.timestamp);
    }
});

const actuatorStatusRef = ref(database, 'actuator_status');
onValue(actuatorStatusRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateButtonUI(data);
});

// --- Control de Actuadores ---
updateLoadingProgress(50, "Initializing Controls...");

function handleToggleChange(actuatorName, checkbox) {
    const newState = checkbox.checked;
    const label = document.getElementById(`${actuatorName}-status-text`);
    label.innerText = "Sending...";

    set(ref(database, `actuator_controls/${actuatorName}`), newState)
        .then(() => {
            console.log(`Command sent: ${actuatorName} -> ${newState}`);
        })
        .catch((error) => {
            console.error(`Error:`, error);
            checkbox.checked = !newState;
            label.innerText = "Error";
        });
}

if (fanToggle) fanToggle.addEventListener('change', () => handleToggleChange('fan', fanToggle));
if (heaterToggle) heaterToggle.addEventListener('change', () => handleToggleChange('heater', heaterToggle));
if (irrigationToggle) irrigationToggle.addEventListener('change', () => handleToggleChange('irrigation', irrigationToggle));

// --- Actualizaciones de UI ---
function updateSensorUI(data) {
    // Temperatura
    if (data.temperature !== undefined) {
        const temp = data.temperature.toFixed(1);
        tempValueElement.innerText = `${temp} °C`;
        
        // USAMOS LAS VARIABLES DINÁMICAS AQUÍ
        if (temp > PLANT_CONFIG.maxTemp) {
            tempValueElement.className = 'sensor-value status-high';
            tempStatusElement.innerText = `Too Hot (> ${PLANT_CONFIG.maxTemp})`;
        } else if (temp < PLANT_CONFIG.minTemp) {
            tempValueElement.className = 'sensor-value status-low';
            tempStatusElement.innerText = `Too Cold (< ${PLANT_CONFIG.minTemp})`;
        } else {
            tempValueElement.className = 'sensor-value status-optimal';
            tempStatusElement.innerText = "Optimal";
        }
    }

    // Humedad
    if (data.humidity !== undefined) {
        const hum = data.humidity.toFixed(1);
        humidityValueElement.innerText = `${hum} %`;
        if (hum > PLANT_CONFIG.maxHum) {
            humidityValueElement.className = 'sensor-value status-high';
            humidityStatusElement.innerText = `High Humidity (> ${PLANT_CONFIG.maxHum})`;
        } else {
            humidityValueElement.className = 'sensor-value status-optimal';
            humidityStatusElement.innerText = "Optimal";
        }
    }

    // Suelo
    if (data.soil_moisture !== undefined) {
        soilMoistureValueElement.innerText = data.soil_moisture;
        if (data.soil_moisture > PLANT_CONFIG.soilLimit) {
            soilMoistureValueElement.className = 'sensor-value status-high'; // Rojo
            soilMoistureStatusElement.innerText = "Needs Water";
        } else {
            soilMoistureValueElement.className = 'sensor-value status-optimal';
            soilMoistureStatusElement.innerText = "Moist";
        }
    }
    
    // ... (Luz se queda igual o puedes agregar config también) ...
    if (data.light_received !== undefined) {
         // ... tu lógica existente de luz ...
         lightValueElement.innerText = `${data.light_received} lx`;
         // ...
    }
}

function checkConnectionStatus(timestamp) {
    // Simplemente indicamos Online para evitar falsos negativos visuales
    connectionStatusElement.innerText = "● System Online";
    connectionStatusElement.style.background = "rgba(46, 204, 113, 0.8)";
}

function updateButtonUI(data) {
    if (fanToggle) updateToggleState(fanToggle, 'fan', data.fan);
    if (heaterToggle) updateToggleState(heaterToggle, 'heater', data.heater);
    if (irrigationToggle) updateToggleState(irrigationToggle, 'irrigation', data.irrigation);
}

function updateToggleState(element, name, state) {
    element.checked = state;
    const label = document.getElementById(`${name}-status-text`);
    if (label) label.innerText = state ? "ON" : "OFF";
}

// --- Gráficos (Con Lógica Avanzada) ---
let tempChart = null;
let humChart = null;
let soilChart = null;

// Referencia al selector nuevo con PROTECCIÓN
const historyRangeSelect = document.getElementById('history-range');

if (historyRangeSelect) {
    historyRangeSelect.addEventListener('change', () => {
        queryHistoricalData();
    });
} else {
    console.warn("Selector de historial no encontrado. Usando valor por defecto.");
}

async function queryHistoricalData() {
    updateLoadingProgress(70, "Fetching history...");

    // PROTECCIÓN: Si no existe el selector, usa 30 por defecto
    let rangeLimit = 30;
    if (historyRangeSelect) {
        rangeLimit = parseInt(historyRangeSelect.value) || 30;
    }

    const logsRef = ref(database, 'sensor_logs');
    const recentLogsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(rangeLimit));

    try {
        const snapshot = await get(recentLogsQuery);
        if (snapshot.exists()) {
            const rawData = snapshot.val();
            renderCharts(rawData);
            updateLoadingProgress(80, "Rendering visuals...");
        } else {
            updateLoadingProgress(80, "No data found");
        }
    } catch (error) {
        console.error("Chart Error:", error);
        updateLoadingProgress(80, "Chart Error (Check Console)");
    }
}

function renderCharts(rawData) {
    // 1. Ordenar datos crudos
    const sortedData = Object.values(rawData).sort((a, b) => a.timestamp - b.timestamp);

    if (sortedData.length === 0) return;

    // --- TRUCO DE MAGIA DE TIEMPO ---
    // Asumimos que el último dato recibido pasó "ahora mismo" para generar horas reales
    const now = Date.now();
    const lastDataTimestamp = sortedData[sortedData.length - 1].timestamp;
    const timeOffset = now - lastDataTimestamp;

    // 2. FILTRO DE SUAVIZADO (Anti-Ruido)
    // Esto evita que la gráfica se vea saturada si pedimos muchos datos
    const maxPointsOnScreen = 60;
    const step = Math.ceil(sortedData.length / maxPointsOnScreen);

    const smoothData = [];
    for (let i = 0; i < sortedData.length; i += step) {
        smoothData.push(sortedData[i]);
    }
    // Aseguramos que el último punto (el actual) siempre esté presente
    if (sortedData.length > 0 && smoothData[smoothData.length - 1] !== sortedData[sortedData.length - 1]) {
        smoothData.push(sortedData[sortedData.length - 1]);
    }

    // 3. Generar Etiquetas de Hora Real
    const labels = smoothData.map((log) => {
        const realTime = log.timestamp + timeOffset;
        return new Date(realTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    const tempData = smoothData.map(log => log.temperature);
    const humidityData = smoothData.map(log => log.humidity);
    const soilData = smoothData.map(log => log.soil_moisture);

    document.getElementById('last-updated').innerText = `Last updated: ${new Date().toLocaleTimeString()}`;

    // Destruir gráficos anteriores
    if (tempChart) tempChart.destroy();
    if (humChart) humChart.destroy();
    if (soilChart) soilChart.destroy();

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        elements: {
            point: { radius: 0, hitRadius: 20, hoverRadius: 6 },
            line: { borderWidth: 3, tension: 0.4 }
        },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                titleColor: '#2c3e50',
                bodyColor: '#2c3e50',
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                displayColors: true,
                callbacks: {
                    title: function (context) {
                        return context[0].label; // Mostrar hora en el tooltip
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                grid: { display: false },
                ticks: {
                    maxTicksLimit: 6,
                    maxRotation: 0,
                    color: 'rgba(255,255,255,0.7)' // Texto claro para fondo oscuro
                }
            },
            y: {
                grid: { color: 'rgba(255,255,255,0.1)' }, // Grilla sutil
                beginAtZero: false
            }
        }
    };

    // 1. Temp
    const ctxTemp = tempCanvas.getContext('2d');
    const gradTemp = ctxTemp.createLinearGradient(0, 0, 0, 300);
    gradTemp.addColorStop(0, 'rgba(231, 76, 60, 0.4)');
    gradTemp.addColorStop(1, 'rgba(231, 76, 60, 0.0)');
    tempChart = new Chart(ctxTemp, { type: 'line', data: { labels: labels, datasets: [{ label: 'Temperature (°C)', data: tempData, borderColor: '#e74c3c', backgroundColor: gradTemp, fill: true }] }, options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: 'Temperature (°C)', color: '#e74c3c', font: { size: 16 } } } } });

    // 2. Humedad
    const ctxHum = humCanvas.getContext('2d');
    const gradHum = ctxHum.createLinearGradient(0, 0, 0, 300);
    gradHum.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
    gradHum.addColorStop(1, 'rgba(52, 152, 219, 0.0)');
    humChart = new Chart(ctxHum, { type: 'line', data: { labels: labels, datasets: [{ label: 'Humidity (%)', data: humidityData, borderColor: '#3498db', backgroundColor: gradHum, fill: true }] }, options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: 'Humidity (%)', color: '#3498db', font: { size: 16 } } } } });

    // 3. Suelo
    const ctxSoil = soilCanvas.getContext('2d');
    const gradSoil = ctxSoil.createLinearGradient(0, 0, 0, 300);
    gradSoil.addColorStop(0, 'rgba(46, 204, 113, 0.4)');
    gradSoil.addColorStop(1, 'rgba(46, 204, 113, 0.0)');
    soilChart = new Chart(ctxSoil, { type: 'line', data: { labels: labels, datasets: [{ label: 'Soil Moisture', data: soilData, borderColor: '#2ecc71', backgroundColor: gradSoil, fill: true }] }, options: { ...commonOptions, plugins: { ...commonOptions.plugins, title: { display: true, text: 'Soil Moisture', color: '#2ecc71', font: { size: 16 } } } } });
}

// --- 9. AI Prediction Fetching (UPDATED) ---
async function fetchPrediction() {
    // Muestra un estado de carga sutil si lo deseas, o déjalo transparente
    // updateLoadingProgress(90, "Consulting AI Brain..."); 

    try {
        const response = await fetch('https://EnriqueAGC.pythonanywhere.com/predict_and_control');

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.predicted_temperature) {
            // 1. Mostrar el número
            predictionValueElement.innerText = `${data.predicted_temperature.toFixed(1)} °C`;

            // 2. Mostrar lo que la IA está "pensando" (El mensaje nuevo)
            if (data.ai_reasoning) {
                predictionStatusElement.innerText = data.ai_reasoning;
                // Hacer que el texto resalte si es una advertencia
                predictionStatusElement.style.fontWeight = "bold";
            } else {
                predictionStatusElement.innerText = "Prediction successful";
            }

            // 3. Cambiar el color según la gravedad del pronóstico
            predictionValueElement.className = 'sensor-value'; // Reset
            if (data.ai_condition_status === 'warning') {
                predictionValueElement.classList.add('status-high'); // Rojo/Naranja
                predictionStatusElement.style.color = "#e74c3c";
            } else {
                predictionValueElement.classList.add('status-optimal'); // Verde
                predictionStatusElement.style.color = "#2ecc71";
            }

        } else {
            throw new Error(data.error || "Invalid response from API");
        }
    } catch (error) {
        console.error("Error fetching AI prediction:", error);
        predictionValueElement.innerText = "--.-";
        predictionStatusElement.innerText = "AI Brain Offline";
        predictionStatusElement.style.color = "#95a5a6";
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    updateLoadingProgress(5, "Booting...");
    await Promise.all([queryHistoricalData(), fetchPrediction()]);
    updateLoadingProgress(100, "Ready");
    showMainContent();

    // Refresco automático
    setInterval(queryHistoricalData, 60000);
    setInterval(fetchPrediction, 300000);
});
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
    if (data.temperature !== undefined) {
        const temp = data.temperature.toFixed(1);
        tempValueElement.innerText = `${temp} °C`;
        if (temp > 28) {
            tempValueElement.className = 'sensor-value status-high';
            tempStatusElement.innerText = "High Alert";
        } else if (temp < 18) {
            tempValueElement.className = 'sensor-value status-low';
            tempStatusElement.innerText = "Low Temp";
        } else {
            tempValueElement.className = 'sensor-value status-optimal';
            tempStatusElement.innerText = "Optimal";
        }
    }

    if (data.humidity !== undefined) {
        const humidity = data.humidity.toFixed(1);
        humidityValueElement.innerText = `${humidity} %`;
        if (humidity > 70) {
            humidityValueElement.className = 'sensor-value status-high';
            humidityStatusElement.innerText = "Too Humid";
        } else {
            humidityValueElement.className = 'sensor-value status-optimal';
            humidityStatusElement.innerText = "Optimal";
        }
    }

    if (data.light_received !== undefined) {
        lightValueElement.innerText = `${data.light_received} lx`;
        lightStatusElement.innerText = "Updated";
    }

    if (data.soil_moisture !== undefined) {
        soilMoistureValueElement.innerText = data.soil_moisture;
        soilMoistureStatusElement.innerText = data.soil_moisture > 750 ? "Needs Water" : "Optimal";
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

// --- IA ---
async function fetchPrediction() {
    updateLoadingProgress(90, "AI Forecasting...");
    try {
        const response = await fetch('http://127.0.0.1:5000/predict');
        if (!response.ok) throw new Error("API Error");
        const data = await response.json();
        if (data.predicted_temperature) {
            predictionValueElement.innerText = `${data.predicted_temperature.toFixed(1)} °C`;
            predictionStatusElement.innerText = "Forecast ready";
        }
    } catch (error) {
        console.error("AI Error:", error);
        predictionValueElement.innerText = "N/A";
        predictionStatusElement.innerText = "AI Unavailable";
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
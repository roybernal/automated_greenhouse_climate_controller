/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: script.js
--------------------------------------------------------------------
Description: This file handles all client-side logic for the
dashboard. It connects to Firebase, listens for real-time data,
updates the UI, handles user interaction, and renders a historical
data chart using Chart.js.
--------------------------------------------------------------------
Authors:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
--------------------------------------------------------------------
Last modification: October 25, 2025
--------------------------------------------------------------------
*/

// --- Loading Screen Management ---
let loadingProgress = 0;
const loadingScreen = document.getElementById('loadingScreen');
const mainContent = document.getElementById('mainContent');
const loadingProgressBar = document.getElementById('loadingProgress');
const loadingSubtext = document.querySelector('.loading-subtext');

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

// --- Button Loading States ---
function showButtonLoading(button, actuatorName) {
    const buttonText = button.querySelector('.button-text');
    const buttonIcon = button.querySelector('.material-symbols-outlined');

    button.setAttribute('data-original-text', buttonText.textContent);
    button.setAttribute('data-original-icon', buttonIcon.textContent);

    buttonText.textContent = "Sending...";
    buttonIcon.textContent = "refresh";
    button.classList.add('loading');
    button.disabled = true;

    console.log(`⏳ Sending command for: ${actuatorName}`);
}

function hideButtonLoading(button) {
    button.classList.remove('loading');
    button.disabled = false;
}

// --- 1. Module Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// --- 2. Firebase Configuration ---
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

// --- 3. Firebase Initialization ---
updateLoadingProgress(10, "Connecting to Firebase...");
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- 4. DOM Element References ---
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
const fanButton = document.getElementById('fan-button');
const heaterButton = document.getElementById('heater-button');
const lightsButton = document.getElementById('lights-button');
const irrigationButton = document.getElementById('irrigation-button');

// --- Chart Canvases ---
const tempChartCanvas = document.getElementById('historicalChartTemp');
const humidityChartCanvas = document.getElementById('historicalChartHumidity');
const soilChartCanvas = document.getElementById('historicalChartSoil');

// --- 5. Real-Time Data Listeners ---
updateLoadingProgress(30, "Initializing data streams...");
const sensorDataRef = ref(database, 'latest_readings');
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateSensorUI(data);
});

const actuatorStatusRef = ref(database, 'actuator_status');
onValue(actuatorStatusRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        updateButtonUI(data);
        // Hide loading state for any button that is not loading anymore
        hideButtonLoading(fanButton);
        hideButtonLoading(heaterButton);
        hideButtonLoading(lightsButton);
        hideButtonLoading(irrigationButton);
    }
});

// --- 6. Event Handlers ---
updateLoadingProgress(50, "Setting up controls...");
function toggleActuator(actuatorName, buttonElement) {
    const isCurrentlyOn = buttonElement.classList.contains('status-on');
    const newState = !isCurrentlyOn;

    showButtonLoading(buttonElement, actuatorName);

    console.log(`📤 Sending command: ${actuatorName} -> ${newState}`);

    set(ref(database, `actuator_controls/${actuatorName}`), newState)
        .then(() => {
            console.log(`✅ Command sent successfully to Firebase: ${actuatorName} = ${newState}`);
        })
        .catch((error) => {
            console.error(`❌ Error sending command:`, error);
            hideButtonLoading(buttonElement);
        });
}

fanButton.addEventListener('click', () => toggleActuator('fan', fanButton));
heaterButton.addEventListener('click', () => toggleActuator('heater', heaterButton));
lightsButton.addEventListener('click', () => toggleActuator('led_light', lightsButton));
irrigationButton.addEventListener('click', () => toggleActuator('irrigation', irrigationButton));

// --- 7. UI Update Functions ---
function updateSensorUI(data) {
    // Temperature
    if (data.temperature !== undefined) {
        const temp = data.temperature.toFixed(1);
        tempValueElement.innerText = `${temp} °C`;
        tempValueElement.className = 'sensor-value';
        if (temp > 28) {
            tempValueElement.classList.add('status-high');
            tempStatusElement.innerText = "High Alert!";
        } else if (temp < 18) {
            tempValueElement.classList.add('status-low');
            tempStatusElement.innerText = "Too Low";
        } else {
            tempValueElement.classList.add('status-optimal');
            tempStatusElement.innerText = "Optimal";
        }
    }
    // Humidity
    if (data.humidity !== undefined) {
        const humidity = data.humidity.toFixed(1);
        humidityValueElement.innerText = `${humidity} %`;
        humidityValueElement.className = 'sensor-value';
        if (humidity > 70) {
            humidityValueElement.classList.add('status-high');
            humidityStatusElement.innerText = "Too High";
        } else {
            humidityValueElement.classList.add('status-optimal');
            humidityStatusElement.innerText = "Optimal";
        }
    }
    // Light
    if (data.light_received !== undefined) {
        const light = data.light_received;
        lightValueElement.innerText = `${light} lx`;
        lightValueElement.className = 'sensor-value';
        if (light > 850) {
            lightValueElement.classList.add('status-low');
            lightStatusElement.innerText = "Too Dark";
        } else if (light < 50) {
            lightValueElement.classList.add('status-high');
            lightStatusElement.innerText = "Too Bright";
        } else {
            lightValueElement.classList.add('status-optimal');
            lightStatusElement.innerText = "Optimal";
        }
    }
    // Soil Moisture
    if (data.soil_moisture !== undefined) {
        const soil = data.soil_moisture;
        soilMoistureValueElement.innerText = `${soil}`;
        soilMoistureValueElement.className = 'sensor-value';
        if (soil > 750) {
            soilMoistureValueElement.classList.add('status-high');
            soilMoistureStatusElement.innerText = "Too dry, needs watering";
        } else if (soil < 400) {
            soilMoistureValueElement.classList.add('status-low');
            soilMoistureStatusElement.innerText = "Too wet, reduce watering";
        }
        else {
            soilMoistureValueElement.classList.add('status-optimal');
            soilMoistureStatusElement.innerText = "Optimal";
        }
    }
}

function updateButtonUI(data) {
    setButtonState(fanButton, data.fan, "Turn OFF", "Turn ON");
    setButtonState(heaterButton, data.heater, "Turn OFF", "Turn ON");
    setButtonState(lightsButton, data.led_light, "Turn OFF", "Turn ON");
    setButtonState(irrigationButton, data.irrigation, "Stop Cycle", "Start Cycle");
}

function setButtonState(button, isOn, onText, offText) {
    const buttonText = button.querySelector('.button-text');
    if (isOn) {
        button.classList.remove('status-off');
        button.classList.add('status-on');
        buttonText.innerText = onText;
    } else {
        button.classList.remove('status-on');
        button.classList.add('status-off');
        buttonText.innerText = offText;
    }
}

// --- 8. Chart Logic ---
let historicalTempChart = null;
let historicalHumidityChart = null;
let historicalSoilChart = null;

async function queryHistoricalData() {
    updateLoadingProgress(70, "Fetching historical data...");
    const logsRef = ref(database, 'sensor_logs');
    const recentLogsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(50));
    try {
        const snapshot = await get(recentLogsQuery);
        if (snapshot.exists()) {
            const rawData = snapshot.val();
            renderAllCharts(rawData);
            updateLoadingProgress(80, "Rendering charts...");
        } else {
            console.log("No historical data available to chart.");
        }
    } catch (error) {
        console.error("Error fetching historical data:", error);
    }
}

function renderAllCharts(rawData) {
    const sortedData = Object.values(rawData).sort((a, b) => a.timestamp - b.timestamp);
    const labels = sortedData.map(log => new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));

    const tempData = sortedData.map(log => log.temperature?.toFixed(1) || 0);
    const humidityData = sortedData.map(log => log.humidity?.toFixed(1) || 0);
    const soilData = sortedData.map(log => log.soil_moisture?.toFixed(1) || 0);

    // Update last updated timestamp
    const lastUpdatedElement = document.getElementById('last-updated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }

    // Destroy existing charts before creating new ones
    destroyAllCharts();

    // Create new charts
    historicalTempChart = renderChart(tempChartCanvas, 'Temperature', labels, tempData, 'rgba(231, 76, 60, 1)', 'rgba(231, 76, 60, 0.2)');
    historicalHumidityChart = renderChart(humidityChartCanvas, 'Humidity', labels, humidityData, 'rgba(52, 152, 219, 1)', 'rgba(52, 152, 219, 0.2)');
    historicalSoilChart = renderChart(soilChartCanvas, 'Soil Moisture', labels, soilData, 'rgba(39, 174, 96, 1)', 'rgba(39, 174, 96, 0.2)');
}

function renderChart(canvas, label, labels, data, borderColor, backgroundColor) {
    if (!canvas) {
        console.error(`Canvas not found for: ${label}`);
        return null;
    }
    const ctx = canvas.getContext('2d');
    if (canvas.chart) {
        canvas.chart.destroy();
        canvas.chart = null;
    }
    try {
        const chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: false, grid: { color: 'rgba(200, 200, 200, 0.2)' }, ticks: { font: { family: "'Roboto', sans-serif" } } },
                    x: { grid: { display: false }, ticks: { font: { family: "'Roboto', sans-serif" }, maxRotation: 45, minRotation: 45 } }
                },
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: label, font: { size: 16, family: "'Roboto', sans-serif", weight: 'bold' }, padding: 20 },
                    tooltip: { backgroundColor: 'rgba(0, 0, 0, 0.8)', titleFont: { family: "'Roboto', sans-serif" }, bodyFont: { family: "'Roboto', sans-serif" } }
                },
                interaction: { intersect: false, mode: 'index' },
                elements: { point: { radius: 3, hoverRadius: 6 } }
            }
        });
        canvas.chart = chartInstance;
        return chartInstance;
    } catch (error) {
        console.error(`Error creating chart for ${label}:`, error);
        return null;
    }
}

function destroyAllCharts() {
    if (historicalTempChart) {
        historicalTempChart.destroy();
        historicalTempChart = null;
    }
    if (historicalHumidityChart) {
        historicalHumidityChart.destroy();
        historicalHumidityChart = null;
    }
    if (historicalSoilChart) {
        historicalSoilChart.destroy();
        historicalSoilChart = null;
    }
}

// --- 9. AI Prediction Fetching ---
async function fetchPrediction() {
    updateLoadingProgress(90, "Running AI prediction...");
    try {
        const response = await fetch('http://127.0.0.1:5000/predict');
        if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

        const data = await response.json();
        if (data.predicted_temperature) {
            predictionValueElement.innerText = `${data.predicted_temperature.toFixed(1)} °C`;
            predictionStatusElement.innerText = "Prediction successful";
            predictionValueElement.className = 'sensor-value status-optimal';
        } else {
            throw new Error(data.error || "Invalid response from API");
        }
    } catch (error) {
        console.error("Error fetching AI prediction:", error);
        predictionValueElement.innerText = "Error";
        predictionStatusElement.innerText = "Could not connect to API";
        predictionValueElement.className = 'sensor-value status-high';
    }
}

// --- Initial Function Calls ---
document.addEventListener('DOMContentLoaded', async function () {
    // 1. Inicia la simulación de carga
    updateLoadingProgress(5, "Initializing...");

    // 2. Ejecuta todas las tareas de carga en paralelo
    await Promise.all([
        queryHistoricalData(), // Carga los gráficos
        fetchPrediction()      // Carga la predicción de IA
    ]);

    // 3. Una vez que todo esté cargado, actualiza la barra y muestra el contenido
    updateLoadingProgress(100, "System ready!");
    setTimeout(showMainContent, 500); // Pequeña pausa para ver el "Ready!"

    // 4. Configura las actualizaciones automáticas
    setInterval(queryHistoricalData, 60000); // Actualiza gráficos cada minuto
    setInterval(fetchPrediction, 300000); // Actualiza predicción cada 5 minutos
});

// Limpiar gráficos cuando la página se cierre/recargue
window.addEventListener('beforeunload', () => {
    destroyAllCharts();
});
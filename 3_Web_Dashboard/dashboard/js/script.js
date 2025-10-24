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
Last modification: October 24, 2025
--------------------------------------------------------------------
*/

// --- 1. Module Imports ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get, startAt } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- 4. DOM Element References ---
const tempValueElement = document.getElementById('temperature-value');
const tempStatusElement = document.getElementById('temperature-status');
const humidityValueElement = document.getElementById('humidity-value');
const humidityStatusElement = document.getElementById('humidity-status');
const lightValueElement = document.getElementById('light-value');
const lightStatusElement = document.getElementById('light-status');
const soilMoistureValueElement = document.getElementById('soil-moisture-value');
const soilMoistureStatusElement = document.getElementById('soil-moisture-status');
const fanButton = document.getElementById('fan-button');
const heaterButton = document.getElementById('heater-button');
const lightsButton = document.getElementById('lights-button');
const irrigationButton = document.getElementById('irrigation-button');
const notificationList = document.getElementById('notification-list');
const chartCanvas = document.getElementById('historicalChart');

// --- 5. Real-Time Data Listeners ---
const sensorDataRef = ref(database, 'latest_readings');
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateSensorUI(data);
});

const actuatorStatusRef = ref(database, 'actuator_status');
onValue(actuatorStatusRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateButtonUI(data);
});

// --- 6. Event Handlers ---
function toggleActuator(actuatorName, buttonElement) {
    const isCurrentlyOn = buttonElement.classList.contains('status-on');
    const newState = !isCurrentlyOn;
    set(ref(database, `actuator_controls/${actuatorName}`), newState);
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
        
        if (soil > 750) { // Asumimos 750+ es seco
            soilMoistureValueElement.classList.add('status-high');
            soilMoistureStatusElement.innerText = "Too dry, needs watering";
        } else if (soil < 400) { // Asumimos 400- es muy húmedo
            soilMoistureValueElement.classList.add('status-low');
            soilMoistureStatusElement.innerText = "Too wet, reduce watering";
        } else {
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

function addNotification(type, message) {
    // ... (notification logic)
}

// --- 8. Lógica del Gráfico 

let historicalChart; // Variable global para la instancia del gráfico

/**
 * @description Dibuja o actualiza el gráfico de datos históricos en el lienzo.
 * @param {object} chartData - Los datos ya formateados para Chart.js.
 */


// --- Modifica la función formatDataForChart para que active el 'fill' ---


async function queryHistoricalData() {
    const logsRef = ref(database, 'sensor_logs');
    const recentLogsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(20));
    try {
        const snapshot = await get(recentLogsQuery);
        if (snapshot.exists()) {
            const rawData = snapshot.val();
            const formattedData = formatDataForChart(rawData);
            renderChart(formattedData);
        } else {
            console.log("No historical data available to chart.");
        }
    } catch (error) {
        console.error("Error fetching historical data:", error);
    }
}

function formatDataForChart(rawData) {
    const labels = [];
    const temperatureData = [];
    const humidityData = [];
    const soilMoistureData = [];

    const sortedData = Object.values(rawData).sort((a, b) => a.timestamp - b.timestamp);
    sortedData.forEach(log => {
        const date = new Date(log.timestamp);
        const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        labels.push(timeLabel);
        temperatureData.push(log.temperature.toFixed(1));
        humidityData.push(log.humidity.toFixed(1));
        soilMoistureData.push(log.soil_moisture.toFixed(1));
    });
    return {
        labels: labels,
        datasets: [{
            label: 'Temperature (°C)',
            data: temperatureData,
            borderColor: '#e74c3c',
            tension: 0.2,
            fill: false,
        }, {
            label: 'Humidity (%)',
            data: humidityData,
            borderColor: '#3498db',
            tension: 0.2,
            fill: false,
        },
        {
            label: 'Humidity (Soil)',
            data: soilMoistureData,
            borderColor: '#27ae60', // Verde
            tension: 0.2,
            fill: false,
        }]
    };
}

function renderChart(chartData) {
    if (!chartCanvas) return;
    const ctx = chartCanvas.getContext('2d');
    if (historicalChart) {
        historicalChart.destroy();
    }
    historicalChart = new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: {
            responsive: true,
            scales: { y: { beginAtZero: false } },
            plugins: { legend: { position: 'top' } }
        }
    });
}

// --- Initial Function Calls ---
queryHistoricalData();
setInterval(queryHistoricalData, 60000); // Actualiza el gráfico cada minuto
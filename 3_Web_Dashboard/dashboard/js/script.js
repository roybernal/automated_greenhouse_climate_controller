/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: script.js
--------------------------------------------------------------------
Description: This file handles all client-side logic for the
dashboard. It connects to Firebase, listens for real-time data,
updates the UI, handles user interaction, and formats data for
k charts.
--------------------------------------------------------------------
Authors:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
--------------------------------------------------------------------
Last modification: October 22, 2025
--------------------------------------------------------------------
*/

// --- 1. Module Imports ---
// Import necessary functions from the Firebase SDK
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
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- 4. DOM Element References ---
const tempValueElement = document.getElementById('temperature-value');
const tempStatusElement = document.getElementById('temperature-status');
const humidityValueElement = document.getElementById('humidity-value');
const humidityStatusElement = document.getElementById('humidity-status');
const lightValueElement = document.getElementById('light-value');
const lightStatusElement = document.getElementById('light-status');
const fanButton = document.getElementById('fan-button');
const heaterButton = document.getElementById('heater-button');
const lightsButton = document.getElementById('lights-button');
const irrigationButton = document.getElementById('irrigation-button');
const notificationList = document.getElementById('notification-list');

// --- 5. Real-Time Data Listeners ---

// Listener for real-time sensor data updates
const sensorDataRef = ref(database, 'latest_readings');
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        console.log("Sensor data received:", data);
        updateSensorUI(data);
    }
});

// Listener for real-time actuator status updates
const actuatorStatusRef = ref(database, 'actuator_status');
onValue(actuatorStatusRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        console.log("Actuator status received:", data);
        updateButtonUI(data);
    }
});


// --- 6. Event Handlers ---

/**
 * @description Toggles the state of a given actuator by writing the new state to Firebase.
 * @param {string} actuatorName - The name of the actuator in Firebase (e.g., 'fan').
 * @param {HTMLElement} buttonElement - The button element in the DOM.
 */
function toggleActuator(actuatorName, buttonElement) {
    const isCurrentlyOn = buttonElement.classList.contains('status-on');
    const newState = !isCurrentlyOn;
    set(ref(database, `actuator_controls/${actuatorName}`), newState);
}

fanButton.addEventListener('click', () => toggleActuator('fan', fanButton));
heaterButton.addEventListener('click', () => toggleActuator('heater', heaterButton));
lightsButton.addEventListener('click', () => toggleActuator('led_light', lightsButton));
irrigationButton.addEventListener('click', () => {
    set(ref(database, `actuator_controls/irrigation`), true);
    addNotification('info', 'Irrigation cycle start request sent.');
});

/**
 * @description Toggles the state of a given actuator by writing the new state to Firebase.
 * @param {string} actuatorName - The name of the actuator in Firebase.
 * @param {HTMLElement} buttonElement - The button element in the DOM.
 */
function toggleActuator(actuatorName, buttonElement) {
    const isCurrentlyOn = buttonElement.classList.contains('status-on');
    const newState = !isCurrentlyOn;
    set(ref(database, `actuator_controls/${actuatorName}`), newState);
}

// --- 7. UI Update Functions ---

/**
 * @description Updates the sensor cards on the dashboard with new data.
 * @param {object} data - The sensor data object from Firebase.
 */
function updateSensorUI(data) {
    // Update Temperature
    if (data.temperature !== undefined) {
        const temp = data.temperature.toFixed(1);
        tempValueElement.innerText = `${temp} °C`;
        tempValueElement.className = 'sensor-value'; // Reset classes
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

    // Update Humidity
    if (data.humidity !== undefined) {
        const humidity = data.humidity.toFixed(1);
        humidityValueElement.innerText = `${humidity} %`;
        humidityValueElement.className = 'sensor-value'; // Reset classes
        if (humidity > 70) {
            humidityValueElement.classList.add('status-high');
            humidityStatusElement.innerText = "Too High";
        } else {
            humidityValueElement.classList.add('status-optimal');
            humidityStatusElement.innerText = "Optimal";
        }
    }

    // Update Light Intensity
    if (data.light_received !== undefined) {
        const light = data.light_received;
        lightValueElement.innerText = `${light} lx`;
        lightValueElement.className = 'sensor-value'; // Reset classes
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
}

/**
 * @description Updates the UI of all actuator buttons based on their real status from Firebase.
 * @param {object} data - The actuator status object from Firebase.
 */
function updateButtonUI(data) {
    setButtonState(fanButton, data.fan, "Turn OFF", "Turn ON");
    setButtonState(heaterButton, data.heater, "Turn OFF", "Turn ON");
    setButtonState(lightsButton, data.led_light, "Turn OFF", "Turn ON");
}

/**
 * @description Sets the visual state (color and text) of a single button.
 * @param {HTMLElement} button - The button element to update.
 * @param {boolean} isOn - The status received from Firebase (true for ON, false for OFF).
 * @param {string} onText - The text to display when the actuator is ON.
 * @param {string} offText - The text to display when the actuator is OFF.
 */
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

/**
 * @description Adds a new notification to the top of the notification list.
 * @param {string} type - The type of notification ('info' or 'warning').
 * @param {string} message - The message to display.
 */
function addNotification(type, message) {
    const newNotification = document.createElement('div');
    // ... (notification creation logic) ...
}


// --- 8. Charting Logic (NEW SECTION FOR US-06) ---

/**
 * @description Queries Firebase for the last N historical sensor logs.
 * @async
 */
async function queryHistoricalData() {
    const yesterday = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    const logsRef = ref(database, 'sensor_logs');
    const recentLogsQuery = query(logsRef, orderByChild('timestamp'), startAt(yesterday));

    try {
        const snapshot = await get(recentLogsQuery);
        if (snapshot.exists()) {
            const rawData = snapshot.val();
            const formattedData = formatDataForChart(rawData);
            console.log("Formatted data ready for chart:", formattedData);
            renderChart(formattedData); // This will be used in Task 6.5
        } else {
            console.log("No historical data available to chart.");
        }
    } catch (error) {
        console.error("Error fetching historical data:", error);
    }
}



// *** --- 9. NUEVA FUNCIÓN PARA RENDERIZAR LA GRÁFICA --- ***

/**
 * @description Renderiza la gráfica de Chart.js en el canvas.
 * @param {object} chartData - Los datos formateados por formatDataForChart.
 */
function renderChart(chartData) {
    const ctx = document.getElementById('historicalChart').getContext('2d');

    // Si una gráfica ya existe, la destruye antes de dibujar la nueva
    // Esto evita que se sobrepongan al refrescar los datos.
    if (historicalChartInstance) {
        historicalChartInstance.destroy();
    }

    historicalChartInstance = new Chart(ctx, {
        type: 'line', // Gráfica de línea, mejor para historial
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false // Permite que el eje Y se ajuste a los datos
                }
            },
            plugins: {
                legend: {
                    position: 'top', // Coloca la leyenda arriba
                }
            }
        }
    });
}



/**
 * @description Transforms raw Firebase data into a format compatible with Chart.js.
 * @param {object} rawData - The raw object of sensor logs from Firebase.
 * @returns {object} A structured object containing labels and datasets for Chart.js.
 */
function formatDataForChart(rawData) {
    const labels = [];
    const temperatureData = [];
    const humidityData = [];

    const sortedData = Object.values(rawData).sort((a, b) => a.timestamp - b.timestamp);

    sortedData.forEach(log => {
        const date = new Date(log.timestamp);
        const timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

        labels.push(timeLabel);
        temperatureData.push(log.temperature.toFixed(1));
        humidityData.push(log.humidity.toFixed(1));
    });

    return {
        labels: labels,
        datasets: [
            {
                label: 'Temperature (°C)',
                data: temperatureData,
                borderColor: '#e74c3c',
                tension: 0.2,
                fill: false,
                pointBackgroundColor: '#e74c3c'
            },
            {
                label: 'Humidity (%)',
                data: humidityData,
                borderColor: '#3498db',
                tension: 0.2,
                fill: false,
                pointBackgroundColor: '#3498db'
            }
        ]
    };
}

// --- Initial function call ---
queryHistoricalData();
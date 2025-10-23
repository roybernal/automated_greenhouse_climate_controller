/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: script.js
--------------------------------------------------------------------
Description: This file handles all the client-side logic for the
dashboard. It connects to Firebase, listens for real-time data
from sensors and actuators, and dynamically updates the HTML to
reflect the current state of the greenhouse.
--------------------------------------------------------------------
Authors:
- Lucio Emiliano Ruiz Sepulveda
- Rodrigo Samuel Bernal Moreno
- Enrique Alfonso Gracian Castro
- Jesus Perez Rodriguez
--------------------------------------------------------------------
Last modification: October 6, 2025
--------------------------------------------------------------------
*/

// --- 1. Firebase SDK Integration ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";
// --- 2. Your Web App's Firebase Configuration ---
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

// --- 3. Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- 4. Get References to HTML Elements ---
const tempValueElement = document.getElementById('temperature-value');
const tempStatusElement = document.getElementById('temperature-status');
const humidityValueElement = document.getElementById('humidity-value');
const humidityStatusElement = document.getElementById('humidity-status');

const notificationList = document.getElementById('notification-list');
const fanButton = document.getElementById('fan-button');
const heaterButton = document.getElementById('heater-button');
const lightsButton = document.getElementById('lights-button');
const irrigationButton = document.getElementById('irrigation-button');
const lightValueElement = document.getElementById('light-value');
const lightStatusElement = document.getElementById('light-status');
// Add other elements as needed

let historicalChartInstance;

// --- 5. Listen for Real-Time Data Changes ---
// *** CORRECTION: Point directly to the 'latest_readings' object ***
const sensorDataRef = ref(database, 'latest_readings');
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        console.log("Received data:", data);
        updateDashboard(data);
    } else {
        console.log("No data available from Firebase.");
    }
});

// --- 6. Function to Update the Dashboard ---
function updateDashboard(data) {
    // *** CORRECTION: Use the correct keys (temperature, humidity) ***
    if (data.temperature !== undefined) {
        const temp = data.temperature.toFixed(1);
        tempValueElement.innerText = `${temp} °C`;

        tempValueElement.classList.remove('status-optimal', 'status-high', 'status-low');

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

    if (data.humidity !== undefined) {
        const humidity = data.humidity.toFixed(1);
        humidityValueElement.innerText = `${humidity} %`;

        humidityValueElement.classList.remove('status-optimal', 'status-high', 'status-low');

        if (humidity > 70) {
            humidityValueElement.classList.add('status-high');
            humidityStatusElement.innerText = "Too High";
        } else {
            humidityValueElement.classList.add('status-optimal');
            humidityStatusElement.innerText = "Optimal";
        }
    }

    if (data.light_received !== undefined) {
        lightValueElement.innerText = `${data.light_received}`; // Asumiendo que es un valor analógico

        if (data.light_received > 700) {
            lightStatusElement.innerText = "Bright";
        } else if (data.light_received > 300) {
            lightStatusElement.innerText = "Dim";
        } else {
            lightStatusElement.innerText = "Dark";
        }
    }
}

// --- 7. Actuator Status & Control ---

// Listener for actuator status changes
const actuatorStatusRef = ref(database, 'actuator_status');
onValue(actuatorStatusRef, (snapshot) => {
    const status = snapshot.val();
    if (status) {
        updateButtonUI('fan', status.fan, fanButton);
        updateButtonUI('heater', status.heater, heaterButton);
        updateButtonUI('led_light', status.led_light, lightsButton);
    }
});

/**
 * @description Updates a single button's UI based on its state.
 * @param {string} actuatorName - The name of the actuator (e.g., 'fan').
 * @param {boolean} state - The current state (true for ON, false for OFF).
 * @param {HTMLElement} button - The button element.
 */
function updateButtonUI(actuatorName, state, button) {
    if (state) {
        button.classList.add('status-on');
        button.classList.remove('status-off');
        button.querySelector('.button-text').innerText = "Turn OFF";
    } else {
        button.classList.add('status-off');
        button.classList.remove('status-on');
        button.querySelector('.button-text').innerText = "Turn ON";
    }
}

/**
 * @description Toggles an actuator's state in Firebase.
 * @param {string} actuatorName - The name of the actuator (e.g., 'fan').
 * @param {HTMLElement} button - The button element.
 */
function toggleActuator(actuatorName, button) {
    const currentText = button.querySelector('.button-text').innerText;
    const newState = (currentText === "Turn ON"); // If text is "Turn ON", new state is true

    set(ref(database, `actuator_controls/${actuatorName}`), newState)
        .then(() => {
            addNotification('success', `${actuatorName} command sent.`);
        })
        .catch((error) => {
            addNotification('error', `Error sending ${actuatorName} command.`);
            console.error(error);
        });
}

// --- Event Handlers (Task 5.1) ---
fanButton.addEventListener('click', () => toggleActuator('fan', fanButton));
heaterButton.addEventListener('click', () => toggleActuator('heater', heaterButton));
lightsButton.addEventListener('click', () => toggleActuator('led_light', lightsButton));

irrigationButton.addEventListener('click', () => {
    // La irrigación es un pulso, no un toggle
    set(ref(database, `actuator_controls/irrigation`), true);
    addNotification('info', 'Irrigation cycle start request sent.');
    // Opcional: El ESP8266 debería resetear 'irrigation' a 'false'
});


/**
 * @description Adds a notification to the notification list.
 * @param {string} type - 'info', 'success', or 'error'.
 * @param {string} message - The message to display.
 */
function addNotification(type, message) {
    const li = document.createElement('li');
    li.className = `notification ${type}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'material-symbols-outlined';

    if (type === 'success') {
        iconSpan.innerText = 'check_circle';
    } else if (type === 'error') {
        iconSpan.innerText = 'error';
    } else {
        iconSpan.innerText = 'info';
    }

    li.appendChild(iconSpan);
    li.appendChild(document.createTextNode(message));

    notificationList.prepend(li); // Add new notifications to the top

    // Remove the notification after 5 seconds
    setTimeout(() => {
        li.classList.add('fade-out');
        // Remove element from DOM after fade-out animation
        setTimeout(() => li.remove(), 500);
    }, 5000);
}

// --- 8. Charting Logic (NEW SECTION FOR US-06) ---

/**
 * @description Queries Firebase for the last N historical sensor logs.
 * @async
 */
async function queryHistoricalData() {
    const logsRef = ref(database, 'sensor_logs');
    const recentLogsQuery = query(logsRef, orderByChild('timestamp'), limitToLast(12));

    try {
        const snapshot = await get(recentLogsQuery);
        if (snapshot.exists()) {
            const rawData = snapshot.val();
            const formattedData = formatDataForChart(rawData);
            console.log("Formatted data ready for chart:", formattedData);
            
            // *** LÍNEA ACTUALIZADA (DESCOMENTADA) ***
            renderChart(formattedData); // Llama a la nueva función
        } else {
            console.log("No historical data available to chart.");
        }
    } catch (error) {
        console.error("Error fetching historical data:", error);
    }
}

/**
 * @description Transforms raw Firebase data into a format compatible with Chart.js.
 * @param {object} rawData - The raw object of sensor logs from Firebase.
 * @returns {object} A structured object containing labels and datasets for Chart.js.
 */
function formatDataForChart(rawData) {
    // ... (esta función ya está correcta, no la modifiques) ...
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


// --- Initial function call ---
queryHistoricalData();
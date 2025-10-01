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
Last modification: September 25, 2025
--------------------------------------------------------------------
*/

// --- 1. Firebase SDK Integration ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

// --- 2. Firebase Configuration ---
// TODO: Replace with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// --- 3. Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- 4. Get References to HTML Elements ---
// Sensors
const tempValueElement = document.getElementById('temperature-value');
const tempStatusElement = document.getElementById('temperature-status');
const humidityValueElement = document.getElementById('humidity-value');
const humidityStatusElement = document.getElementById('humidity-status');
// Actuators
const fanButton = document.getElementById('fan-button');
const heaterButton = document.getElementById('heater-button');
const lightsButton = document.getElementById('lights-button');
// Notifications
const notificationList = document.getElementById('notification-list');

// --- 5. Listen for Real-Time Data from Device ---
const sensorDataRef = ref(database, 'sensor_data'); // Changed to 'sensor_data'
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateSensorDashboard(data);
});

const actuatorStatusRef = ref(database, 'actuator_status'); // Listen for actuator status
onValue(actuatorStatusRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateActuatorButtons(data);
});

// --- 6. Event Listeners for Buttons ---
fanButton.addEventListener('click', () => toggleActuator('fan', fanButton));
heaterButton.addEventListener('click', () => toggleActuator('heater', heaterButton));
lightsButton.addEventListener('click', () => toggleActuator('lights', lightsButton));

function toggleActuator(actuatorName, buttonElement) {
    const currentStatus = buttonElement.classList.contains('status-on');
    const newStatus = !currentStatus;
    // Update Firebase with the new desired state
    set(ref(database, `actuator_controls/${actuatorName}`), newStatus);
}

// --- 7. Update Functions ---
function updateSensorDashboard(data) {
    // Update Temperature
    if (data.temperature !== undefined) {
        const temp = data.temperature.toFixed(1);
        tempValueElement.innerText = `${temp} °C`;
        tempValueElement.classList.remove('status-optimal', 'status-high', 'status-low');
        if (temp > 28) {
            tempValueElement.classList.add('status-high');
            tempStatusElement.innerText = "High Alert!";
            addNotification('warning', `High temperature detected: ${temp}°C`);
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
        humidityValueElement.classList.remove('status-optimal', 'status-high', 'status-low');
        if (humidity > 70) {
            humidityValueElement.classList.add('status-high');
            humidityStatusElement.innerText = "Too High";
        } else {
            humidityValueElement.classList.add('status-optimal');
            humidityStatusElement.innerText = "Optimal";
        }
    }
}

function updateActuatorButtons(data) {
    // Update Fan Button
    updateButtonUI(fanButton, data.fan, "Turn OFF", "Turn ON");
    // Update Heater Button
    updateButtonUI(heaterButton, data.heater, "Turn OFF", "Turn ON");
    // Update Lights Button
    updateButtonUI(lightsButton, data.lights, "Turn OFF", "Turn ON");
}

function updateButtonUI(button, status, onText, offText) {
    const buttonText = button.querySelector('.button-text');
    if (status) { // true means ON
        button.classList.remove('status-off');
        button.classList.add('status-on');
        buttonText.innerText = onText;
    } else { // false means OFF
        button.classList.remove('status-on');
        button.classList.add('status-off');
        buttonText.innerText = offText;
    }
}

function addNotification(type, message) {
    const newNotification = document.createElement('div');
    newNotification.innerText = message;
    newNotification.style.padding = '10px';
    newNotification.style.borderRadius = '5px';
    newNotification.style.backgroundColor = type === 'warning' ? '#fdebd0' : '#eaf3f7';
    notificationList.prepend(newNotification); // Add to the top of the list
}
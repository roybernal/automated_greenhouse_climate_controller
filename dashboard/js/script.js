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
// Sensors
const tempValueElement = document.getElementById('temperature-value');
const tempStatusElement = document.getElementById('temperature-status');
const humidityValueElement = document.getElementById('humidity-value');
const humidityStatusElement = document.getElementById('humidity-status');
const lightValueElement = document.getElementById('light-value');
const lightStatusElement = document.getElementById('light-status');

// Actuators
const fanButton = document.getElementById('fan-button');
const heaterButton = document.getElementById('heater-button');
const lightsButton = document.getElementById('lights-button');
const irrigationButton = document.getElementById('irrigation-button');

// Notifications
const notificationList = document.getElementById('notification-list');

// --- 5. Listen for Real-Time Data from Device ---
const sensorDataRef = ref(database, 'sensor_data');
onValue(sensorDataRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateSensorDashboard(data);
});

const actuatorStatusRef = ref(database, 'actuator_status');
onValue(actuatorStatusRef, (snapshot) => {
    const data = snapshot.val();
    if (data) updateActuatorButtons(data);
});

// --- 6. Event Listeners for Buttons ---
fanButton.addEventListener('click', () => toggleActuator('fan', fanButton));
heaterButton.addEventListener('click', () => toggleActuator('heater', heaterButton));
lightsButton.addEventListener('click', () => toggleActuator('lights', lightsButton));
irrigationButton.addEventListener('click', () => {
    // For a cycle, we might just send a 'true' signal to start it
    set(ref(database, `actuator_controls/irrigation`), true);
    addNotification('info', 'Irrigation cycle started.');
});


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
    // Update Light Intensity
    if (data.light_received !== undefined) {
        const light = data.light_received;
        lightValueElement.innerText = `${light} lx`;
        lightValueElement.classList.remove('status-optimal', 'status-high', 'status-low');
        if (light > 800) { // Example threshold for darkness
            lightValueElement.classList.add('status-low');
            lightStatusElement.innerText = "Too Dark";
        } else if (light < 100) { // Example threshold for too much light
            lightValueElement.classList.add('status-high');
            lightStatusElement.innerText = "Too Bright";
        } else {
            lightValueElement.classList.add('status-optimal');
            lightStatusElement.innerText = "Optimal";
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
    // This is a simple version. A real app would prevent duplicates and allow dismissing.
    const newNotification = document.createElement('div');
    newNotification.innerText = message;
    // Basic styling, can be improved in CSS
    newNotification.style.padding = '10px';
    newNotification.style.borderRadius = '5px';
    newNotification.style.borderLeft = '4px solid';

    if (type === 'warning') {
        newNotification.style.backgroundColor = '#fdebd0';
        newNotification.style.borderColor = '#e67e22';
    } else {
        newNotification.style.backgroundColor = '#eaf3f7';
        newNotification.style.borderColor = '#3498db';
    }

    // Add to the top of the list
    if (notificationList.firstChild) {
        notificationList.insertBefore(newNotification, notificationList.firstChild);
    } else {
        notificationList.appendChild(newNotification);
    }
}
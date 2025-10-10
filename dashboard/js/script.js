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
Last modification: October 7, 2025
--------------------------------------------------------------------
*/

// --- 1. Firebase SDK Integration ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-database.js";

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
// === NEW: Add references for the light sensor elements ===
const lightValueElement = document.getElementById('light-value');
const lightStatusElement = document.getElementById('light-status');


// --- 5. Listen for Real-Time Data Changes ---
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
    // Update Temperature
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

    // Update Humidity
    if (data.humidity !== undefined) {
        const humidity = data.humidity.toFixed(1);
        humidityValueElement.innerText = `${humidity} %`;
        humidityValueElement.classList.remove('status-optimal', 'status-high');

        if (humidity > 70) {
            humidityValueElement.classList.add('status-high');
            humidityStatusElement.innerText = "Too High";
        } else {
            humidityValueElement.classList.add('status-optimal');
            humidityStatusElement.innerText = "Optimal";
        }
    }

    // === NEW: Add logic to update the light intensity card ===
    if (data.light_received !== undefined) {
        const light = data.light_received;
        lightValueElement.innerText = `${light} lx`; // Use "lx" for lux
        lightValueElement.classList.remove('status-optimal', 'status-high', 'status-low');

        // This logic mirrors your Arduino code
        if (light > 600) {
            lightValueElement.classList.add('status-low'); // Dark blue for night
            lightStatusElement.innerText = "Too Dark"; // "Es de noche"
        } else if (light < 100) {
            lightValueElement.classList.add('status-high'); // Red for too bright
            lightStatusElement.innerText = "Too Bright"; // "Hay demasiada luz"
        } else {
            lightValueElement.classList.add('status-optimal'); // Green for optimal
            lightStatusElement.innerText = "Optimal"; // "Es de dia"
        }
    }
}
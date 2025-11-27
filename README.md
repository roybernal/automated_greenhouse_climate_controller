🌱 Automated Greenhouse Climate Controller
An advanced IoT platform powered by Artificial Intelligence to monitor and control multiple greenhouse environments. This system enables users to manage various plants with specific climate requirements, featuring real-time data visualization, multi-language support, and proactive AI control for temperature, humidity, lighting, and soil moisture.

Live Demo: https://agcroller.web.app

🌟 Key Features
🔐 Multi-User & Multi-Greenhouse Architecture:

Secure Login/Register system using Firebase Authentication.

Hierarchical management: User -> Greenhouses -> Plants.

Link distinct physical ESP32 devices to specific plant profiles via Device IDs.

🌍 Full Internationalization (i18n):

Interface available in English, Spanish, French, German, and Japanese.

Auto-detection and persistence of language preferences.

🧠 Advanced AI Forecasting (4-Variable):

A machine learning model (hosted on PythonAnywhere) predicts Temperature, Humidity, Light, and Soil Moisture trends for the next hour.

Context-Aware Control: The AI analyzes specific thresholds for each plant (e.g., "Tomatoes" vs "Ferns") to make decisions.

Proactive Actuation: Automatically triggers Fans, Heaters, Grow Lights, and Irrigation before conditions become critical.

📊 Modern Web Dashboard:

Real-time sensor visualization.

Interactive charts with historical data filters (Live, 1 Hour, 24 Hours, Last Week).

Responsive design optimized for Desktop and Mobile.

💧 Smart Hardware Integration:

Segregated data logging per device ID in Firebase Realtime Database.

Automatic safety timeouts for irrigation systems.

📂 Project Structure
The repository is organized to keep firmware, frontend, and AI logic modular.

Plaintext
.
├── 1_Documentation/          # Circuit diagrams and schematics
├── 2_Hardware_and_Prototypes/
│   └── ESP8266_Sketches/     # Firmware for ESP32 (Production Ready)
├── 3_Web_Dashboard/dashboard/# The Frontend Web App
│   ├── css/                  # Styles (Responsive & Glassmorphism)
│   ├── js/                   # Logic: Auth, Plants Manager, Translations, Charts
│   ├── index.html            # Main Control Panel
│   ├── plants.html           # Greenhouse Selection Grid
│   └── login.html            # Authentication Entry
├── 5_AI_Model/               # Python Backend & ML
│   ├── app_completa.py       # Flask API (The Brain) hosted on Cloud
│   ├── train_model.py        # Script to train the 4 Linear Regression models
│   └── *.joblib              # Trained models (Temp, Hum, Light, Soil)
└── README.md

🛠️ Hardware Components
Microcontroller: ESP32 (configured with a unique DEVICE_ID).

Sensors:

DHT11 (Air Temperature & Humidity)

LDR Photoresistor (Light Intensity)

Capacitive Soil Moisture Sensor (Analog)

Actuators:

5V DC Fan (Cooling/Humidity Control)

LEDs / Grow Lights (Lighting Control)

Submersible Water Pump (Smart Irrigation)

Relay Module (Power switching)

💻 Software Stack
Frontend: HTML5, CSS3, Vanilla JavaScript (ES6 Modules).

Backend & Database: Firebase Realtime Database, Firebase Authentication, Firebase Hosting.

AI Engine: Python (Flask, Scikit-learn, Pandas, Joblib) hosted on PythonAnywhere.

Firmware: C++ / Arduino Framework (using Firebase_ESP_Client).

🧠 AI Logic & Decision Making
The system doesn't just react; it predicts.

Data Collection: The ESP32 pushes sensor readings to Firebase every 5-10 seconds.

Prediction Request: The Web Dashboard sends a POST request to the AI API containing:

The Plant's Limits (Min/Max Temp, Soil Limit, etc.).

The Device ID linked to that plant.

Processing:

The API fetches the latest historical data for that specific device from Firebase.

It runs 4 separate Linear Regression models to forecast future conditions.

Action:

If a future hazard is detected (e.g., "Predicted Temp > Max Temp"), the AI sends a command to Firebase to activate the necessary actuator (e.g., Turn Fan ON).

It returns a localized reasoning message (e.g., "🔥 Calor Futuro" or "🌵 Sequía Prevista") to the user.

🚀 How to Run/Deploy
1. Firmware (ESP32)
Open Greenhouse_Controller_Final_ESP32.ino.

Set your WiFi Credentials and Firebase API Key.

Crucial: Set the DEVICE_ID (e.g., "greenhouse_1") to match what you will register in the web app.

Flash to ESP32.

2. AI Backend (PythonAnywhere)
Upload the contents of 5_AI_Model to your server.

Install dependencies: pip install flask flask-cors pandas scikit-learn joblib firebase-admin.

Run python train_and_save_model.py (or entrenar_todo.py) to generate the .joblib files.

Configure the Web App to run app_completa.py.

3. Frontend (Firebase Hosting)
The web app is already configured for deployment.

Bash

# Install Firebase Tools
npm install -g firebase-tools

# Login
firebase login

# Initialize (if starting fresh)
firebase init hosting

# Deploy to live URL
firebase deploy --only hosting

👥 Contributors
Lucio Emiliano Ruiz Sepulveda

Rodrigo Samuel Bernal Moreno

Enrique Alfonso Gracián Castro

Jesús Pérez Rodríguez

📄 License
This project is licensed under the MIT License - see the LICENSE.md file for details.
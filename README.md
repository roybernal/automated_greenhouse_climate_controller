Automated Greenhouse Climate Controller

An IoT system powered by Artificial Intelligence to monitor and control a greenhouse environment. This project uses sensors and actuators to maintain optimal climate conditions, featuring data visualization and proactive control driven by a predictive AI model. Developed using the Agile (Scrum) methodology.

🌟 Key Features

Real-Time Monitoring: Tracks temperature, humidity, light levels, and soil moisture.

Automated Climate Control: Automatically activates fans and lights based on sensor thresholds.

Smart Irrigation System: Automatically waters plants when soil moisture falls below a specific level, with safety timeouts included.

AI-Powered Proactive Control: A machine learning model predicts future temperature trends and activates actuators before conditions become critical.

Web Dashboard: A complete interface to visualize real-time data, historical charts, and AI predictions.

Data Logging: All sensor data is logged to Firebase for historical analysis and model retraining.

📂 Project Structure

The repository is organized to keep documentation, hardware code, frontend, and AI logic separate and clean.

.
|-- 1_Documentation/ # Circuit diagrams and datasheets
|-- 2_Hardware_and_Prototypes/ # Source code for microcontrollers
| |-- Arduino_Uno_Sketches/ # Initial prototypes
| `-- ESP8266_Sketches/       # Main firmware (ESP32 & ESP8266)
|-- 3_Web_Dashboard/            # HTML, CSS, JS for the frontend
|-- 4_Simulations/              # Wokwi simulation files
|-- 5_AI_Model/                 # Python scripts for ML and API
`-- README.md

🛠️ Hardware Components

Microcontroller: ESP32 (Upgraded from ESP8266 for better performance and analog inputs).

Sensors:

DHT11 (Temperature and Humidity)

LDR Photoresistor (Light Level)

Capacitive Soil Moisture Sensor (Analog)

Ultrasonic Sensor (Water tank level)

Actuators:

5V DC Fan (Cooling)

LEDs / Grow Lights (Heating/Lighting simulation)

Submersible Water Pump (Irrigation)

Relay Module (To control high-load actuators)

💻 Software and Technologies

Firmware: C++ / Arduino Framework (using Firebase_ESP_Client).

Web Dashboard: HTML5, CSS3, JavaScript (Module-based), Chart.js.

Backend/Cloud: Firebase Realtime Database.

AI & Data Science: Python, Pandas, Scikit-learn, Joblib.

API & Integration: Flask (Python), Flask-CORS.

🧠 AI Model & Logic

The project features a complete AI workflow located in the 5_AI_Model directory:

Training: The train_and_save_model.py script trains a Linear Regression model using historical data (sensor_logs.csv) to predict the temperature 1 hour into the future.

API (api.py): A Flask server that exposes the trained model. It fetches real-time data from Firebase, runs the prediction, and returns a JSON response with the forecasted temperature and a reasoning message (e.g., "Heat Spike Predicted").

Controller (ai_controller.py): A background script that constantly monitors the API's predictions. If a critical condition is forecast, it proactively sends commands to Firebase to turn on the fan or heater now, preventing the problem before it happens.

🚀 How to Run the Project (Development)

To run the complete system, you need to start three separate processes in your terminal (or VS Code terminals):

1. Start the Web Dashboard

Navigate to the dashboard folder and launch it using a local server (like Live Server).

cd 3_Web_Dashboard/dashboard

# Open index.html with Live Server (Usually Port 5500)

2. Start the AI Prediction API

This allows the dashboard to query the AI brain.

cd 5_AI_Model

# Activate your virtual environment if you have one

python api.py

# The server will start at [http://127.0.0.1:5000](http://127.0.0.1:5000)

3. Start the AI Control Loop (Optional for Full Automation)

This script enables the proactive automation features.

cd 5_AI_Model
python ai_controller.py

# You will see logs like: "🤖 AI Controller Started. Monitoring predictions..."

4. Power the Hardware

Ensure your ESP32 is powered on and connected to WiFi. It will automatically sync with Firebase, completing the loop.

👥 Contributors

Lucio Emiliano Ruiz Sepulveda

Rodrigo Samuel Bernal Moreno

Enrique Alfonso Gracián Castro

Jesús Pérez Rodríguez

📄 License

This project is licensed under the MIT License - see the LICENSE.md file for details.

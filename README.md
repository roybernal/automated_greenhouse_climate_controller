# Automated Greenhouse Climate Controller

An IoT and AI-powered system to monitor and control greenhouse environments. This project uses sensors and actuators to maintain optimal climate conditions, with data visualization and proactive control driven by a predictive AI model. Developed using Agile (Scrum) methodology.

## Key Features

-   **Real-time Monitoring**: Tracks temperature, humidity, light levels, and water tank levels.
-   **Automated Climate Control**: Activates fans and lights automatically to maintain optimal conditions.
-   **AI-Powered Predictions**: A machine learning model predicts future temperature trends, allowing for proactive climate management.
-   **Web Dashboard**: A simple and clean interface to visualize sensor data.
-   **Data Logging**: Sensor data is automatically logged to Firebase for analysis and model training.
-   **IoT Integration**: Built on the ESP8266 platform for WiFi connectivity.

## Project Structure

The repository is organized to separate documentation, hardware code, the web dashboard, AI model, and simulations, making it clean and easy to navigate.

```
.
|-- 1_Documentation/
|-- 2_Hardware_and_Prototypes/
|-- 3_Web_Dashboard/
|-- 4_Simulations/
|-- 5_AI_Model/
`-- README.md
```

-   **`1_Documentation`**: Contains all project-related documents, including circuit diagrams and component datasheets.
-   **`2_Hardware_and_Prototypes`**: Contains all source code for the microcontrollers.
    -   `Arduino_Uno_Sketches`: Initial prototypes and individual sensor tests using an Arduino Uno.
    -   `ESP8266_Sketches`: The main controller code for the ESP8266 platform.
-   **`3_Web_Dashboard`**: The front-end code (HTML, CSS, JS) for the web-based monitoring dashboard.
-   **`4_Simulations`**: Project files for circuit and code simulations (Wokwi).
-   **`5_AI_Model`**: Contains the Python scripts for data processing, model training, and prediction.

## Hardware Components

-   **Microcontroller**: ESP8266 (NodeMCU)
-   **Sensors**:
    -   DHT11 (Temperature and Humidity)
    -   Ultrasonic Sensor (for water level)
    -   Photoresistor (Light Sensor)
-   **Actuators**:
    -   5V DC Fan
    -   LEDs

## Software & Technologies

-   **Microcontroller Firmware**: C++ / Arduino Framework
-   **Web Dashboard**: HTML, CSS, JavaScript
-   **AI & Data Processing**: Python, Pandas, Scikit-learn, Flask
-   **Database**: Firebase Realtime Database
-   **Circuit Simulation**: Wokwi
-   **Circuit Design**: Fritzing

## Data Processing and AI Model

The `5_AI_Model` directory contains the scripts to handle the data and the machine learning model:

1.  **Data Collection**: The ESP8266 microcontroller sends sensor data to a Firebase Realtime Database.
2.  **Data Export**: The `convert_export_to_csv.py` script downloads the data from Firebase (in JSON format) and converts it into a CSV file (`sensor_logs.csv`).
3.  **Data Cleaning**: The data is cleaned and prepared for training.
4.  **Model Training**: The `train_model.py` script trains a machine learning model to predict temperature based on the sensor data.
5.  **Prediction**: The `predict_from_firebase.py` script uses the trained model to make predictions.
6.  **API**: A Flask API (`flask_API.py`) is provided to serve the model's predictions.

## Getting Started

To get started with this project, you will need to:

1.  **Set up the hardware**: Assemble the circuit as shown in the `1_Documentation` folder.
2.  **Flash the microcontroller**: Upload the code from `2_Hardware_and_Prototypes/ESP8266_Sketches` to your ESP8266.
3.  **Set up Firebase**: Create a new Firebase project and update the credentials in the ESP8266 code.
4.  **Run the web dashboard**: Open the `index.html` file in the `3_Web_Dashboard/dashboard` folder.
5.  **Train the AI model**:
    *   Make sure you have Python and the required libraries installed (`pandas`, `scikit-learn`, `joblib`).
    *   Download your Firebase data as a JSON file and place it in the `5_AI_Model` folder.
    *   Run `python convert_export_to_csv.py` to create the CSV file.
    *   Run `python train_model.py` to train the model.

## Contributors

-   Lucio Emiliano Ruiz Sepulveda
-   Rodrigo Samuel Bernal Moreno
-   Enrique Alfonso Gracián Castro
-   Jesús Pérez Rodríguez

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---
# Automated Greenhouse Climate Controller

An IoT and AI-powered system to monitor and control greenhouse environments. This project uses sensors and actuators to maintain optimal climate conditions, with data visualization and proactive control driven by a predictive AI model. Developed using Agile (Scrum) methodology.

## Key Features

-   **Real-time Monitoring**: Tracks temperature, humidity, light levels, and water tank levels.
-   **Automated Climate Control**: Activates fans and lights automatically to maintain optimal conditions.
-   **Web Dashboard**: A simple and clean interface to visualize sensor data.
-   **IoT Integration**: Built on the ESP8266 platform for WiFi connectivity.

## Project Structure

The repository is organized to separate documentation, hardware code, the web dashboard, and simulations, making it clean and easy to navigate.

```
.
|-- 1_Documentation/
|-- 2_Hardware_and_Prototypes/
|-- 3_Web_Dashboard/
|-- 4_Simulations/
`-- README.md
```

-   **`1_Documentation`**: Contains all project-related documents, including circuit diagrams and component datasheets.
-   **`2_Hardware_and_Prototypes`**: Contains all source code for the microcontrollers.
    -   `Arduino_Uno_Sketches`: Initial prototypes and individual sensor tests using an Arduino Uno.
    -   `ESP8266_Sketches`: The main controller code for the ESP8266 platform.
-   **`3_Web_Dashboard`**: The front-end code (HTML, CSS, JS) for the web-based monitoring dashboard.
-   **`4_Simulations`**: Project files for circuit and code simulations (Wokwi).

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
-   **Circuit Simulation**: Wokwi
-   **Circuit Design**: Fritzing

## Contributors

-   Lucio Emiliano Ruiz Sepulveda
-   Rodrigo Samuel Bernal Moreno
--   Enrique Alfonso Gracian Castro
-   Jesus Perez Rodriguez

---
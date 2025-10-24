/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller
--------------------------------------------------------------------
File: Greenhouse_Controller_v3.ino
--------------------------------------------------------------------
Description: This version adds a real-time listener for commands
from the web dashboard, enabling remote control of actuators.
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

// --- 1. LIBRARIES ---
#include <ESP8266WiFi.h>
#include "DHT.h"
#include <Firebase_ESP_Client.h> // Librería potente para Firebase
#include "addons/TokenHelper.h"   // Ayudantes de la librería

// --- 2. CREDENTIALS & CONFIGURATION ---
const char* WIFI_SSID = "upaep wifi";

// --- Pega aquí tu API Key y la URL de tu base de datos ---
#define API_KEY "AIzaSyD7fWCpBesKzl8rwsTzmsRkHuE9S49mvxs"
#define DATABASE_URL "agcroller-default-rtdb.firebaseio.com"

// --- 3. PIN DEFINITIONS ---
#define DHTPIN D2
#define DHTTYPE DHT11
const int ledPin = D1; // Representa el 'heater'
const int fanRelayPin = D6;
const int lightSensorPin = A0;

// --- 4. GLOBAL OBJECTS & VARIABLES ---
DHT dht(DHTPIN, DHTTYPE);
FirebaseData stream;
FirebaseAuth auth;
FirebaseConfig config;
unsigned long sendDataPrevMillis = 0;

// --- 5. FUNCIÓN CALLBACK (EL "OÍDO") ---
// Esta función se ejecuta automáticamente cuando hay un cambio en /actuator_controls/
void streamCallback(FirebaseStream data) {
  Serial.printf("Comando recibido en la ruta: %s\n", data.dataPath().c_str());

  // Revisa si el comando es para el ventilador (fan)
  if (data.dataPath() == "/fan") {
    if (data.dataType() == "boolean") {
      bool fanState = data.boolData();
      Serial.printf("Comando para ventilador: %s\n", fanState ? "ENCENDER" : "APAGAR");
      digitalWrite(fanRelayPin, fanState ? LOW : HIGH); // LOW=ON, HIGH=OFF
    }
  }

  // Revisa si el comando es para el calentador (heater)
  if (data.dataPath() == "/heater") {
    if (data.dataType() == "boolean") {
      bool heaterState = data.boolData();
      Serial.printf("Comando para calentador: %s\n", heaterState ? "ENCENDER" : "APAGAR");
      digitalWrite(ledPin, heaterState ? HIGH : LOW); // HIGH=ON, LOW=OFF
    }
  }
}

// Función para manejar timeouts del stream
void streamTimeoutCallback(bool timeout) {
  if (timeout) Serial.println("Stream timeout, reanudando...");
}

// --- 6. SETUP ---
void setup() {
  Serial.begin(9600);
  connectToWifi();

  // Configuración de Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.reconnectWiFi(true);
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);

  // --- Inicia el listener ---
  if (!Firebase.RTDB.beginStream(&stream, "/actuator_controls")) {
    Serial.printf("Error al iniciar el listener: %s\n", stream.errorReason().c_str());
  } else {
    Serial.println("Escuchando comandos desde el dashboard...");
  }
  Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);

  // Configuración de pines (sin cambios)
  pinMode(ledPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  digitalWrite(fanRelayPin, HIGH);
  digitalWrite(ledPin, LOW);
  dht.begin();
}

// --- 7. LOOP ---
void loop() {
  if (Firebase.ready() && (millis() - sendDataPrevMillis > 10000)) {
    sendDataPrevMillis = millis();
    
    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int lightValue = analogRead(lightSensorPin);

    if (!isnan(h) && !isnan(t)) {
      sendSensorData(t, h, lightValue);
      sendActuatorStatus();
    }
  }
}

// --- 8. FUNCIONES DE ENVÍO DE DATOS ---
void sendSensorData(float temp, float hum, int light) {
  FirebaseJson json;
  json.set("temperature", String(temp, 1));
  json.set("humidity", String(hum, 1));
  json.set("light_received", String(light));
  json.set("timestamp", ".sv", "timestamp");

  if (Firebase.RTDB.updateNode(&stream, "/latest_readings", &json)) {
    Serial.println("-> Datos de sensores actualizados.");
  } else {
    Serial.printf("Error al actualizar sensores: %s\n", stream.errorReason().c_str());
  }
}

void sendActuatorStatus() {
  FirebaseJson json;
  json.set("fan", digitalRead(fanRelayPin) == LOW);
  json.set("heater", digitalRead(ledPin) == HIGH);

  if (Firebase.RTDB.updateNode(&stream, "/actuator_status", &json)) {
    Serial.println("-> Estado de actuadores actualizado.");
  } else {
    Serial.printf("Error al actualizar actuadores: %s\n", stream.errorReason().c_str());
  }
}

// Función de conexión WiFi (sin cambios)
void connectToWifi() {
  WiFi.begin(WIFI_SSID);
  Serial.print("Conectando...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n¡Conectado!");
}
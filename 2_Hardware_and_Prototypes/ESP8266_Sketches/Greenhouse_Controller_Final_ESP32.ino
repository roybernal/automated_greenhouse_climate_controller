/*
--------------------------------------------------------------------
Project: Automated Greenhouse Climate Controller (ESP32 Version)
File: Greenhouse_Controller_Final_ESP32.ino
--------------------------------------------------------------------
Description: Firmware final que integra sensores, actuadores,
lógica de riego automático con seguridad y conexión a Firebase.
--------------------------------------------------------------------
*/

#include <WiFi.h> // Librería para ESP32
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include "DHT.h"
#include <Firebase_ESP_Client.h>
#include "addons/TokenHelper.h"

// --- 1. CREDENCIALES ---
const char* WIFI_SSID = "Totalplay-51A8";
const char* WIFI_PASSWORD = "51A888D6R3V227nU";
#define API_KEY "AIzaSyD7fWCpBesKzl8rwsTzmsRkHuE9S49mvxs"
#define DATABASE_URL "agcroller-default-rtdb.firebaseio.com"

// --- 2. DEFINICIÓN DE PINES (GPIOs ESP32) ---
// Ajusta estos números según tu conexión física
#define DHTPIN 4          // GPIO 4
#define DHTTYPE DHT11

const int growLightPin = 16; // GPIO 16
const int heaterPin = 17;    // GPIO 17
const int fanRelayPin = 18;  // GPIO 18
const int irrigationPin = 19;// GPIO 19 (Bomba de agua)

const int lightSensorPin = 34; // GPIO 34 (Analog Input Only)
const int soilSensorPin = 35;  // GPIO 35 (Analog Input Only)

// --- 3. CONFIGURACIÓN DE RIEGO (US-14) ---
const int DRY_VALUE = 3500; // Valor en seco (calibrar)
const int WET_VALUE = 1500; // Valor en agua (calibrar)
const int MOISTURE_THRESHOLD = 30; // % mínimo para regar
const long PUMP_TIMEOUT = 10000;   // 10 segundos máximo

// --- 4. VARIABLES GLOBALES ---
DHT dht(DHTPIN, DHTTYPE);
FirebaseData stream;
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

unsigned long sendDataPrevMillis = 0;
unsigned long pumpStartTime = 0;
bool isPumpRunning = false;

// --- 5. CALLBACK (Escucha Comandos) ---
void streamCallback(FirebaseStream data) {
  Serial.printf("Comando recibido: %s\n", data.dataPath().c_str());
  
  // Control Manual desde Dashboard (sobreescribe automático momentáneamente)
  if (data.dataPath() == "/fan") digitalWrite(fanRelayPin, data.boolData() ? LOW : HIGH);
  if (data.dataPath() == "/heater") digitalWrite(heaterPin, data.boolData() ? HIGH : LOW);
  if (data.dataPath() == "/led_light") digitalWrite(growLightPin, data.boolData() ? HIGH : LOW);
  
  if (data.dataPath() == "/irrigation" && data.boolData()) {
    // Iniciar ciclo de riego manual
    digitalWrite(irrigationPin, LOW); // ON (Relé activo bajo)
    pumpStartTime = millis();
    isPumpRunning = true;
    Serial.println("Riego Manual INICIADO");
  }
}

void streamTimeoutCallback(bool timeout) { if(timeout) Serial.println("Stream timeout..."); }

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) { Serial.print("."); delay(500); }
  Serial.println(" Conectado!");

  // Configuración Firebase
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;
  Firebase.reconnectWiFi(true);
  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.RTDB.beginStream(&stream, "/actuator_controls");
  Firebase.RTDB.setStreamCallback(&stream, streamCallback, streamTimeoutCallback);

  // Configuración Pines
  pinMode(growLightPin, OUTPUT);
  pinMode(heaterPin, OUTPUT);
  pinMode(fanRelayPin, OUTPUT);
  pinMode(irrigationPin, OUTPUT);
  
  // Apagar todo al inicio
  digitalWrite(fanRelayPin, HIGH); 
  digitalWrite(heaterPin, LOW);
  digitalWrite(growLightPin, LOW);
  digitalWrite(irrigationPin, HIGH); // HIGH = OFF para relés activos en bajo

  dht.begin();
}

void loop() {
  // --- A. SEGURIDAD DE BOMBA (Timeout) ---
  if (isPumpRunning && (millis() - pumpStartTime > PUMP_TIMEOUT)) {
    digitalWrite(irrigationPin, HIGH); // Apagar bomba forzosamente
    isPumpRunning = false;
    Serial.println("SEGURIDAD: Bomba apagada por tiempo máximo.");
    // Actualizar Firebase para apagar el botón
    Firebase.RTDB.setBool(&fbdo, "/actuator_controls/irrigation", false); 
  }

  // --- B. LECTURA Y LÓGICA AUTOMÁTICA (Cada 5s) ---
  if (millis() - sendDataPrevMillis > 5000) {
    sendDataPrevMillis = millis();

    float h = dht.readHumidity();
    float t = dht.readTemperature();
    int light = analogRead(lightSensorPin);
    int soilRaw = analogRead(soilSensorPin);
    
    // Convertir humedad suelo a porcentaje
    int soilPercent = map(soilRaw, DRY_VALUE, WET_VALUE, 0, 100);
    soilPercent = constrain(soilPercent, 0, 100);

    // Lógica de Riego Automático
    if (soilPercent < MOISTURE_THRESHOLD && !isPumpRunning) {
      Serial.println("AUTO: Suelo seco detectado. Iniciando riego...");
      digitalWrite(irrigationPin, LOW); // ON
      pumpStartTime = millis();
      isPumpRunning = true;
      Firebase.RTDB.setBool(&fbdo, "/actuator_controls/irrigation", true);
    }

    // Enviar a Firebase
    if (!isnan(h) && !isnan(t)) {
      FirebaseJson json;
      json.set("temperature", t);
      json.set("humidity", h);
      json.set("light_received", light);
      json.set("soil_moisture", soilPercent);
      json.set("timestamp", ".sv", "timestamp");
      
      Firebase.RTDB.updateNode(&fbdo, "/latest_readings", &json);
      Firebase.RTDB.pushJSON(&fbdo, "/sensor_logs", &json); // Historial
    }
  }
}